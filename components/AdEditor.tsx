import React from 'react';
import { AdData, AdAsset } from '../types';
import { Trash2, Plus, GripVertical, MapPin, List, MousePointerClick } from 'lucide-react';

interface AdEditorProps {
  adData: AdData;
  setAdData: React.Dispatch<React.SetStateAction<AdData>>;
}

interface AssetInputProps { 
  asset: AdAsset; 
  limit: number; 
  onUpdate: (id: string, text: string) => void;
  onRemove: (id: string) => void;
}

const AssetInput: React.FC<AssetInputProps> = ({ asset, limit, onUpdate, onRemove }) => {
  const length = asset.text.length;
  const isOverLimit = length > limit;

  return (
    <div className="flex items-center gap-2 mb-2 group">
      <GripVertical className="w-4 h-4 text-gray-300 cursor-move" />
      <div className="relative flex-1">
        <input
          type="text"
          value={asset.text}
          onChange={(e) => onUpdate(asset.id, e.target.value)}
          className={`w-full px-3 py-2 pr-16 text-sm border rounded-md outline-none focus:ring-2 transition-colors ${
            isOverLimit 
              ? 'border-red-500 focus:ring-red-200 bg-red-50' 
              : 'border-gray-300 focus:ring-blue-100 focus:border-blue-400 bg-white'
          }`}
        />
        <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium pointer-events-none ${
          isOverLimit ? 'text-red-600' : 'text-gray-400'
        }`}>
          {length}/{limit}
        </span>
      </div>
      <button 
        onClick={() => onRemove(asset.id)}
        className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
        title="Entfernen"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export const AdEditor: React.FC<AdEditorProps> = ({ adData, setAdData }) => {
  
  const updateHeadline = (id: string, newText: string) => {
    setAdData(prev => ({
      ...prev,
      headlines: prev.headlines.map(h => h.id === id ? { ...h, text: newText } : h)
    }));
  };

  const updateDescription = (id: string, newText: string) => {
    setAdData(prev => ({
      ...prev,
      descriptions: prev.descriptions.map(d => d.id === id ? { ...d, text: newText } : d)
    }));
  };

  const removeAsset = (type: 'headline' | 'description', id: string) => {
    setAdData(prev => ({
      ...prev,
      [type === 'headline' ? 'headlines' : 'descriptions']: prev[type === 'headline' ? 'headlines' : 'descriptions'].filter(a => a.id !== id)
    }));
  };

  const addHeadline = (position: 1 | 2 | 3) => {
    const newAsset: AdAsset = {
      id: crypto.randomUUID(),
      text: '',
      type: 'headline',
      pinnedPosition: position
    };
    setAdData(prev => ({
      ...prev,
      headlines: [...prev.headlines, newAsset]
    }));
  };

  const addDescription = () => {
    const newAsset: AdAsset = {
      id: crypto.randomUUID(),
      text: '',
      type: 'description'
    };
    setAdData(prev => ({
      ...prev,
      descriptions: [...prev.descriptions, newAsset]
    }));
  };

  const updatePath = (field: 'displayPath1' | 'displayPath2', value: string) => {
    setAdData(prev => ({ ...prev, [field]: value }));
  };

  const getHeadlinesByPosition = (pos: 1 | 2 | 3) => {
    return adData.headlines.filter(h => h.pinnedPosition === pos);
  };

  const renderHeadlineSection = (pos: 1 | 2 | 3, title: string, subtitle: string, icon: React.ReactNode) => {
    const headlines = getHeadlinesByPosition(pos);
    const max = 5;
    
    if (headlines.length === 0 && pos !== 1) {
        return null; 
    }

    return (
      <div className="mb-6 p-4 bg-gray-50/50 rounded-lg border border-gray-100">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-600 rounded-md">{icon}</span>
            <div>
              <label className="text-sm font-bold text-gray-800 uppercase tracking-wide block">
                {title}
              </label>
              <span className="text-xs text-gray-400 font-normal">{subtitle}</span>
            </div>
          </div>
          <span className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded border border-gray-200">{headlines.length} / {max}</span>
        </div>
        <div className="space-y-1">
          {headlines.map(asset => (
            <AssetInput 
              key={asset.id} 
              asset={asset} 
              limit={30} 
              onUpdate={updateHeadline}
              onRemove={(id) => removeAsset('headline', id)}
            />
          ))}
        </div>
        {headlines.length < max && (
          <button 
            onClick={() => addHeadline(pos)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity"
          >
            <Plus className="w-3 h-3" /> Headline hinzufügen
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Anzeigen Assets</h2>
      
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
           <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Pfad 1 (Optional)</label>
           <input 
              type="text" 
              maxLength={15}
              value={adData.displayPath1}
              onChange={(e) => updatePath('displayPath1', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              placeholder="z.B. Angebot"
           />
        </div>
        <div>
           <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Pfad 2 (Optional)</label>
           <input 
              type="text" 
              maxLength={15}
              value={adData.displayPath2}
              onChange={(e) => updatePath('displayPath2', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              placeholder="z.B. Kaufen"
           />
        </div>
      </div>

      <div className="my-6 border-t border-gray-100"></div>

      {renderHeadlineSection(1, "Position 1", "Anzeigenstil 1", <MapPin className="w-4 h-4" />)}
      {renderHeadlineSection(2, "Position 2", "Anzeigenstil 2", <List className="w-4 h-4" />)}
      {renderHeadlineSection(3, "Position 3", "Anzeigenstil 3", <MousePointerClick className="w-4 h-4" />)}

      <div className="my-6 border-t border-gray-100"></div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Beschreibungen (Descriptions)
          </label>
          <span className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200">{adData.descriptions.length} / 4</span>
        </div>
        <div className="space-y-1">
          {adData.descriptions.map(asset => (
            <AssetInput 
              key={asset.id} 
              asset={asset} 
              limit={90} 
              onUpdate={updateDescription}
              onRemove={(id) => removeAsset('description', id)}
            />
          ))}
        </div>
        {adData.descriptions.length < 4 && (
          <button 
            onClick={addDescription}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Beschreibung hinzufügen
          </button>
        )}
      </div>
    </div>
  );
};