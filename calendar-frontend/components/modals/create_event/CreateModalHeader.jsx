import React from 'react';
import { X, GripHorizontal } from "lucide-react";
import { t } from "@/lib/i18n";

export default function CreateModalHeader({
  handleHeaderMouseDown,
  onClose,
  visibleTabs,
  activeTab,
  setActiveTab,
  lang
}) {
  return (
    <div
      onMouseDown={handleHeaderMouseDown}
      className="relative pt-3 pb-4 px-6 flex-shrink-0 rounded-t-2xl select-none cursor-move"
    >
      <div className="flex justify-center mb-1 pointer-events-none">
        <GripHorizontal className="w-5 h-5 text-slate-300" />
      </div>
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={onClose}
        className="absolute right-1 top-1 p-2 text-slate-400 dark:text-[#9e9e9e] hover:text-slate-600 dark:hover:text-[#bdbdbd] dark:text-[#bdbdbd] hover:bg-slate-100 dark:hover:bg-[#353535] rounded-full transition-all cursor-pointer z-10"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1f1f1f] p-1 rounded-2xl">
        {visibleTabs.map(({ key, i18nKey, Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer
                ${active ? "bg-white dark:bg-[#484848] text-blue-600 dark:text-white shadow-sm scale-[1.02]" : "text-slate-500 dark:text-[#9e9e9e] hover:text-slate-700 dark:hover:text-[#e3e3e3] hover:bg-white dark:hover:bg-[#484848]/50"}`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-blue-600 dark:text-white" : "text-slate-400 dark:text-[#9e9e9e]"}`} />
              <span className="truncate">{t(i18nKey, lang)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
