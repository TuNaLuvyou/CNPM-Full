import React from "react";
import { Users, MoreVertical, Pin, PinOff, Trash2, Ban } from "lucide-react";
import { t } from "@/lib/i18n";

export default function FriendListTab({
  friends,
  currentUser,
  openMenuId,
  setOpenMenuId,
  handleFriendAction,
  menuRef,
  lang
}) {
  return (
    <div className="divide-y divide-slate-50">
      {friends.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-2">
          <Users className="w-10 h-10 opacity-20" />
          <p className="text-xs font-medium">{t('contacts_panel.no_contacts', lang)}</p>
        </div>
      ) : (
        friends.map((conn) => {
          const isSender = conn.sender === currentUser?.id;
          const friendName = isSender ? conn.receiver_name : conn.sender_name;
          const friendEmail = isSender ? conn.receiver_email : conn.sender_email;

          return (
            <div key={conn.id} className="group relative flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#2d2d2d] transition">
              {conn.is_pinned && (
                <div className="absolute top-2 right-2">
                  <Pin className="w-2.5 h-2.5 text-blue-500 fill-blue-500" />
                </div>
              )}
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {friendName?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-[#e3e3e3] truncate">{friendName || "Unknown"}</p>
                <p className="text-xs text-slate-400 dark:text-[#9e9e9e] truncate">{friendEmail}</p>
              </div>
              <div className="flex items-center gap-1">
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === conn.id ? null : conn.id)}
                    className="p-2 text-slate-400 dark:text-[#9e9e9e] hover:bg-slate-100 dark:hover:bg-[#353535] rounded-xl transition"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {openMenuId === conn.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#2d2d2d] border border-slate-100 dark:border-[#3c3c3c] rounded-xl shadow-xl z-20 py-1 overflow-hidden"
                    >
                      <button
                        onClick={() => handleFriendAction(conn.id, 'pin')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-600 dark:text-[#bdbdbd] hover:bg-slate-50 dark:hover:bg-[#2d2d2d] transition"
                      >
                        {conn.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                        {conn.is_pinned ? t('contacts_panel.unpin', lang) : t('contacts_panel.pin', lang)}
                      </button>
                      <button
                        onClick={() => handleFriendAction(conn.id, 'unfriend')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('contacts_panel.unfriend', lang)}
                      </button>
                      <button
                        onClick={() => handleFriendAction(conn.id, 'block')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-800 dark:text-[#f5f5f5] hover:bg-slate-100 dark:hover:bg-[#353535] transition border-t border-slate-50"
                      >
                        <Ban className="w-3.5 h-3.5 text-slate-400 dark:text-[#9e9e9e]" />
                        {t('contacts_panel.block', lang)}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
