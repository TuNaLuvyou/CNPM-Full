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
    <div className="flex border-b border-slate-200 dark:border-[#3c3c3c] bg-white dark:bg-[#2a2a2a] z-10 shadow-sm flex-shrink-0">
      <div className="w-16 flex-shrink-0 border-r border-slate-200 dark:border-[#3c3c3c] flex items-center justify-center">
        <span className="text-[10px] font-bold text-slate-500 dark:text-[#9e9e9e] uppercase">
          {appSettings.primaryTimezone ? (new Intl.DateTimeFormat('vi-VN', { timeZoneName: 'short', timeZone: appSettings.primaryTimezone }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || 'GMT+7') : 'GMT+7'}
        </span>
      </div>

      {mode === "day" ? (
        <div className="flex-1 flex flex-col items-center justify-center py-3 border-l border-slate-200 dark:border-[#484848] bg-blue-50/20 dark:bg-transparent">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            {selectedDayName}
          </span>
          <span
            className={`text-3xl flex items-center justify-center w-14 h-14 rounded-full transition-all ${
              isSelectedToday 
                ? "bg-blue-600 text-white font-bold shadow-md" 
                : "font-bold text-slate-800 dark:text-[#f5f5f5]"
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
              className="flex flex-col items-center justify-center py-3 border-l border-slate-200 dark:border-[#484848]"
            >
              <span
                className={`text-xs font-medium mb-1 ${
                  day.isToday ? "text-blue-600" : "text-slate-500 dark:text-[#9e9e9e]"
                }`}
              >
                {day.day}
              </span>
              <span
                onClick={() => onDayClick?.(day.fullDate)}
                className={`text-xl flex items-center justify-center w-10 h-10 rounded-full transition-all cursor-pointer ${
                  day.isToday
                    ? "bg-blue-600 text-white font-bold shadow-md"
                    : "text-slate-700 dark:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#353535]"
                }`}
              >
                {day.date}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="w-[8px] flex-shrink-0 bg-[#f8fafc] dark:bg-[#2a2a2a] border-l border-slate-200 dark:border-[#3c3c3c]"></div>
    </div>
  );
}
