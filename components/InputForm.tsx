import React, { useState, useRef } from 'react';
import { InputState, TextStyle } from '../types';
import { Loader2, Wand2, Sparkles, Target, HelpCircle, AlertCircle, CheckCircle, Store, Megaphone, ChevronDown, ChevronUp, Plus, X, ArrowUp, ArrowDown, Package, FileUp, FileCode, Briefcase, SearchCode, Tag, FileText } from 'lucide-react';

interface InputFormProps {
  inputState: InputState;
  setInputState: React.Dispatch<React.SetStateAction<InputState>>;
  onGenerate: () => void;
  onSuggestKeywords: () => void;
  isLoading: boolean;
  isSuggesting: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ 
  inputState, 
  setInputState, 
  onGenerate, 
  onSuggestKeywords,
  isLoading, 
  isSuggesting 
}) => {
  const [expandedStyle, setExpandedStyle] = useState<TextStyle | null>(null);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const htmlFileInputRef = useRef<HTMLInputElement>(null);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);

  const styles: { value: TextStyle; label: string; description: string; icon: React.ReactNode }[] = [
    { value: 'GENERIC', label: 'Generisch', description: 'Vorteile & Angebote', icon: <Store className="w-4 h-4" /> },
    { value: 'PRODUCT', label: 'Produkt', description: 'Rein Produkt-fokussiert', icon: <Package className="w-4 h-4" /> },
    { value: 'SERVICE', label: 'Dienstleistung', description: 'Beratung & Kompetenz', icon: <Briefcase className="w-4 h-4" /> },
    { value: 'BRAND', label: 'Brand', description: 'Image & Vertrauen', icon: <Target className="w-4 h-4" /> },
    { value: 'PROBLEM', label: 'Problem', description: 'Pain Points', icon: <AlertCircle className="w-4 h-4" /> },
    { value: 'SOLUTION', label: 'Lösung', description: 'Ergebnis & Nutzen', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'QUESTION', label: 'Fragen', description: 'Neugier wecken', icon: <HelpCircle className="w-4 h-4" /> },
    { value: 'CTA', label: 'CTA', description: 'Handlungsaufruf', icon: <Megaphone className="w-4 h-4" /> },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((inputState.url || inputState.htmlContent || inputState.pdfContent) && inputState.selectedStyles.length > 0) {
      onGenerate();
    }
  };

  const updateField = <K extends keyof InputState>(field: K, value: InputState[K]) => {
    setInputState(prev => ({ ...prev, [field]: value }));
  };

  const handleHtmlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const html = event.target?.result as string;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const scripts = doc.querySelectorAll('script, style, noscript, svg, footer, nav, iframe');
      scripts.forEach(s => s.remove());
      const h1s = Array.from(doc.querySelectorAll('h1')).map(h => h.innerText.trim()).filter(Boolean);
      const h2s = Array.from(doc.querySelectorAll('h2')).map(h => h.innerText.trim()).filter(Boolean);
      const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const cleanedText = `
        TITLE: ${doc.title}
        META DESCRIPTION: ${metaDesc}
        HEADINGS H1: ${h1s.join(' | ')}
        HEADINGS H2: ${h2s.join(' | ')}
        BODY TEXT: ${doc.body.innerText.replace(/\s+/g, ' ').trim().substring(0, 15000)}
      `;
      setInputState(prev => ({ ...prev, htmlContent: cleanedText, fileName: file.name }));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = (event.target?.result as string).split(',')[1];
      setInputState(prev => ({ ...prev, pdfContent: base64String, pdfFileName: file.name }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeHtmlFile = () => setInputState(prev => ({ ...prev, htmlContent: undefined, fileName: undefined }));
  const removePdfFile = () => setInputState(prev => ({ ...prev, pdfContent: undefined, pdfFileName: undefined }));

  const addStyle = (style: TextStyle) => {
    if (inputState.selectedStyles.length < 3 && !inputState.selectedStyles.includes(style)) {
      setInputState(prev => ({ ...prev, selectedStyles: [...prev.selectedStyles, style] }));
      setExpandedStyle(style);
    }
  };

  const removeStyle = (style: TextStyle) => {
    setInputState(prev => ({ ...prev, selectedStyles: prev.selectedStyles.filter(s => s !== style) }));
    if (expandedStyle === style) setExpandedStyle(null);
  };

  const moveStyle = (index: number, direction: 'up' | 'down') => {
    setInputState(prev => {
      const newStyles = [...prev.selectedStyles];
      if (direction === 'up' && index > 0) {
        [newStyles[index], newStyles[index - 1]] = [newStyles[index - 1], newStyles[index]];
      } else if (direction === 'down' && index < newStyles.length - 1) {
        [newStyles[index], newStyles[index + 1]] = [newStyles[index + 1], newStyles[index]];
      }
      return { ...prev, selectedStyles: newStyles };
    });
  };

  const toggleTag = (style: TextStyle, tag: string) => {
    setInputState(prev => {
      const pref = prev.stylePreferences[style];
      const isActive = pref.activeTags.includes(tag);
      const newActiveTags = isActive ? pref.activeTags.filter(t => t !== tag) : [...pref.activeTags, tag];
      return { ...prev, stylePreferences: { ...prev.stylePreferences, [style]: { ...pref, activeTags: newActiveTags } } };
    });
  };

  const addCustomTag = (style: TextStyle) => {
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim();
    setInputState(prev => {
      const pref = prev.stylePreferences[style];
      if (pref.userTags.includes(tag) || pref.activeTags.includes(tag)) return prev;
      return { ...prev, stylePreferences: { ...prev.stylePreferences, [style]: { ...pref, userTags: [...pref.userTags, tag], activeTags: [...pref.activeTags, tag] } } };
    });
    setNewTagInput('');
  };

  const renderActiveStyleItem = (styleValue: TextStyle, index: number) => {
    const styleDef = styles.find(s => s.value === styleValue);
    if (!styleDef) return null;

    const isExpanded = expandedStyle === styleValue;
    const preferences = inputState.stylePreferences[styleValue];
    
    const defaultTagsForStyle = {
        'GENERIC': ['Angebote', 'Auswahl', 'Online kaufen', 'Versand', 'Qualität'],
        'PRODUCT': ['Produktname', 'Hauptmerkmal', 'Kategorie', 'Spezifikation', 'Modell'],
        'SERVICE': ['Beratung', 'Expertise', 'Kundenservice', 'Individuell', 'Erfahrung'],
        'BRAND': ['Brand', 'Brandname', 'Unternehmensname', 'Markenname', 'Name'],
        'PROBLEM': ['Schmerzpunkte', 'Risiko vermeiden', 'Zeitdruck', 'Frustration', 'Kosten'],
        'SOLUTION': ['Ergebnis', 'Einfachheit', 'Gewinn', 'Sicherheit', 'Komfort'],
        'QUESTION': ['Was', 'Wie', 'Warum', 'Wann', 'Wer'],
        'CTA': ['Jetzt kaufen', 'Anmelden', 'Infos sichern', 'Bestellen', 'Kontaktieren']
    }[styleValue] || [];
    const allDisplayTags = Array.from(new Set([...defaultTagsForStyle, ...preferences.userTags]));

    return (
      <div key={styleValue} className="border border-blue-200 rounded-lg bg-white shadow-sm mb-3 overflow-hidden transition-all">
        <div className="flex items-center p-3 bg-blue-50/50">
          <div className="flex flex-col items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm mr-3 shadow-sm shrink-0">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0" onClick={() => setExpandedStyle(isExpanded ? null : styleValue)}>
            <div className="flex items-center gap-2 cursor-pointer">
               <span className="text-blue-600">{styleDef.icon}</span>
               <span className="font-semibold text-gray-900 truncate">{styleDef.label}</span>
            </div>
            <p className="text-xs text-gray-500 truncate">{styleDef.description}</p>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <div className="flex flex-col gap-0.5 mr-2">
              <button type="button" disabled={index === 0} onClick={() => moveStyle(index, 'up')} className="p-0.5 text-gray-400 hover:text-blue-600 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
              <button type="button" disabled={index === inputState.selectedStyles.length - 1} onClick={() => moveStyle(index, 'down')} className="p-0.5 text-gray-400 hover:text-blue-600 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
            </div>
            <button type="button" onClick={() => setExpandedStyle(isExpanded ? null : styleValue)} className={`p-1.5 rounded-md transition-colors ${isExpanded ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:bg-gray-100'}`}><ChevronUp className={`w-4 h-4 transition-transform ${!isExpanded ? 'rotate-180' : ''}`} /></button>
            <button type="button" onClick={() => removeStyle(styleValue)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors ml-1"><X className="w-4 h-4" /></button>
          </div>
        </div>
        {isExpanded && (
          <div className="border-t border-blue-100 p-3 bg-white animate-in slide-in-from-top-1">
             <p className="text-xs font-semibold text-gray-500 mb-2 uppercase flex items-center gap-1"><Sparkles className="w-3 h-3" /> Themen & Keywords</p>
             <div className="flex flex-wrap gap-2 mb-3">
                 {allDisplayTags.map(tag => {
                     const active = preferences.activeTags.includes(tag);
                     return (
                         <button key={tag} type="button" onClick={() => toggleTag(styleValue, tag)} className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1 ${active ? 'bg-blue-100 border-blue-200 text-blue-700 font-medium shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                             {active && <CheckCircle className="w-3 h-3" />}
                             {tag}
                         </button>
                     );
                 })}
             </div>
             <div className="flex gap-2">
                 <input type="text" placeholder="Eigenes Keyword hinzufügen..." className="flex-1 text-xs px-2 py-1.5 border border-gray-300 bg-white rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none" value={newTagInput} onChange={(e) => setNewTagInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addCustomTag(styleValue); } }} />
                 <button type="button" onClick={() => addCustomTag(styleValue)} disabled={!newTagInput.trim()} className="bg-white border border-gray-300 text-gray-600 hover:text-blue-600 hover:border-blue-400 rounded px-3 py-1.5 disabled:opacity-50 transition-all"><Plus className="w-4 h-4" /></button>
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Wand2 className="w-5 h-5 text-blue-600" /> Input & Generierung</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">Landingpage URL</label>
            <input id="url" type="url" placeholder="https://www.beispiel.de/produkt" value={inputState.url} onChange={(e) => updateField('url', e.target.value)} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Optional: HTML Upload</label>
              <input type="file" ref={htmlFileInputRef} onChange={handleHtmlUpload} accept=".html,.htm" className="hidden" />
              {!inputState.fileName ? (
                <button type="button" onClick={() => htmlFileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 border-dashed rounded-md text-gray-600 hover:bg-gray-100 hover:border-blue-400 transition-all text-sm font-medium"><FileUp className="w-4 h-4" /> LP Datei (HTML)</button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                  <FileCode className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs text-blue-700 font-medium truncate flex-1">{inputState.fileName}</span>
                  <button type="button" onClick={removeHtmlFile} className="p-1 hover:bg-blue-100 rounded text-blue-400 hover:text-blue-600"><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Optional: PDF Upload</label>
              <input type="file" ref={pdfFileInputRef} onChange={handlePdfUpload} accept=".pdf" className="hidden" />
              {!inputState.pdfFileName ? (
                <button type="button" onClick={() => pdfFileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 border-dashed rounded-md text-gray-600 hover:bg-gray-100 hover:border-red-400 transition-all text-sm font-medium"><FileUp className="w-4 h-4" /> PDF Dokument</button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
                  <FileText className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="text-xs text-red-700 font-medium truncate flex-1">{inputState.pdfFileName}</span>
                  <button type="button" onClick={removePdfFile} className="p-1 hover:bg-red-100 rounded text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in fade-in duration-500">
          <div className="flex justify-between items-center mb-3">
             <h3 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2"><SearchCode className="w-4 h-4 text-blue-500" /> Website Analyse</h3>
             <button type="button" onClick={onSuggestKeywords} disabled={(!inputState.url && !inputState.htmlContent && !inputState.pdfContent) || isSuggesting || isLoading} className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 hover:text-blue-600 hover:border-blue-400 disabled:opacity-50 transition-all font-medium shadow-sm">
                {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-yellow-500" />}
                {isSuggesting ? 'Analysiere...' : 'Inhalt scannen'}
              </button>
          </div>
          <div className="min-h-[60px] flex flex-wrap gap-2">
            {isSuggesting ? (
              <div className="w-full flex items-center justify-center py-4 text-sm text-gray-400 animate-pulse text-center">KI analysiert Dokumente und extrahiert Begriffe...</div>
            ) : inputState.extractedKeywords.length > 0 ? (
              inputState.extractedKeywords.map((keyword, i) => <span key={i} className="bg-blue-100 text-blue-700 text-[11px] px-2.5 py-1 rounded-full border border-blue-200 font-medium flex items-center gap-1 shadow-sm"><Tag className="w-2.5 h-2.5" /> {keyword}</span>)
            ) : (
              <div className="w-full flex items-center justify-center py-4 text-xs text-gray-400 border border-dashed border-gray-300 rounded-md text-center">Klicke auf "Inhalt scannen", um Begriffe aus LP/Datei zu extrahieren.</div>
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Aktive Strategie <span className="text-gray-400 font-normal">(Position 1-3)</span></label>
            <span className={`text-xs px-2 py-0.5 rounded-full ${inputState.selectedStyles.length === 3 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{inputState.selectedStyles.length} / 3</span>
          </div>
          {inputState.selectedStyles.length > 0 ? (
            <div className="mb-4">{inputState.selectedStyles.map((style, index) => renderActiveStyleItem(style, index))}</div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg mb-4 bg-gray-50 text-gray-400 text-sm">Wähle unten Stile aus.</div>
          )}
          {inputState.selectedStyles.length < 3 && (
             <div className="mt-4 animate-in fade-in duration-300">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 tracking-wide">Stile hinzufügen</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {styles.filter(s => !inputState.selectedStyles.includes(s.value)).map((style) => (
                      <button key={style.value} type="button" onClick={() => addStyle(style.value)} className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all text-left group">
                         <div className="text-gray-400 group-hover:text-blue-500 transition-colors">{style.icon}</div>
                         <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700 truncate">{style.label}</span>
                         <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 text-blue-400 shrink-0" />
                      </button>
                    ))}
                </div>
             </div>
          )}
        </div>
        
        <div className="pt-2 border-t border-gray-100">
          <label htmlFor="keywords" className="block text-sm font-medium text-gray-700">Finale Keyword-Liste</label>
          <textarea id="keywords" rows={3} placeholder="Begriffe durch Komma trennen..." value={inputState.keywords} onChange={(e) => updateField('keywords', e.target.value)} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-colors resize-none text-sm mt-1" />
        </div>

        <button type="submit" disabled={isLoading || (!inputState.url && !inputState.htmlContent && !inputState.pdfContent) || inputState.selectedStyles.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
          {isLoading ? 'Verarbeite...' : 'Anzeigen Generieren'}
        </button>
      </form>
    </div>
  );
};