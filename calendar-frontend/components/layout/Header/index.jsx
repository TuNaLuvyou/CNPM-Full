import React, { useState, useRef, useEffect } from "react";
import { 
  ChevronLeft, ChevronRight, ChevronDown, LayoutGrid, Columns, Grid3X3, 
  Calendar as CalendarIcon, Bell, Settings, Trash2, CheckSquare, Clock, 
  Check, X as CloseIcon 
} from "lucide-react";
import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";
import { MONTH_NAMES, getVNTime } from "../../../lib/CalendarHelper";
import { t } from "@/lib/i18n";
import { 
  acceptEventInvitation, 
  declineEventInvitation,
  markNotificationRead,
  markAllNotificationsRead,
  deleteAllNotifications
} from "../../../lib/api";

const NOTIF_ICON = {
  event: { Icon: CalendarIcon, color: "text-blue-500", bg: "bg-blue-50" },
  task: { Icon: CheckSquare, color: "text-emerald-500", bg: "bg-emerald-50" },
  appointment: { Icon: Clock, color: "text-purple-500", bg: "bg-purple-50" },
};

export default function Header({
  view, setView, viewDate, setViewDate, selectedDate, setSelectedDate, weekDays,
  currentUser, setCurrentUser, setAuthModal, deletedItems, setIsSettingsModalOpen, setIsTrashOpen,
  notifications, setNotifications, appSettings, setEventSavedTick
}) {
    const lang = appSettings.language;
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const viewRef = useRef(null);
  const notifRef = useRef(null);
  const settingsRef = useRef(null);
  const [actionedNotifs, setActionedNotifs] = useState(new Set());

  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setIsSettingsOpen(false);
      if (viewRef.current && !viewRef.current.contains(e.target)) setIsViewOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Đánh dấu đã đọc khi mở bảng thông báo (trừ lời mời)
  useEffect(() => {
    if (isNotifOpen) {
      const targetNotifs = notifications.filter(n => !n.is_read && n.ntype !== 'invite');
      if (targetNotifs.length > 0) {
        setNotifications(prev => prev.map(n => 
          (!n.is_read && n.ntype !== 'invite') ? { ...n, is_read: true } : n
        ));
        markAllNotificationsRead().catch(err => console.error("Lỗi mark all as read:", err));
      }
    }
  }, [isNotifOpen, setNotifications]);

  const navigate = (dir) => {
    const d = new Date(viewDate);
    if (view === "Ngày") {
      d.setDate(d.getDate() + dir);
      setSelectedDate(d);
    } else if (view === "Tuần") d.setDate(d.getDate() + dir * 7);
    else if (view === "Tháng") d.setMonth(d.getMonth() + dir);
    else if (view === "Năm") d.setFullYear(d.getFullYear() + dir);
    setViewDate(d);
  };

  const goToToday = () => {
    const t = getVNTime();
    setViewDate(t);
    setSelectedDate(t);
  };

  const headerTitle = () => {
    const y = viewDate.getFullYear();
    const months = MONTH_NAMES[lang] || MONTH_NAMES.vi;
    const m = months[viewDate.getMonth()];
    
    if (view === "Năm") return `${y}`;
    if (view === "Tháng") return `${m}, ${y}`;
    
    if (view === "Tuần") {
        const d1 = weekDays[0].date;
        const d7 = weekDays[6].date;
        return `${d1} - ${d7} ${m}, ${y}`;
    }

    const d = selectedDate.getDate();
    const sm = months[selectedDate.getMonth()];
    const sy = selectedDate.getFullYear();
    
    if (appSettings.dateFormat === "MM/DD/YYYY") return `${sm} ${d}, ${sy}`;
    return `${d} ${sm}, ${sy}`;
  };

  const handleAccept = async (e, notif) => {
    e.stopPropagation();
    try {
      await acceptEventInvitation(notif.event);
      // Mark as read too
      await markNotificationRead(notif.id);
      setActionedNotifs(prev => new Set(prev).add(notif.id));
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setEventSavedTick(prev => prev + 1);
    } catch (err) {
      if (err.message.includes('409') || err.message.toLowerCase().includes('collision')) {
        if (window.confirm(t('contacts_panel.collision_warning', lang))) {
          await acceptEventInvitation(notif.event, true);
          await markNotificationRead(notif.id);
          setActionedNotifs(prev => new Set(prev).add(notif.id));
          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
          setEventSavedTick(prev => prev + 1);
        }
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
    <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white flex-shrink-0 sticky top-0 z-50">
      {/* Left */}
      <div className="flex items-center space-x-4">
        <button
          onClick={goToToday}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 transition relative z-50"
        >
          {t('today', lang)}
        </button>
        <div className="flex items-center space-x-2 relative z-50">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-slate-100 rounded-full transition">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <button onClick={() => navigate(1)} className="p-1.5 hover:bg-slate-100 rounded-full transition">
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        <h1 className="text-xl font-semibold text-slate-800">{headerTitle()}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-slate-500 relative z-50">
          <SearchBar isSearchOpen={isSearchOpen} setIsSearchOpen={setIsSearchOpen} />

          {/* Notifications */}
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
                          className={`flex flex-col px-4 py-4 transition border-b border-slate-50 last:border-0 ${!notif.is_read ? "bg-blue-50/40" : "hover:bg-slate-50"}`}
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

                          {isInvite && !actionedNotifs.has(notif.id) && (
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

          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => {
                setIsSettingsOpen((v) => !v);
                setIsNotifOpen(false);
                setIsSearchOpen(false);
              }}
              className={`p-2 rounded-full transition ${isSettingsOpen ? "text-slate-700 bg-slate-100" : "hover:text-slate-700 hover:bg-slate-100"}`}
            >
              <Settings className="w-5 h-5" />
            </button>
            {isSettingsOpen && (
              <div className="absolute right-0 top-10 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                <button
                  onClick={() => {
                    setIsSettingsModalOpen(true);
                    setIsSettingsOpen(false);
                  }}
                   className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700 transition"
                >
                  <Settings className="w-4 h-4 text-slate-400" /> {t('settings', lang)}
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={() => {
                    setIsTrashOpen(true);
                    setIsSettingsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-sm text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4" /> {t('trash', lang)}
                  {deletedItems.length > 0 && (
                    <span className="ml-auto bg-red-100 text-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {deletedItems.length}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200"></div>

        <div className="relative" ref={viewRef}>
          <button
            onClick={() => setIsViewOpen(!isViewOpen)}
            className="h-9 px-4 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg flex items-center gap-2 hover:bg-slate-100 transition relative z-50 group font-medium"
          >
            {view}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isViewOpen ? "rotate-180" : ""}`} />
          </button>
          {isViewOpen && (
            <div className="absolute right-0 top-11 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
              {[
                { label: "Ngày", key: "view_day", icon: <CalendarIcon className="w-4 h-4 text-blue-500" /> },
                { label: "Tuần", key: "view_week", icon: <Columns className="w-4 h-4 text-emerald-500" /> },
                { label: "Tháng", key: "view_month", icon: <LayoutGrid className="w-4 h-4 text-purple-500" /> },
                { label: "Năm", key: "view_year", icon: <Grid3X3 className="w-4 h-4 text-orange-500" /> },
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

        <UserMenu currentUser={currentUser} setCurrentUser={setCurrentUser} setAuthModal={setAuthModal} appSettings={appSettings} />
      </div>
    </header>
  );
}
