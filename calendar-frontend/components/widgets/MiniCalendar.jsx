"use client";
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTH_NAMES, buildMonthCells, formatDateLocal, getOrderedDayKeys, getWeekNumber } from "../../lib/CalendarHelper";
import { t } from "@/lib/i18n";

export default function MiniCalendar({ 
  onDayClick, 
  viewDate, 
  selectedDate, 
  events = [],
  appSettings = {}
}) {
  const lang = appSettings.language || "vi";
  const [localDate, setLocalDate] = useState(() => {
    const base = viewDate || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const showWeekNum = appSettings.showWeekNumbers === true;
  const showWeekends = appSettings.showWeekends !== false;

  // Đồng bộ khi main calendar điều hướng
  const [prevViewDate, setPrevViewDate] = useState(viewDate);
  if (viewDate && prevViewDate !== viewDate) {
    setPrevViewDate(viewDate);
    setLocalDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1));
  }

  const year = localDate.getFullYear();
  const month = localDate.getMonth();
  const cells = buildMonthCells(year, month, "monday").slice(0, 35);

  const navigate = (dir) => setLocalDate(new Date(year, month + dir, 1));

  const isSelected = (cell) =>
    selectedDate &&
    cell.fullDate.toDateString() === selectedDate.toDateString();

  const hasEvent = (date) => {
    const dStr = formatDateLocal(date);
    return events.some(ev => formatDateLocal(new Date(ev.start_time)) === dStr);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-700 dark:text-[#e3e3e3] text-sm">
          {(MONTH_NAMES[lang] || MONTH_NAMES.vi)[month]} {year}
        </h2>
        <div className="flex space-x-1">
          <button
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-slate-200 dark:hover:bg-[#353535] rounded-md text-slate-500 dark:text-[#9e9e9e]"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-1 hover:bg-slate-200 dark:hover:bg-[#353535] rounded-md text-slate-500 dark:text-[#9e9e9e]"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className={`grid ${showWeekNum ? (showWeekends ? "grid-cols-[20px_repeat(7,1fr)]" : "grid-cols-[20px_repeat(5,1fr)]") : (showWeekends ? "grid-cols-7" : "grid-cols-5")} gap-1 text-center text-[10px] font-bold text-slate-400 dark:text-[#9e9e9e] mb-2`}>
        {showWeekNum && <div className="text-slate-300">W</div>}
        {getOrderedDayKeys("monday").filter(key => {
          if (showWeekends) return true;
          return key !== 'sat' && key !== 'sun';
        }).map((key) => {
          const label = t(`mini_calendar.days.${key}`, lang);
          return (
            <div key={key} className="truncate px-0.5" title={label}>
              {label}
            </div>
          );
        })}
      </div>

      <div className={`grid ${showWeekNum ? (showWeekends ? "grid-cols-[20px_repeat(7,1fr)]" : "grid-cols-[20px_repeat(5,1fr)]") : (showWeekends ? "grid-cols-7" : "grid-cols-5")} gap-1 text-center text-[11px]`}>
        {cells.filter(cell => {
            if (showWeekends) return true;
            const d = cell.fullDate.getDay();
            return d !== 0 && d !== 6;
        }).map((day, idx) => {
            const hasEv = day.isCurrentMonth && hasEvent(day.fullDate);
            const isFirstDayOfRow = idx % (showWeekends ? 7 : 5) === 0;
            
            return (
              <React.Fragment key={idx}>
                {showWeekNum && isFirstDayOfRow && (
                  <div className="flex items-center justify-center text-[9px] text-slate-300 font-medium italic">
                    {getWeekNumber(day.fullDate)}
                  </div>
                )}
                <div
                    onClick={() => onDayClick?.(day.fullDate)}
                    className="relative py-0.5"
                >
                    <div
                        className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full cursor-pointer transition-colors
                                        ${
                                          !day.isCurrentMonth
                                            ? "text-slate-300 dark:text-[#484848] hover:bg-slate-50 dark:hover:bg-[#2d2d2d]"
                                            : "text-slate-700 dark:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#353535]"
                                        }
                                        ${
                                          day.isToday && !isSelected(day)
                                            ? "border border-blue-400 text-blue-600 font-bold"
                                            : ""
                                        }
                                        ${
                                          isSelected(day)
                                            ? "!bg-blue-600 !text-white font-bold shadow-sm"
                                            : ""
                                        }`}
                    >
                        {day.num}
                    </div>
                    {hasEv && (
                        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full ${isSelected(day) ? 'bg-white dark:bg-[#2d2d2d]' : 'bg-blue-500'}`} />
                    )}
                </div>
              </React.Fragment>
        )})}
      </div>
    </div>
  );
}
