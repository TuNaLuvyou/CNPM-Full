import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";
import { MONTH_NAMES, getVNTime } from "../../../lib/CalendarHelper";
import { t } from "@/lib/i18n";
import { markAllNotificationsRead } from "../../../lib/api";

import NotificationsDropdown from "./components/NotificationsDropdown";
import SupportDropdown from "./components/SupportDropdown";
import SettingsDropdown from "./components/SettingsDropdown";
import ViewModeDropdown from "./components/ViewModeDropdown";
import ProfileModal from "../../modals/ProfileModal";

export default function Header({
  view, setView, viewDate, setViewDate, selectedDate, setSelectedDate, weekDays,
  currentUser, setCurrentUser, setAuthModal, deletedItems, setIsSettingsModalOpen, setIsTrashOpen,
  notifications, setNotifications, appSettings, setEventSavedTick, onNotificationClick
}) {
  const lang = appSettings.language;
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const viewRef = useRef(null);
  const notifRef = useRef(null);
  const settingsRef = useRef(null);
  const helpRef = useRef(null);
  const [actionedNotifs, setActionedNotifs] = useState(new Set());

  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setIsSettingsOpen(false);
      if (viewRef.current && !viewRef.current.contains(e.target)) setIsViewOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
      if (helpRef.current && !helpRef.current.contains(e.target)) setIsHelpOpen(false);
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
    if (view === "day") {
      d.setDate(d.getDate() + dir);
      setSelectedDate(d);
    } else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else if (view === "month") d.setMonth(d.getMonth() + dir);
    else if (view === "year") d.setFullYear(d.getFullYear() + dir);
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
    
    if (view === "year") return `${y}`;
    if (view === "month") return `${m}, ${y}`;
    
    if (view === "week") {
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

          <NotificationsDropdown
            notifRef={notifRef}
            isNotifOpen={isNotifOpen}
            setIsNotifOpen={setIsNotifOpen}
            setIsSearchOpen={setIsSearchOpen}
            setIsSettingsOpen={setIsSettingsOpen}
            unreadCount={unreadCount}
            notifications={notifications}
            setNotifications={setNotifications}
            actionedNotifs={actionedNotifs}
            setActionedNotifs={setActionedNotifs}
            setEventSavedTick={setEventSavedTick}
            onNotificationClick={onNotificationClick}
            lang={lang}
          />
          
          <SupportDropdown
            helpRef={helpRef}
            isHelpOpen={isHelpOpen}
            setIsHelpOpen={setIsHelpOpen}
            setIsSearchOpen={setIsSearchOpen}
            setIsNotifOpen={setIsNotifOpen}
            setIsSettingsOpen={setIsSettingsOpen}
            lang={lang}
          />
          
          <SettingsDropdown
            settingsRef={settingsRef}
            isSettingsOpen={isSettingsOpen}
            setIsSettingsOpen={setIsSettingsOpen}
            setIsNotifOpen={setIsNotifOpen}
            setIsSearchOpen={setIsSearchOpen}
            setIsSettingsModalOpen={setIsSettingsModalOpen}
            setIsTrashOpen={setIsTrashOpen}
            deletedItems={deletedItems}
            lang={lang}
          />
        </div>

        <div className="h-6 w-px bg-slate-200"></div>

        <ViewModeDropdown
          viewRef={viewRef}
          isViewOpen={isViewOpen}
          setIsViewOpen={setIsViewOpen}
          view={view}
          setView={setView}
          lang={lang}
        />

        <UserMenu 
          currentUser={currentUser} 
          setCurrentUser={setCurrentUser} 
          setAuthModal={setAuthModal} 
          appSettings={appSettings} 
          setIsProfileModalOpen={setIsProfileModalOpen}
        />
      </div>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        lang={lang}
      />
    </header>
  );
}
