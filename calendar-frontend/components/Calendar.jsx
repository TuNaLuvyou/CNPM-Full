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
  onYearDayClick, // Thêm prop này
}) {
  const now = getVNTime();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const settingsRef = useRef(null);
  const viewRef = useRef(null);
  const [authModal, setAuthModal] = useState({ isOpen: false, type: "login" });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target))
        setIsSettingsOpen(false);
      if (viewRef.current && !viewRef.current.contains(e.target))
        setIsViewOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const weekDays = buildWeekDays(viewDate);
  const monthCells = buildMonthCells(
    viewDate.getFullYear(),
    viewDate.getMonth(),
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

  // Giữ nguyên view hiện tại, chỉ nhảy về hôm nay
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

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-slate-500 relative z-50">
            <button className="p-2 hover:text-slate-700 hover:bg-slate-100 rounded-full transition">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 hover:text-slate-700 hover:bg-slate-100 rounded-full transition">
              <Bell className="w-5 h-5" />
            </button>
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setIsSettingsOpen((v) => !v)}
                className={`p-2 rounded-full transition hover:bg-slate-100
                                    ${isSettingsOpen ? "text-slate-700 bg-slate-100" : "hover:text-slate-700"}`}
              >
                <Settings className="w-5 h-5" />
              </button>
              {isSettingsOpen && (
                <div className="absolute right-0 top-10 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                  <button className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700">
                    <Settings className="w-4 h-4 text-slate-400" /> Cài đặt
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button className="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-sm text-red-500">
                    <Trash2 className="w-4 h-4" /> Thùng rác
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
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isViewOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isViewOpen && (
              <div className="absolute right-0 top-11 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
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
                                            ${view === item.label ? "text-blue-600 font-semibold bg-blue-50/50" : "text-slate-600"}`}
                  >
                    <span
                      className={
                        view === item.label ? "opacity-100" : "opacity-70"
                      }
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

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
                  <div
                    key={d}
                    className="bg-white text-center py-3 text-sm font-semibold text-slate-500"
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-7 flex-1 gap-px bg-slate-200 mt-px">
              {monthCells.map((cell, idx) => (
                <div key={idx} className="bg-white p-2 min-h-[120px]">
                  <div
                    onClick={(e) => handleDayClick(cell.fullDate)}
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
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center py-3 border-l border-slate-200"
                  >
                    <span
                      className={`text-xs font-medium mb-1 ${day.isToday ? "text-blue-600" : "text-slate-500"}`}
                    >
                      {day.day}
                    </span>
                    <span
                      onClick={() => handleDayClick(day.fullDate)}
                      className={`text-xl flex items-center justify-center w-10 h-10 rounded-full transition-all cursor-pointer
                                                ${day.isToday ? "bg-blue-600 text-white font-bold shadow-md" : "text-slate-700 hover:bg-slate-100"}`}
                    >
                      {day.date}
                    </span>
                  </div>
                ))}
              </div>
              <div className="w-[8px] flex-shrink-0 bg-[#f8fafc] border-l border-slate-200"></div>
            </div>
            <TimeGrid mode="week" weekDays={weekDays} onGridClick={onGridClick} previewEvent={previewEvent} />
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
        onSwitchType={(newType) =>
          setAuthModal({ isOpen: true, type: newType })
        }
        onLoginSuccess={(username) => {
          setCurrentUser(username);
          setAuthModal((p) => ({ ...p, isOpen: false }));
        }}
      />
    </div>
  );
}
