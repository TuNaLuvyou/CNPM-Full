import React from "react";
import { formatDateLocal } from "../../lib/CalendarHelper";

export default function CalendarHeader({
  mode = "week",
  weekDays = [],
  selectedDate,
  selectedDayName,
  isSelectedToday,
  onDayClick,
  appSettings = {},
  events = [],
}) {
  const showWeekends = appSettings.showWeekends !== false;
  const displayWeekDays = (weekDays || []).filter(day => {
    if (mode === "day") return true;
    if (showWeekends) return true;
    const d = day.fullDate.getDay();
    return d !== 0 && d !== 6;
  });
  // Lấy holiday events cho một ngày cụ thể
  function getHolidaysForDate(date) {
    if (!date) return [];
    const dStr = formatDateLocal(date);
    return events.filter(ev => ev.is_holiday && formatDateLocal(new Date(ev.start_time)) === dStr);
  }

  // Colour pill cho holiday
  const holidayPillColors = {
    red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    pink: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    green: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  };

  // Kiểm tra có holiday nào cần hiển thị không
  const hasAnyHoliday = mode === "day"
    ? getHolidaysForDate(selectedDate).length > 0
    : displayWeekDays.some(day => getHolidaysForDate(day.fullDate).length > 0);

  return (
    <div className="flex flex-col border-b border-slate-200 dark:border-[#3c3c3c] bg-white dark:bg-[#2a2a2a] z-10 shadow-sm flex-shrink-0">
      {/* Row ngày */}
      <div className="flex">
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

      {/* Holiday banner row — chỉ hiển khi có ngày lễ */}
      {hasAnyHoliday && (
        <div className="flex border-t border-slate-100 dark:border-[#3c3c3c]">
          <div className="w-16 flex-shrink-0 border-r border-slate-200 dark:border-[#3c3c3c]"></div>
          {mode === "day" ? (
            <div className="flex-1 border-l border-slate-200 dark:border-[#484848] px-2 py-1 flex flex-wrap gap-1">
              {getHolidaysForDate(selectedDate).map(ev => (
                <span
                  key={ev.id}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${holidayPillColors[ev.color] || holidayPillColors.red}`}
                >
                  {ev.title}
                </span>
              ))}
            </div>
          ) : (
            <div className={`flex-1 grid ${showWeekends ? "grid-cols-7" : "grid-cols-5"}`}>
              {displayWeekDays.map((day, idx) => {
                const dayHolidays = getHolidaysForDate(day.fullDate);
                return (
                  <div key={idx} className="border-l border-slate-200 dark:border-[#484848] px-1 py-1 min-h-[28px] flex flex-col gap-0.5">
                    {dayHolidays.map(ev => (
                      <span
                        key={ev.id}
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded truncate ${holidayPillColors[ev.color] || holidayPillColors.red}`}
                        title={ev.title}
                      >
                        {ev.title}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
          <div className="w-[8px] flex-shrink-0 bg-[#f8fafc] dark:bg-[#2a2a2a] border-l border-slate-200 dark:border-[#3c3c3c]"></div>
        </div>
      )}
    </div>
  );
}
