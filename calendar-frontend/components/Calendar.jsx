"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Settings,
  Trash2,
  LogOut,
  ChevronDown,
  LayoutGrid,
  Columns,
  Grid3X3,
  Calendar as CalendarIcon,
  X,
  CheckSquare,
  Clock,
} from "lucide-react";
import {
  VI_DAY_NAMES,
  VI_MONTH_NAMES,
  buildWeekDays,
  buildMonthCells,
  getVNTime,
} from "../lib/CalendarHelper";
import TimeGrid from "./TimeGrid";
import AuthModal from "./AuthModal";
import MonthCard from "./MonthsCard";
import TrashModal from "./TrashModal";
import SettingsModal from "./SettingsModal";

// ── Mock notifications (thay bằng data thật sau) ──
const MOCK_NOTIFS = [
  {
    id: 1,
    type: "event",
    title: "Họp nhóm dự án",
    desc: "Hôm nay lúc 15:00",
    read: false,
  },
  {
    id: 2,
    type: "task",
    title: "Nộp báo cáo tuần",
    desc: "Hạn chót: hôm nay",
    read: false,
  },
  {
    id: 3,
    type: "appointment",
    title: "Khám sức khỏe định kỳ",
    desc: "Ngày mai, 09:00",
    read: true,
  },
  {
    id: 4,
    type: "event",
    title: "Sinh nhật của Minh",
    desc: "2 ngày nữa",
    read: true,
  },
];

const NOTIF_ICON = {
  event: { Icon: CalendarIcon, color: "text-blue-500", bg: "bg-blue-50" },
  task: { Icon: CheckSquare, color: "text-emerald-500", bg: "bg-emerald-50" },
  appointment: { Icon: Clock, color: "text-purple-500", bg: "bg-purple-50" },
};

export default function Calendar({
  view,
  setView,
  viewDate,
  setViewDate,
  selectedDate,
  setSelectedDate,
  onGridClick,
  previewEvent,
  onOpenCreate,
  onYearDayClick,
}) {
  const now = getVNTime();

  // ── UI states ──
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [authModal, setAuthModal] = useState({ isOpen: false, type: "login" });
  const [currentUser, setCurrentUser] = useState(null);

  // ── Search ──
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  // ── Notifications ──
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Trash ──
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [deletedItems, setDeletedItems] = useState([]);

  // ── Settings ──
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // ── Refs cho click-outside ──
  const settingsRef = useRef(null);
  const viewRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target))
        setIsSettingsOpen(false);
      if (viewRef.current && !viewRef.current.contains(e.target))
        setIsViewOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target))
        setIsNotifOpen(false);
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target) &&
        isSearchOpen
      ) {
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isSearchOpen]);

  // Focus input khi mở search
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // ── Handlers ──
  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const handleRestore = (id) =>
    setDeletedItems((prev) => prev.filter((item) => item.id !== id));

  const handlePermanentDelete = (id) =>
    setDeletedItems((prev) => prev.filter((item) => item.id !== id));

  const handleClearAll = () => setDeletedItems([]);

  const weekDays = buildWeekDays(viewDate);
  const monthCells = buildMonthCells(
    viewDate.getFullYear(),
    viewDate.getMonth()
  );

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
    const today = getVNTime();
    setViewDate(today);
    setSelectedDate(today);
  };

  const handleDayClick = (fullDate) => {
    setSelectedDate(fullDate);
    setViewDate(fullDate);
    setView("Ngày");
  };

  const headerTitle = () => {
    const y = viewDate.getFullYear();
    const m = VI_MONTH_NAMES[viewDate.getMonth()];
    if (view === "Năm") return `${y}`;
    if (view === "Tháng") return `${m}, ${y}`;
    if (view === "Tuần")
      return `${weekDays[0].date} - ${weekDays[6].date} ${m}, ${y}`;
    return `${selectedDate.getDate()} ${VI_MONTH_NAMES[selectedDate.getMonth()]}, ${selectedDate.getFullYear()}`;
  };

  const selectedDayName = VI_DAY_NAMES[selectedDate.getDay()];
  const isSelectedToday = selectedDate.toDateString() === now.toDateString();

  return (
    <div className="flex flex-col h-full bg-white relative min-w-[700px]">
      {/* ══ HEADER ══ */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white flex-shrink-0 sticky top-0 z-50">
        {/* Trái: điều hướng */}
        <div className="flex items-center space-x-4">
          <button
            onClick={goToToday}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 transition relative z-50"
          >
            Hôm nay
          </button>
          <div className="flex items-center space-x-2 relative z-50">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 hover:bg-slate-100 rounded-full transition"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <button
              onClick={() => navigate(1)}
              className="p-1.5 hover:bg-slate-100 rounded-full transition"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <h1 className="text-xl font-semibold text-slate-800">
            {headerTitle()}
          </h1>
        </div>

        {/* Phải: actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-slate-500 relative z-50">

            {/* ── SEARCH ── */}
            <div ref={searchRef} className="relative">
              <button
                onClick={() => {
                  setIsSearchOpen((v) => !v);
                  setSearchQuery("");
                  setIsNotifOpen(false);
                  setIsSettingsOpen(false);
                }}
                className={`p-2 rounded-full transition
                  ${isSearchOpen
                    ? "bg-blue-50 text-blue-600"
                    : "hover:text-slate-700 hover:bg-slate-100"
                  }`}
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Search dropdown */}
              {isSearchOpen && (
                <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  {/* Input */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                    <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm sự kiện, lịch hẹn..."
                      className="flex-1 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-slate-400 hover:text-slate-600 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Results / placeholder */}
                  <div className="py-8 flex flex-col items-center gap-2 text-slate-400">
                    <Search className="w-8 h-8 text-slate-200" />
                    <p className="text-sm font-medium">
                      {searchQuery
                        ? `Không tìm thấy "${searchQuery}"`
                        : "Nhập từ khóa để tìm kiếm"}
                    </p>
                    {!searchQuery && (
                      <p className="text-xs text-slate-300">
                        Sự kiện, việc làm, lịch hẹn...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── NOTIFICATIONS ── */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => {
                  setIsNotifOpen((v) => !v);
                  setIsSearchOpen(false);
                  setIsSettingsOpen(false);
                }}
                className={`relative p-2 rounded-full transition
                  ${isNotifOpen
                    ? "bg-blue-50 text-blue-600"
                    : "hover:text-slate-700 hover:bg-slate-100"
                  }`}
              >
                <Bell className="w-5 h-5" />
                {/* Badge số thông báo chưa đọc */}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-700">
                      Thông báo
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-blue-500 hover:text-blue-700 font-medium transition"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-72 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-8 flex flex-col items-center gap-2 text-slate-400">
                        <Bell className="w-8 h-8 text-slate-200" />
                        <p className="text-sm">Không có thông báo mới</p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const cfg =
                          NOTIF_ICON[notif.type] || NOTIF_ICON.event;
                        const { Icon } = cfg;
                        return (
                          <div
                            key={notif.id}
                            onClick={() =>
                              setNotifications((prev) =>
                                prev.map((n) =>
                                  n.id === notif.id
                                    ? { ...n, read: true }
                                    : n
                                )
                              )
                            }
                            className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition border-b border-slate-50 last:border-0
                              ${!notif.read ? "bg-blue-50/40" : ""}`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}
                            >
                              <Icon className={`w-4 h-4 ${cfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm truncate ${!notif.read ? "font-semibold text-slate-800" : "font-medium text-slate-600"}`}
                              >
                                {notif.title}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {notif.desc}
                              </p>
                            </div>
                            {!notif.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
                    <button className="w-full text-xs text-center text-slate-500 hover:text-blue-600 font-medium transition py-1">
                      Xem tất cả thông báo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── SETTINGS ── */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => {
                  setIsSettingsOpen((v) => !v);
                  setIsNotifOpen(false);
                  setIsSearchOpen(false);
                }}
                className={`p-2 rounded-full transition
                  ${isSettingsOpen
                    ? "text-slate-700 bg-slate-100"
                    : "hover:text-slate-700 hover:bg-slate-100"
                  }`}
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
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700 transition">
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

          {/* ── VIEW SWITCHER ── */}
          <div className="relative" ref={viewRef}>
            <button
              onClick={() => setIsViewOpen(!isViewOpen)}
              className="h-9 px-4 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg flex items-center gap-2 hover:bg-slate-100 transition relative z-50 group font-medium"
            >
              {view}
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isViewOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isViewOpen && (
              <div className="absolute right-0 top-11 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                {[
                  {
                    label: "Ngày",
                    icon: <CalendarIcon className="w-4 h-4 text-blue-500" />,
                  },
                  {
                    label: "Tuần",
                    icon: <Columns className="w-4 h-4 text-emerald-500" />,
                  },
                  {
                    label: "Tháng",
                    icon: <LayoutGrid className="w-4 h-4 text-purple-500" />,
                  },
                  {
                    label: "Năm",
                    icon: <Grid3X3 className="w-4 h-4 text-orange-500" />,
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setView(item.label);
                      setIsViewOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm transition-colors
                      ${view === item.label
                        ? "text-blue-600 font-semibold bg-blue-50/50"
                        : "text-slate-600"
                      }`}
                  >
                    <span
                      className={view === item.label ? "opacity-100" : "opacity-70"}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── AUTH ── */}
          {currentUser ? (
            <div className="flex items-center gap-3 h-9 px-3 bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                {currentUser.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-slate-600">
                Xin Chào,{" "}
                <span className="font-bold text-blue-600">{currentUser}</span>
              </span>
              <div className="w-px h-4 bg-slate-200 mx-1"></div>
              <button
                onClick={() => setCurrentUser(null)}
                className="text-slate-400 hover:text-red-500 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuthModal({ isOpen: true, type: "login" })}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => setAuthModal({ isOpen: true, type: "register" })}
                className="h-9 px-4 bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 text-sm font-medium rounded-lg transition-colors"
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ══ BODY ══ */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white">
        {/* NĂM */}
        {view === "Năm" && (
          <div className="flex-1 overflow-auto custom-scrollbar">
            <div className="grid grid-cols-4 gap-5 p-6 min-w-[880px]">
              {Array.from({ length: 12 }, (_, m) => (
                <MonthCard
                  key={m}
                  year={viewDate.getFullYear()}
                  month={m}
                  onDayClick={onYearDayClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* THÁNG */}
        {view === "Tháng" && (
          <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-slate-200">
            <div className="flex shadow-sm flex-shrink-0 sticky top-0 z-20 bg-slate-200">
              <div className="flex-1 grid grid-cols-7 gap-px">
                {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"].map((d) => (
                  <div key={d} className="bg-white text-center py-3 text-sm font-semibold text-slate-500">
                    {d}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-7 flex-1 gap-px bg-slate-200 mt-px">
              {monthCells.map((cell, idx) => (
                <div key={idx} className="bg-white p-2 min-h-[120px]">
                  <div
                    onClick={() => handleDayClick(cell.fullDate)}
                    id={cell.isToday ? "today-cell" : `cell-${cell.num}`}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all cursor-pointer
                      ${!cell.isCurrentMonth ? "text-slate-400 opacity-60" : ""}
                      ${cell.isToday
                        ? "bg-blue-600 text-white shadow-md font-bold"
                        : cell.isCurrentMonth
                          ? "text-slate-700 hover:bg-slate-100"
                          : ""
                      }`}
                  >
                    {cell.num}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TUẦN */}
        {view === "Tuần" && (
          <>
            <div className="flex border-b border-slate-200 bg-white z-10 shadow-sm flex-shrink-0">
              <div className="w-16 flex-shrink-0 border-r border-slate-200"></div>
              <div className="flex-1 grid grid-cols-7">
                {weekDays.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-center py-3 border-l border-slate-200">
                    <span className={`text-xs font-medium mb-1 ${day.isToday ? "text-blue-600" : "text-slate-500"}`}>
                      {day.day}
                    </span>
                    <span
                      onClick={() => handleDayClick(day.fullDate)}
                      className={`text-xl flex items-center justify-center w-10 h-10 rounded-full transition-all cursor-pointer
                        ${day.isToday
                          ? "bg-blue-600 text-white font-bold shadow-md"
                          : "text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                      {day.date}
                    </span>
                  </div>
                ))}
              </div>
              <div className="w-[8px] flex-shrink-0 bg-[#f8fafc] border-l border-slate-200"></div>
            </div>
            <TimeGrid
              mode="week"
              weekDays={weekDays}
              onGridClick={onGridClick}
              previewEvent={previewEvent}
            />
          </>
        )}

        {/* NGÀY */}
        {view === "Ngày" && (
          <>
            <div className="flex border-b border-slate-200 bg-white z-10 shadow-sm flex-shrink-0">
              <div className="w-16 flex-shrink-0 border-r border-slate-200"></div>
              <div className="flex-1 flex flex-col items-center justify-center py-3 border-l border-slate-200 bg-blue-50/20">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                  {selectedDayName}
                </span>
                <span className="text-3xl font-bold text-slate-800">
                  {selectedDate.getDate()}
                </span>
              </div>
              <div className="w-[8px] flex-shrink-0 bg-[#f8fafc] border-l border-slate-200"></div>
            </div>
            <TimeGrid
              mode="day"
              onGridClick={onGridClick}
              previewEvent={previewEvent}
              weekDays={[
                {
                  day: selectedDayName,
                  date: String(selectedDate.getDate()),
                  isToday: isSelectedToday,
                  fullDate: selectedDate,
                },
              ]}
            />
          </>
        )}
      </div>

      {/* ══ AUTH MODAL ══ */}
      <AuthModal
        isOpen={authModal.isOpen}
        type={authModal.type}
        onClose={() => setAuthModal((p) => ({ ...p, isOpen: false }))}
        onSwitchType={(newType) => setAuthModal({ isOpen: true, type: newType })}
        onLoginSuccess={(username) => {
          setCurrentUser(username);
          setAuthModal((p) => ({ ...p, isOpen: false }));
        }}
      />

      {/* ══ TRASH MODAL ══ */}
      <TrashModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        deletedItems={deletedItems}
        onRestore={handleRestore}
        onPermanentDelete={handlePermanentDelete}
        onClearAll={handleClearAll}
      />

      {/* ══ SETTINGS MODAL ══ */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={(newSettings) => console.log("Settings saved:", newSettings)}
      />
    </div>
  );
}