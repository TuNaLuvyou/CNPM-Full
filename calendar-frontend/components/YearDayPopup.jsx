"use client";
import React, { useEffect, useRef } from "react";
import { X, Calendar as CalendarIcon, Clock, CheckSquare } from "lucide-react";
import { VI_DAY_NAMES, VI_MONTH_NAMES } from "../lib/CalendarHelper";

export default function YearDayPopup({ isOpen, date, events = [], onClose, onNavigateToDay, position }) {
  const popupRef = useRef(null);
  const [finalStyle, setFinalStyle] = React.useState({ opacity: 0 });

  useEffect(() => {
    // Reset style ngay khi có date/position mới để tránh bị "nhảy" từ vị trí cũ
    setFinalStyle({ opacity: 0 });

    if (isOpen && popupRef.current && position) {
      const rect = popupRef.current.getBoundingClientRect();
      const padding = 20; // Khoảng cách an toàn với mép màn hình
      
      let top = position.y - rect.height - 10;
      let left = position.x - rect.width / 2;

      // Nếu bị tràn lên trên -> Đẩy xuống dưới điểm click
      if (top < padding) {
        top = position.y + 20; 
      }

      // Chống tràn trái/phải
      if (left < padding) {
        left = padding;
      } else if (left + rect.width > window.innerWidth - padding) {
        left = window.innerWidth - rect.width - padding;
      }

      // Chống tràn dưới
      if (top + rect.height > window.innerHeight - padding) {
        top = window.innerHeight - rect.height - padding;
      }

      setFinalStyle({
        top: `${top}px`,
        left: `${left}px`,
        opacity: 1,
      });
    }
  }, [isOpen, position]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !date) return null;

  const VI_FULL_DAY_NAMES = [
    "Chủ Nhật",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
  ];
  const dayName = VI_FULL_DAY_NAMES[date.getDay()];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div
        ref={popupRef}
        style={finalStyle}
        className="absolute pointer-events-auto w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* ══ HEADER ══ */}
        <div className="p-4 flex flex-col items-center relative border-b border-slate-100 bg-slate-50/30">
          <button 
            onClick={onClose}
            className="absolute right-3 top-3 p-1 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
          
          <button 
            onClick={() => onNavigateToDay(date)}
            className="flex flex-col items-center group"
          >
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-blue-600 transition-colors">
              {dayName}
            </span>
            <div className="w-12 h-12 flex items-center justify-center rounded-full group-hover:bg-slate-100 transition-all duration-300 bg-white">
              <span className="text-2xl font-bold text-slate-800 transition-colors">
                {date.getDate()}
              </span>
            </div>
          </button>
        </div>

        {/* ══ EVENTS LIST ══ */}
        <div className="flex-1 overflow-y-auto max-h-60 p-4 bg-white">
          {events.length > 0 ? (
            <div className="space-y-3">
              {events.map((ev, i) => (
                <div key={i} className="flex gap-3 items-start p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${ev.type === 'task' ? 'bg-emerald-500' : ev.type === 'appointment' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{ev.title}</p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {ev.timeStart ? `${ev.timeStart} ${ev.timeEnd ? `- ${ev.timeEnd}` : ''}` : 'Cả ngày'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
              <CalendarIcon className="w-10 h-10 mb-2 opacity-10" />
              <p className="text-sm font-medium italic px-4">Bạn chưa lên lịch sự kiện này</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
