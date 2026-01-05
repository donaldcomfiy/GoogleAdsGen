import React, { useState, useRef } from 'react';
import { AdData, InputState, TextStyle } from './types';
import { generateAdCopy, suggestKeywords } from './services/geminiService';
import { InputForm } from './components/InputForm';
import { AdEditor } from './components/AdEditor';
import { AdPreview } from './components/AdPreview';
import { exportToCSV, exportProjectFile } from './utils/exportUtils';
import { Download, LayoutTemplate, Save, Upload } from 'lucide-react';

const initialAdData: AdData = {
  headlines: [
    { id: 'h1-1', text: '', type: 'headline', pinnedPosition: 1 },
    { id: 'h2-1', text: '', type: 'headline', pinnedPosition: 2 },
    { id: 'h3-1', text: '', type: 'headline', pinnedPosition: 3 }
  ],
  descriptions: [
    { id: 'd1', text: '', type: 'description' },
    { id: 'd2', text: '', type: 'description' }
  ],
  finalUrl: '',
  displayPath1: '',
  displayPath2: ''
};

const DEFAULT_TAGS: Record<TextStyle, string[]> = {
  'GENERIC': ['Angebote', 'Auswahl', 'Online kaufen', 'Versand', 'Qualität'],
  'BRAND': ['Brand', 'Brandname', 'Unternehmensname', 'Markenname', 'Name'],
  'PROBLEM': ['Schmerzpunkte', 'Risiko vermeiden', 'Zeitdruck', 'Frustration', 'Kosten'],
  'SOLUTION': ['Ergebnis', 'Einfachheit', 'Gewinn', 'Sicherheit', 'Komfort'],
  'QUESTION': ['Was', 'Wie', 'Warum', 'Wann', 'Wer'],
  'CTA': ['Jetzt kaufen', 'Anmelden', 'Infos sichern', 'Bestellen', 'Kontaktieren'],
  'PRODUCT': ['Produktname', 'Hauptmerkmal', 'Kategorie', 'Spezifikation', 'Modell'],
  'SERVICE': ['Beratung', 'Expertise', 'Kundenservice', 'Individuell', 'Erfahrung']
};

function App() {
  const [adData, setAdData] = useState<AdData>(initialAdData);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [inputState, setInputState] = useState<InputState>({
    url: '',
    keywords: '',
    extractedKeywords: [],
    selectedStyles: ['GENERIC'],
    stylePreferences: {
      'GENERIC': { activeTags: [...DEFAULT_TAGS.GENERIC], userTags: [] },
      'BRAND': { activeTags: [...DEFAULT_TAGS.BRAND], userTags: [] },
      'PROBLEM': { activeTags: [...DEFAULT_TAGS.PROBLEM], userTags: [] },
      'SOLUTION': { activeTags: [...DEFAULT_TAGS.SOLUTION], userTags: [] },
      'QUESTION': { activeTags: [...DEFAULT_TAGS.QUESTION], userTags: [] },
      'CTA': { activeTags: [...DEFAULT_TAGS.CTA], userTags: [] },
      'PRODUCT': { activeTags: [...DEFAULT_TAGS.PRODUCT], userTags: [] },
      'SERVICE': { activeTags: [...DEFAULT_TAGS.SERVICE], userTags: [] },
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuggestKeywords = async () => {
    if (!inputState.url && !inputState.htmlContent && !inputState.pdfContent) {
      setError("Bitte URL eingeben oder Dokument hochladen.");
      return;
    }
    if (inputState.selectedStyles.length === 0) {
        setError("Bitte wählen Sie mindestens einen Anzeigenstil aus.");
        return;
    }
    setSuggesting(true);
    setError(null);
    try {
      const keywords = await suggestKeywords(
        inputState.url, 
        inputState.selectedStyles, 
        inputState.stylePreferences, 
        inputState.htmlContent,
        inputState.pdfContent
      );
      setInputState(prev => ({ 
        ...prev, 
        extractedKeywords: keywords,
        keywords: keywords.join(", ") 
      }));
    } catch (err) {
      setError("Konnte Keywords nicht automatisch ermitteln. Bitte manuell eingeben.");
    } finally {
      setSuggesting(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      setAdData(prev => ({ ...prev, finalUrl: inputState.url }));
      
      let currentKeywords = inputState.keywords;
      
      if (!currentKeywords.trim()) {
         try {
           const generatedKeywords = await suggestKeywords(
             inputState.url, 
             inputState.selectedStyles, 
             inputState.stylePreferences,
             inputState.htmlContent,
             inputState.pdfContent
           );
           currentKeywords = generatedKeywords.join(", ");
           setInputState(prev => ({ 
             ...prev, 
             extractedKeywords: generatedKeywords,
             keywords: currentKeywords 
           }));
         } catch (e) {
           throw new Error("Bitte geben Sie Keywords ein oder stellen Sie sicher, dass Inhalte (URL/Dokument) verfügbar sind.");
         }
      }

      const generatedData = await generateAdCopy(
        inputState.url, 
        currentKeywords, 
        inputState.selectedStyles, 
        inputState.stylePreferences,
        inputState.htmlContent,
        inputState.pdfContent
      );
      
      setAdData(prev => ({
        ...prev,
        headlines: generatedData.headlines || prev.headlines,
        descriptions: generatedData.descriptions || prev.descriptions
      }));
    } catch (err: any) {
      setError(err.message || "Fehler bei der Generierung. Bitte überprüfen Sie Ihre Eingaben.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(adData);
  };

  const handleSaveProject = () => {
    exportProjectFile(adData, inputState);
  };

  const handleLoadProjectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.adData && json.inputState) {
          setAdData(json.adData);
          setInputState(json.inputState);
          setError(null);
        } else {
          setError("Ungültiges Dateiformat. Bitte wähle eine korrekte JSON-Projektdatei.");
        }
      } catch (err) {
        setError("Fehler beim Lesen der Datei.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <LayoutTemplate className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 hidden sm:block">
              Google Ads Generator
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json" 
              className="hidden" 
            />
            
            <div className="flex items-center gap-1 border-r border-gray-200 pr-3 mr-1">
              <button
                onClick={handleSaveProject}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                title="Projekt speichern (JSON)"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Speichern</span>
              </button>
              
              <button
                onClick={handleLoadProjectClick}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                title="Projekt laden (JSON)"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Laden</span>
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV Export</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <InputForm 
              inputState={inputState}
              setInputState={setInputState}
              onGenerate={handleGenerate} 
              onSuggestKeywords={handleSuggestKeywords}
              isLoading={loading}
              isSuggesting={suggesting}
            />
            <AdEditor adData={adData} setAdData={setAdData} />
          </div>

          <div className="lg:col-span-5 relative">
            <AdPreview adData={adData} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;