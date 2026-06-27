import React from 'react';
import { Settings, Trash2 } from 'lucide-react';
import { t } from "@/lib/i18n";

export default function SettingsDropdown({
  settingsRef,
  isSettingsOpen,
  setIsSettingsOpen,
  setIsNotifOpen,
  setIsSearchOpen,
  setIsSettingsModalOpen,
  setIsTrashOpen,
  deletedItems,
  lang
}) {
  return (
    <div className="relative" ref={settingsRef}>
      <button
        onClick={() => {
          setIsSettingsOpen((v) => !v);
          setIsNotifOpen(false);
          setIsSearchOpen(false);
        }}
        className={`p-2 rounded-full transition ${isSettingsOpen ? "text-slate-700 dark:text-[#e3e3e3] bg-slate-100 dark:bg-[#353535]" : "hover:text-slate-700 dark:hover:text-[#e3e3e3] dark:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#353535]"}`}
      >
        <Settings className="w-5 h-5" />
      </button>
      {isSettingsOpen && (
        <div className="absolute right-0 top-10 w-44 bg-white dark:bg-[#2d2d2d] rounded-xl shadow-lg border border-slate-100 dark:border-[#484848] py-1.5 z-50">
          <button
            onClick={() => {
              setIsSettingsModalOpen(true);
              setIsSettingsOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-[#353535] flex items-center gap-3 text-sm text-slate-700 dark:text-white transition"
          >
            <Settings className="w-4 h-4 text-slate-400 dark:text-[#9e9e9e]" /> {t('settings', lang)}
          </button>
          <div className="my-1 border-t border-slate-100 dark:border-[#484848]" />
          <button
            onClick={() => {
              setIsTrashOpen(true);
              setIsSettingsOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 text-sm text-red-500 transition"
          >
            <Trash2 className="w-4 h-4" /> {t('trash', lang)}
            {deletedItems.length > 0 && (
              <span className="ml-auto bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {deletedItems.length}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
