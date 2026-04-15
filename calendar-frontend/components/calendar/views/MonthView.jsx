import React from "react";

export default function MonthView({ monthCells, handleDayClick }) {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-slate-200">
      <div className="flex shadow-sm flex-shrink-0 sticky top-0 z-20 bg-slate-200">
        <div className="flex-1 grid grid-cols-7 gap-px">
          {[
            "Thứ 2",
            "Thứ 3",
            "Thứ 4",
            "Thứ 5",
            "Thứ 6",
            "Thứ 7",
            "Chủ Nhật",
          ].map((d) => (
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
              onClick={() => handleDayClick(cell.fullDate)}
              className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all cursor-pointer
                ${!cell.isCurrentMonth ? "text-slate-400 opacity-60" : ""}
                ${
                  cell.isToday
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
  );
}
