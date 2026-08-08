import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { MapPin, Search, Compass, AlertCircle, Heart } from 'lucide-react';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface GeoTagMapProps {
  mode: 'select' | 'view';
  selectedPos?: { lat: number; lng: number } | null;
  onSelectPos?: (pos: { lat: number; lng: number; locationName: string }) => void;
  markers?: Array<{
    id: string;
    title: string;
    mood: number;
    tag: string;
    date: string;
    entry: string;
    geoTag: { lat: number; lng: number; locationName: string };
  }>;
}

export default function GeoTagMap({ mode, selectedPos, onSelectPos, markers = [] }: GeoTagMapProps) {
  const [clickPos, setClickPos] = useState<{ lat: number; lng: number } | null>(selectedPos || null);
  const [customName, setCustomName] = useState('');
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPos) {
      setClickPos(selectedPos);
    }
  }, [selectedPos]);

  if (!hasValidKey) {
    return (
      <div className="p-6 rounded-2xl border-2 border-dashed border-[#c9a45c]/40 bg-amber-50/5 flex flex-col items-center justify-center text-center space-y-4 py-12">
        <div className="w-12 h-12 rounded-full bg-[#c9a45c]/10 flex items-center justify-center text-[#c9a45c]">
          <AlertCircle className="w-6 h-6 animate-pulse" />
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="font-serif text-lg font-bold text-[#c9a45c]">Google Maps API Key Required</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Configure geo-tagging on Earth for special places! Users can add notes to physical locations for free once set up.
          </p>
          <div className="text-left text-[11px] bg-black/25 border border-brown/30 p-3.5 rounded-xl space-y-1.5 text-slate-300 font-mono">
            <p className="text-[#c9a45c] font-bold">To add your API key:</p>
            <p>1. Open <strong className="text-white">Settings</strong> (⚙️ gear icon, top-right corner)</p>
            <p>2. Choose <strong className="text-white">Secrets</strong></p>
            <p>3. Create a secret named: <code className="text-white bg-slate-800 px-1 py-0.5 rounded">GOOGLE_MAPS_PLATFORM_KEY</code></p>
            <p>4. Paste your key and press <strong className="text-white">Enter</strong>.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleMapClick = (e: any) => {
    if (mode !== 'select') return;
    const lat = e.detail.latLng?.lat;
    const lng = e.detail.latLng?.lng;
    if (lat !== undefined && lng !== undefined) {
      setClickPos({ lat, lng });
    }
  };

  const handleConfirmLocation = () => {
    if (clickPos && onSelectPos) {
      onSelectPos({
        lat: clickPos.lat,
        lng: clickPos.lng,
        locationName: customName.trim() || `Sanctuary Spot (${clickPos.lat.toFixed(4)}, ${clickPos.lng.toFixed(4)})`
      });
    }
  };

  return (
    <div className="space-y-4">
      {mode === 'select' && (
        <div className="p-4 rounded-xl bg-black/15 border border-brown/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <MapPin className="w-5 h-5 text-[#c9a45c] shrink-0" />
            <div className="text-left">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#c9a45c] block">Location Label</span>
              <input
                type="text"
                placeholder="Ex: Mt. Olympus Quiet Cave"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="bg-transparent text-xs text-white border-b border-brown focus:border-[#c9a45c] outline-none py-1 w-full sm:w-64"
              />
            </div>
          </div>
          <button
            onClick={handleConfirmLocation}
            disabled={!clickPos}
            className={`w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-all ${
              clickPos
                ? 'bg-[#c9a45c] hover:bg-[#c9a45c]/80 text-black cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            ✦ Geo-Tag this Spot
          </button>
        </div>
      )}

      <div className="relative rounded-2xl overflow-hidden border border-brown/30 h-[380px] shadow-lg">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            defaultCenter={clickPos || { lat: 37.42, lng: -122.084 }}
            defaultZoom={4}
            mapId="DEMO_MAP_ID"
            onClick={handleMapClick}
            gestureHandling="greedy"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Selection pin */}
            {mode === 'select' && clickPos && (
              <AdvancedMarker position={clickPos}>
                <Pin background="#c9a45c" glyphColor="#000" scale={1.2}>
                  <Compass className="w-4 h-4 text-black animate-spin" />
                </Pin>
              </AdvancedMarker>
            )}

            {/* View pins */}
            {mode === 'view' &&
              markers.map((marker) => {
                const isSelected = activeMarkerId === marker.id;
                return (
                  <div key={marker.id}>
                    <AdvancedMarker
                      position={marker.geoTag}
                      onClick={() => setActiveMarkerId(isSelected ? null : marker.id)}
                    >
                      <Pin background={marker.mood > 70 ? '#22c55e' : marker.mood < 40 ? '#e07070' : '#c9a45c'}>
                        <span className="text-[10px] text-white">🪷</span>
                      </Pin>
                    </AdvancedMarker>

                    {isSelected && (
                      <InfoWindow
                        position={marker.geoTag}
                        onCloseClick={() => setActiveMarkerId(null)}
                      >
                        <div className="p-2 text-slate-800 max-w-xs text-left">
                          <span className="text-[9px] font-mono uppercase text-[#c9a45c] block font-bold">
                            {marker.geoTag.locationName}
                          </span>
                          <h4 className="font-serif text-sm font-bold mt-0.5 text-stone-900">{marker.title}</h4>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Mood: <span className="font-bold">{marker.mood}/100</span> &middot; {marker.date}
                          </p>
                          <p className="text-xs leading-relaxed mt-2 text-stone-800 line-clamp-3">
                            {marker.entry}
                          </p>
                        </div>
                      </InfoWindow>
                    )}
                  </div>
                );
              })}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
