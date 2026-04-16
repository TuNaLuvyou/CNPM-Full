import React, { useState, useRef } from "react";
import { MapPin, Search, ExternalLink } from "lucide-react";
import { t } from "@/lib/i18n";

export default function MapsPanel({ appSettings }) {
  const lang = appSettings?.language || "vi";
  const [mapQuery, setMapQuery] = useState("");
  const [mapSearch, setMapSearch] = useState("Ho Chi Minh City");
  const mapInputRef = useRef(null);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-red-500" /> {t('sidebar_tools.maps', lang)}
        </h2>
      </div>
      {/* Search */}
      <div className="px-3 py-2 border-b border-slate-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (mapQuery.trim()) setMapSearch(mapQuery.trim());
          }}
          className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-transparent focus-within:border-blue-300 transition-colors"
        >
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            ref={mapInputRef}
            value={mapQuery}
            onChange={(e) => setMapQuery(e.target.value)}
            placeholder={t('maps_panel.search_placeholder', lang)}
            className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder-slate-400"
          />
          {mapQuery && (
            <button
              type="submit"
              className="text-xs font-bold text-red-500 hover:text-red-600 transition px-2 py-1 rounded-md hover:bg-red-50"
            >
              {t('search', lang)} 
            </button>
          )}
        </form>
      </div>
      {/* Map iframe */}
      <div className="flex-1 relative overflow-hidden">
        <iframe
          key={mapSearch}
          title="Google Maps"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          src={`https://maps.google.com/maps?q=${encodeURIComponent(mapSearch)}&output=embed&z=14`}
          allowFullScreen
        />
      </div>
      {/* Open in Maps link */}
      <div className="px-4 py-2 border-t border-slate-100">
        <a
          href={`https://maps.google.com/maps?q=${encodeURIComponent(mapSearch)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-medium transition py-1"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {t('maps_panel.open_in_maps', lang)}
        </a>
      </div>
    </div>
  );
}
