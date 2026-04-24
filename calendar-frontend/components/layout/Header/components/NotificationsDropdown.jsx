import React from 'react';
import { Bell, Calendar as CalendarIcon, CheckSquare, Clock, Check, X as CloseIcon } from 'lucide-react';
import { t } from "@/lib/i18n";
import { 
  acceptEventInvitation, 
  declineEventInvitation,
  markNotificationRead,
  deleteAllNotifications
} from "../../../../lib/api";

const NOTIF_ICON = {
  event: { Icon: CalendarIcon, color: "text-blue-500", bg: "bg-blue-50" },
  task: { Icon: CheckSquare, color: "text-emerald-500", bg: "bg-emerald-50" },
  appointment: { Icon: Clock, color: "text-purple-500", bg: "bg-purple-50" },
};

export default function NotificationsDropdown({
  notifRef,
  isNotifOpen,
  setIsNotifOpen,
  setIsSearchOpen,
  setIsSettingsOpen,
  unreadCount,
  notifications,
  setNotifications,
  actionedNotifs,
  setActionedNotifs,
  setEventSavedTick,
  onNotificationClick,
  lang
}) {

  const handleAccept = async (e, notif) => {
    e.stopPropagation();
    try {
      await acceptEventInvitation(notif.event);
      await markNotificationRead(notif.id);
      setActionedNotifs(prev => new Set(prev).add(notif.id));
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setEventSavedTick(prev => prev + 1);
    } catch (err) {
      if (err.message.includes('409') || err.message.toLowerCase().includes('collision') || err.message.toLowerCase().includes('lịch bị trùng')) {
        alert(err.message + "\n\n" + t('contacts_panel.collision_warning', lang));
      } else {
        alert(err.message);
      }
    }
  };

  const handleDecline = async (e, notif) => {
    e.stopPropagation();
    try {
      await declineEventInvitation(notif.event);
      await markNotificationRead(notif.id);
      setActionedNotifs(prev => new Set(prev).add(notif.id));
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm("Xoá tất cả thông báo?")) {
      try {
        await deleteAllNotifications();
        setNotifications([]);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div ref={notifRef} className="relative">
      <button
        onClick={() => {
          setIsNotifOpen((v) => !v);
          setIsSearchOpen(false);
          setIsSettingsOpen(false);
        }}
        className={`relative p-2 rounded-full transition ${isNotifOpen ? "bg-blue-50 text-blue-600" : "hover:text-slate-700 hover:bg-slate-100"}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount}
          </span>
        )}
      </button>
      {isNotifOpen && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-10">
            <h3 className="text-sm font-bold text-slate-700">{t('notifications', lang)}</h3>
            {notifications.length > 0 && (
              <button 
                onClick={handleDeleteAll}
                className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wider transition-colors"
              >
                {t('contacts_panel.clear_all', lang) || "Xoá tất cả"}
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2 text-slate-400">
                <Bell className="w-8 h-8 text-slate-200" />
                <p className="text-sm">{t('contacts_panel.no_notifications', lang)}</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const cfg = NOTIF_ICON[notif.type] || NOTIF_ICON.event;
                const { Icon } = cfg;
                const isInvite = notif.ntype === 'invite';

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (notif.event && onNotificationClick) {
                        onNotificationClick(notif.event);
                      }
                    }}
                    className={`flex flex-col px-4 py-4 transition border-b border-slate-50 last:border-0 ${!notif.is_read ? "bg-blue-50/40" : "hover:bg-slate-50"} ${notif.event ? "cursor-pointer" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className={`text-[13px] leading-relaxed ${!notif.is_read ? "font-semibold text-slate-800" : "text-slate-600"}`}>
                            {notif.desc}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider flex items-center gap-2">
                              {new Date(notif.time).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                              {isInvite && notif.is_read && (
                                  <span className="text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded text-[9px] normal-case">
                                      ✓ {t('contacts_panel.details', lang)}
                                  </span>
                              )}
                          </p>
                      </div>
                      {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />}
                    </div>

                    {isInvite && !notif.is_read && !actionedNotifs.has(notif.id) && (
                      <div className="flex gap-2 mt-3 ml-12">
                          <button
                              onClick={(e) => handleAccept(e, notif)}
                              className="px-4 py-2 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                          >
                              <Check className="w-3.5 h-3.5" /> {t('contacts_panel.accept_btn', lang)}
                          </button>
                          <button
                              onClick={(e) => handleDecline(e, notif)}
                              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                          >
                              <CloseIcon className="w-3.5 h-3.5" /> {t('contacts_panel.decline_btn', lang)}
                          </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <button className="w-full text-[11px] text-center text-slate-400 uppercase tracking-widest font-bold py-1">
              {t('view_all_notifications', lang)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
