import React from "react";

export default function CalendarHeader({
  mode = "week",
  weekDays = [],
  selectedDate,
  selectedDayName,
  isSelectedToday,
  onDayClick,
  appSettings = {},
}) {
  const showWeekends = appSettings.showWeekends !== false;
  const displayWeekDays = (weekDays || []).filter(day => {
    if (mode === "day") return true;
    if (showWeekends) return true;
    const d = day.fullDate.getDay();
    return d !== 0 && d !== 6;
  });
  return (
    <div className="flex border-b border-slate-200 bg-white z-10 shadow-sm flex-shrink-0">
      <div className="w-16 flex-shrink-0 border-r border-slate-200"></div>

      {mode === "day" ? (
        <div className="flex-1 flex flex-col items-center justify-center py-3 border-l border-slate-200 bg-blue-50/20">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            {selectedDayName}
          </span>
          <span
            className={`text-3xl font-bold ${
              isSelectedToday ? "text-blue-700" : "text-slate-800"
            }`}
          >
            {selectedDate?.getDate()}
          </span>
        </div>
      ) : (
        <div className={`flex-1 grid ${showWeekends ? "grid-cols-7" : "grid-cols-5"}`}>
          {displayWeekDays.map((day, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center py-3 border-l border-slate-200"
            >
              <span
                className={`text-xs font-medium mb-1 ${
                  day.isToday ? "text-blue-600" : "text-slate-500"
                }`}
              >
                {day.day}
              </span>
              <span
                onClick={() => onDayClick?.(day.fullDate)}
                className={`text-xl flex items-center justify-center w-10 h-10 rounded-full transition-all cursor-pointer ${
                  day.isToday
                    ? "bg-blue-600 text-white font-bold shadow-md"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {day.date}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="w-[8px] flex-shrink-0 bg-[#f8fafc] border-l border-slate-200"></div>
    </div>
  );
}
