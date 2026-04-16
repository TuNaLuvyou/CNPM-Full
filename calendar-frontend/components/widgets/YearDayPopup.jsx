import React, { useEffect, useRef } from "react";
import { X, Calendar as CalendarIcon, Clock, CheckCircle, Circle } from "lucide-react";
import { DAY_NAMES, MONTH_NAMES } from "../../lib/CalendarHelper";
import { t } from "@/lib/i18n";

export default function YearDayPopup({
  isOpen,
  date,
  events = [],
  onClose,
  onNavigateToDay,
  position,
  onEventClick,
  appSettings = {}
}) {
  const lang = appSettings.language || "vi";
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
      // Bỏ qua nếu click vào vùng của CreateModal
      if (e.target.closest('.create-modal-root')) return;
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

  const dayName = (DAY_NAMES[lang] || DAY_NAMES.vi)[date.getDay()];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div
        ref={popupRef}
        style={finalStyle}
        className="year-day-popup absolute pointer-events-auto w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
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
                <div
                  key={i}
                  onClick={(e) => { e.stopPropagation(); onEventClick?.(ev, e); }}
                  className="flex gap-3 items-start p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors active:scale-95"
                >
                  <div className="flex-shrink-0 mt-1">
                    {ev.event_type === 'task' ? (
                      ev.is_completed ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Circle className="w-3.5 h-3.5 text-slate-400" />
                    ) : ev.event_type === 'appointment' ? (
                      <CalendarIcon className="w-3.5 h-3.5 text-purple-500" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {ev.title}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {ev.time_start_display
                        ? `${ev.time_start_display} ${ev.time_end_display ? `- ${ev.time_end_display}` : ""}`
                        : t('all_day', lang)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
              <CalendarIcon className="w-10 h-10 mb-2 opacity-10" />
              <p className="text-sm font-medium italic px-4">
                {t('no_events_day', lang)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
