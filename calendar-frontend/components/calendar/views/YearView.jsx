import React from "react";
import { buildMonthCells, VI_MONTH_NAMES } from "../../../lib/CalendarHelper";

function MonthCard({ year, month, onDayClick }) {
  const cells = buildMonthCells(year, month);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 min-w-[196px]">
      <h3 className="text-sm font-semibold text-slate-700 mb-3 text-center">
        {VI_MONTH_NAMES[month]} {year}
      </h3>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium text-slate-400 mb-1">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[11px]">
        {cells.map((cell, idx) => (
          <div
            key={idx}
            onClick={(e) => cell.isCurrentMonth && onDayClick(cell.fullDate, e)}
            className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full
              ${
                !cell.isCurrentMonth
                  ? "text-slate-300 cursor-default"
                  : "cursor-pointer text-slate-700 hover:bg-slate-100"
              }
              ${cell.isToday ? "!bg-blue-600 !text-white font-bold" : ""}`}
          >
            {cell.num}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function YearView({ viewDate, onYearDayClick }) {
  return (
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
  );
}
