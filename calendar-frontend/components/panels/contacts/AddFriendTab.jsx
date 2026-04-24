import React from "react";
import { Search, Loader2, UserPlus, Check, Users } from "lucide-react";
import { t } from "@/lib/i18n";

export default function AddFriendTab({
  searchEmail,
  setSearchEmail,
  isSearching,
  searchResult,
  error,
  handleSearch,
  handleConnect,
  requestSent,
  lang
}) {
  return (
    <div className="p-4 space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 focus-within:border-blue-300 focus-within:bg-white transition-all">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder={t('contacts_panel.search_user_placeholder', lang)}
            className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder-slate-300"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:bg-slate-300"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : t('search', lang)}
        </button>
      </form>

      {searchResult && (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${searchResult.color} flex items-center justify-center text-white text-lg font-bold shadow-sm ring-2 ring-white`}>
              {searchResult.avatar}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">{searchResult.name}</p>
              <p className="text-xs text-slate-400 truncate">{searchResult.email}</p>
            </div>
          </div>
          <button
            onClick={() => handleConnect(searchResult.id)}
            disabled={requestSent}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
              requestSent
                ? "bg-emerald-50 text-emerald-600 cursor-default border border-emerald-100"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            }`}
          >
            {requestSent ? <Check className="w-3 h-3" /> : <UserPlus className="w-3.5 h-3.5" />}
            {requestSent ? t('contacts_panel.request_sent', lang) : t('contacts_panel.connect_btn', lang)}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-center text-red-500 py-4">{error}</p>}

      {!searchResult && !isSearching && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-2 opacity-60">
          <Search className="w-10 h-10" />
          <p className="text-xs font-medium">{t('contacts_panel.search_user_placeholder', lang)}</p>
        </div>
      )}
    </div>
  );
}
