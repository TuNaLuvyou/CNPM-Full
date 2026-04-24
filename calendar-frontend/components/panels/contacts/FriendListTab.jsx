import React from "react";
import { Users, MessageCircle, MoreVertical, Pin, PinOff, Trash2, Ban } from "lucide-react";
import { t } from "@/lib/i18n";

export default function FriendListTab({
  friends,
  currentUser,
  setChatFriendId,
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
            <div key={conn.id} className="group relative flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition">
              {conn.is_pinned && (
                <div className="absolute top-2 right-2">
                  <Pin className="w-2.5 h-2.5 text-blue-500 fill-blue-500" />
                </div>
              )}
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {friendName?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{friendName || "Unknown"}</p>
                <p className="text-xs text-slate-400 truncate">{friendEmail}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setChatFriendId(conn.id)}
                  className="relative p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition shadow-sm bg-white border border-slate-100"
                >
                  <MessageCircle className="w-4 h-4" />
                  {conn.unread_count > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                      {conn.unread_count > 99 ? '99+' : conn.unread_count}
                    </span>
                  )}
                </button>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === conn.id ? null : conn.id)}
                    className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {openMenuId === conn.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 mt-2 w-40 bg-white border border-slate-100 rounded-xl shadow-xl z-20 py-1 overflow-hidden"
                    >
                      <button
                        onClick={() => handleFriendAction(conn.id, 'pin')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 transition"
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
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-800 hover:bg-slate-100 transition border-t border-slate-50"
                      >
                        <Ban className="w-3.5 h-3.5 text-slate-400" />
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
