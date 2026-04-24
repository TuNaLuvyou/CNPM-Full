import React from 'react';
import { ChevronDown, Calendar as CalendarIcon, Columns, LayoutGrid, Grid3X3 } from 'lucide-react';
import { t } from "@/lib/i18n";

export default function ViewModeDropdown({
  viewRef,
  isViewOpen,
  setIsViewOpen,
  view,
  setView,
  lang
}) {
  return (
    <div className="relative" ref={viewRef}>
      <button
        onClick={() => setIsViewOpen(!isViewOpen)}
        className="h-9 px-4 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg flex items-center gap-2 hover:bg-slate-100 transition relative z-50 group font-medium"
      >
        {t(`view_${view}`, lang)}
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isViewOpen ? "rotate-180" : ""}`} />
      </button>
      {isViewOpen && (
        <div className="absolute right-0 top-11 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
          {[
            { label: "day", key: "view_day", icon: <CalendarIcon className="w-4 h-4 text-blue-500" /> },
            { label: "week", key: "view_week", icon: <Columns className="w-4 h-4 text-emerald-500" /> },
            { label: "month", key: "view_month", icon: <LayoutGrid className="w-4 h-4 text-purple-500" /> },
            { label: "year", key: "view_year", icon: <Grid3X3 className="w-4 h-4 text-orange-500" /> },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setView(item.label);
                setIsViewOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm transition-colors ${view === item.label ? "text-blue-600 font-semibold bg-blue-50/50" : "text-slate-600"}`}
            >
              <span className={view === item.label ? "opacity-100" : "opacity-70"}>{item.icon}</span>
              {t(item.key, lang)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
