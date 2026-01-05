import React, { useState } from 'react';
import { AdData, DeviceView } from '../types';
import { Smartphone, Monitor, Info, RotateCw } from 'lucide-react';

interface AdPreviewProps {
  adData: AdData;
}

export const AdPreview: React.FC<AdPreviewProps> = ({ adData }) => {
  const [device, setDevice] = useState<DeviceView>(DeviceView.MOBILE);
  // We use a simple counter to "shuffle" the preview
  const [shuffleIndex, setShuffleIndex] = useState(0);

  // Helper to extract domain from URL for display
  const getDisplayUrl = (url: string) => {
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      let domain = u.hostname;
      if (domain.startsWith('www.')) domain = domain.slice(4);
      
      let path = '';
      if (adData.displayPath1) path += ` › ${adData.displayPath1}`;
      if (adData.displayPath2) path += ` › ${adData.displayPath2}`;
      
      return { domain, path };
    } catch {
      return { domain: 'example.com', path: '' };
    }
  };

  const { domain, path } = getDisplayUrl(adData.finalUrl || 'example.com');

  // Intelligent Preview Selection based on Pinning
  const getPreviewText = () => {
    // Helper to get a rotated item from array
    const getItem = (arr: any[]) => {
      if (arr.length === 0) return null;
      return arr[shuffleIndex % arr.length].text;
    };

    const h1List = adData.headlines.filter(h => h.pinnedPosition === 1 && h.text.trim());
    const h2List = adData.headlines.filter(h => h.pinnedPosition === 2 && h.text.trim());
    const h3List = adData.headlines.filter(h => h.pinnedPosition === 3 && h.text.trim());

    const h1 = getItem(h1List);
    const h2 = getItem(h2List);
    const h3 = getItem(h3List);

    // Dynamic join: Only show positions that actually have content
    const parts = [h1, h2, h3].filter(Boolean);
    
    // Fallback if absolutely nothing exists
    const headline = parts.length > 0 ? parts.join(" | ") : "Ihre Headline hier";

    const dList = adData.descriptions.filter(d => d.text.trim());
    const d1 = getItem(dList) || "Hier steht Ihre Beschreibung.";

    return { 
      headline,
      description: d1
    };
  };

  const { headline, description } = getPreviewText();

  return (
    <div className="sticky top-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header / Controls */}
        <div className="border-b border-gray-200 px-4 py-3 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Vorschau</h3>
          <div className="flex gap-2">
            <button 
                onClick={() => setShuffleIndex(prev => prev + 1)}
                className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-blue-600 px-2 py-1 rounded hover:bg-white transition-colors"
                title="Andere Kombination testen"
            >
                <RotateCw className="w-3 h-3" />
                Mix
            </button>
            <div className="flex bg-gray-200 rounded-lg p-1">
                <button
                onClick={() => setDevice(DeviceView.MOBILE)}
                className={`p-1.5 rounded-md transition-all ${
                    device === DeviceView.MOBILE ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Mobile Vorschau"
                >
                <Smartphone className="w-4 h-4" />
                </button>
                <button
                onClick={() => setDevice(DeviceView.DESKTOP)}
                className={`p-1.5 rounded-md transition-all ${
                    device === DeviceView.DESKTOP ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Desktop Vorschau"
                >
                <Monitor className="w-4 h-4" />
                </button>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="p-6 bg-gray-100 min-h-[300px] flex flex-col items-center justify-center">
          
          <div 
            className={`bg-white transition-all duration-300 ease-in-out ${
              device === DeviceView.MOBILE ? 'w-[320px] shadow-lg rounded-xl border border-gray-300' : 'w-full max-w-2xl shadow-sm rounded-none border-none bg-transparent'
            }`}
          >
            <div className={`p-4 ${device === DeviceView.MOBILE ? 'bg-white rounded-xl' : 'bg-white rounded-md shadow-sm'}`}>
              
              {/* Ad Label + URL */}
              <div className="flex items-center gap-2 mb-1 leading-snug">
                <span className="font-bold text-black text-[11px] sm:text-xs">Anzeige</span>
                <span className="text-gray-600 text-[10px] sm:text-xs truncate">
                  {domain}{path}
                </span>
                <div className="ml-auto">
                    {/* Ellipsis menu icon simulation */}
                    <div className="flex gap-[2px]">
                        <div className="w-[3px] h-[3px] rounded-full bg-gray-500"></div>
                        <div className="w-[3px] h-[3px] rounded-full bg-gray-500"></div>
                        <div className="w-[3px] h-[3px] rounded-full bg-gray-500"></div>
                    </div>
                </div>
              </div>

              {/* Headline */}
              <div className="mb-1">
                <a href="#" className="text-[#1a0dab] hover:underline text-[18px] sm:text-xl leading-6 font-normal break-words block">
                  {headline}
                </a>
              </div>

              {/* Description */}
              <div className="text-gray-600 text-sm leading-6 break-words">
                {description}
              </div>

              {/* Sitelinks placeholder (visual enhancement) */}
              <div className="mt-4 flex gap-4 text-[#1a0dab] text-sm hidden sm:flex">
                <span className="hover:underline cursor-pointer">Kontakt</span>
                <span className="hover:underline cursor-pointer">Angebote</span>
                <span className="hover:underline cursor-pointer">Über uns</span>
                <span className="hover:underline cursor-pointer">Shop</span>
              </div>
            </div>
          </div>

          <p className="mt-8 text-xs text-gray-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Vorschau rotiert beim Klick auf "Mix" durch die Varianten.
          </p>

        </div>
      </div>
    </div>
  );
};