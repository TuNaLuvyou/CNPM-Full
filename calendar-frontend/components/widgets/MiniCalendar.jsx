"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { VI_MONTH_NAMES, buildMonthCells, formatDateLocal } from "../../lib/CalendarHelper";

export default function MiniCalendar({ onDayClick, viewDate, selectedDate, events = [] }) {
  const [localDate, setLocalDate] = useState(() => {
    const base = viewDate || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  // Đồng bộ khi main calendar điều hướng
  useEffect(() => {
    if (viewDate)
      setLocalDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1));
  }, [viewDate]);

  const year = localDate.getFullYear();
  const month = localDate.getMonth();
  const cells = buildMonthCells(year, month).slice(0, 35); // Cố định 35 ngày (5 hàng)

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
        <h2 className="font-semibold text-slate-700 text-sm">
          {VI_MONTH_NAMES[month]} năm {year}
        </h2>
        <div className="flex space-x-1">
          <button
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-slate-200 rounded-md text-slate-500"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-1 hover:bg-slate-200 rounded-md text-slate-500"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
          <div key={d} className="truncate px-0.5" title={d}>
            {d === "CN" ? "CN" : d.replace("Thứ ", "T")}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
        {cells.map((day, idx) => {
            const hasEv = day.isCurrentMonth && hasEvent(day.fullDate);
            
            return (
          <div
            key={idx}
            onClick={() => onDayClick?.(day.fullDate)}
            className="relative py-0.5"
          >
            <div
                className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full cursor-pointer transition-colors
                                ${
                                  !day.isCurrentMonth
                                    ? "text-slate-300 hover:bg-slate-50"
                                    : "text-slate-700 hover:bg-slate-100"
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
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full ${isSelected(day) ? 'bg-white' : 'bg-blue-500'}`} />
            )}
          </div>
        )})}
      </div>
    </div>
  );
}
