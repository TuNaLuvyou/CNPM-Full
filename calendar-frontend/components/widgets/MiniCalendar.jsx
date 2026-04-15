"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { VI_MONTH_NAMES, buildMonthCells } from "../../lib/CalendarHelper";

export default function MiniCalendar({ onDayClick, viewDate, selectedDate }) {
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

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-700">
          {VI_MONTH_NAMES[month]} năm {year}
        </h2>
        <div className="flex space-x-1">
          <button
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-slate-200 rounded-md text-slate-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-1 hover:bg-slate-200 rounded-md text-slate-500"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
          <div key={d} className="truncate px-0.5" title={d}>
            {d === "CN" ? "CN" : d.replace("Thứ ", "T")}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((day, idx) => (
          <div
            key={idx}
            onClick={() => onDayClick?.(day.fullDate)}
            className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full cursor-pointer transition-colors
                            ${
                              !day.isCurrentMonth
                                ? "text-slate-300 hover:bg-slate-100"
                                : "text-slate-700 hover:bg-slate-200"
                            }
                            ${
                              day.isToday && !isSelected(day)
                                ? "border border-blue-500 text-blue-600 font-semibold"
                                : ""
                            }
                            ${
                              isSelected(day)
                                ? "!bg-blue-600 !text-white font-semibold shadow-sm"
                                : ""
                            }`}
          >
            {day.num}
          </div>
        ))}
      </div>
    </div>
  );
}
