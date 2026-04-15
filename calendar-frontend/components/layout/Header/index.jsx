import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, LayoutGrid, Columns, Grid3X3, Calendar as CalendarIcon, Bell, Settings, Trash2, CheckSquare, Clock } from "lucide-react";
import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";
import { VI_MONTH_NAMES, getVNTime } from "../../../lib/CalendarHelper";

const MOCK_NOTIFS = [
  { id: 1, type: "event", title: "Họp nhóm dự án", desc: "Hôm nay lúc 15:00", read: false },
  { id: 2, type: "task", title: "Nộp báo cáo tuần", desc: "Hạn chót: hôm nay", read: false },
  { id: 3, type: "appointment", title: "Khám sức khỏe định kỳ", desc: "Ngày mai, 09:00", read: true },
  { id: 4, type: "event", title: "Sinh nhật của Minh", desc: "2 ngày nữa", read: true },
];

const NOTIF_ICON = {
  event: { Icon: CalendarIcon, color: "text-blue-500", bg: "bg-blue-50" },
  task: { Icon: CheckSquare, color: "text-emerald-500", bg: "bg-emerald-50" },
  appointment: { Icon: Clock, color: "text-purple-500", bg: "bg-purple-50" },
};

export default function Header({
  view, setView, viewDate, setViewDate, selectedDate, setSelectedDate, weekDays,
  currentUser, setCurrentUser, setAuthModal, deletedItems, setIsSettingsModalOpen, setIsTrashOpen
}) {
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [notifications, setNotifications] = useState(MOCK_NOTIFS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const viewRef = useRef(null);
  const notifRef = useRef(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setIsSettingsOpen(false);
      if (viewRef.current && !viewRef.current.contains(e.target)) setIsViewOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    const m = VI_MONTH_NAMES[viewDate.getMonth()];
    if (view === "Năm") return `${y}`;
    if (view === "Tháng") return `${m}, ${y}`;
    if (view === "Tuần") return `${weekDays[0].date} - ${weekDays[6].date} ${m}, ${y}`;
    return `${selectedDate.getDate()} ${VI_MONTH_NAMES[selectedDate.getMonth()]}, ${selectedDate.getFullYear()}`;
  };

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white flex-shrink-0 sticky top-0 z-50">
      {/* Left */}
      <div className="flex items-center space-x-4">
        <button
          onClick={goToToday}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 transition relative z-50"
        >
          Hôm nay
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
          {/* Search */}
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
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-700">Thông báo</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-500 hover:text-blue-700 font-medium transition">
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="py-8 flex flex-col items-center gap-2 text-slate-400">
                      <Bell className="w-8 h-8 text-slate-200" />
                      <p className="text-sm">Không có thông báo mới</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const cfg = NOTIF_ICON[notif.type] || NOTIF_ICON.event;
                      const { Icon } = cfg;
                      return (
                        <div
                          key={notif.id}
                          onClick={() => setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n))}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition border-b border-slate-50 last:border-0 ${!notif.read ? "bg-blue-50/40" : ""}`}
                        >
                          <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${!notif.read ? "font-semibold text-slate-800" : "font-medium text-slate-600"}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">{notif.desc}</p>
                          </div>
                          {!notif.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
                  <button className="w-full text-xs text-center text-slate-500 hover:text-blue-600 font-medium transition py-1">
                    Xem tất cả thông báo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
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
                  <Settings className="w-4 h-4 text-slate-400" /> Cài đặt
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={() => {
                    setIsTrashOpen(true);
                    setIsSettingsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-sm text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4" /> Thùng rác
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

        {/* View switcher */}
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
                { label: "Ngày", icon: <CalendarIcon className="w-4 h-4 text-blue-500" /> },
                { label: "Tuần", icon: <Columns className="w-4 h-4 text-emerald-500" /> },
                { label: "Tháng", icon: <LayoutGrid className="w-4 h-4 text-purple-500" /> },
                { label: "Năm", icon: <Grid3X3 className="w-4 h-4 text-orange-500" /> },
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
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* UserMenu */}
        <UserMenu currentUser={currentUser} setCurrentUser={setCurrentUser} setAuthModal={setAuthModal} />
      </div>
    </header>
  );
}
