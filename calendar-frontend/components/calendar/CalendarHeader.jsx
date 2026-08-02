import React from "react";
import Tooltip from "@/components/ui/Tooltip";
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
  const showSecondaryTz = appSettings.showSecondaryTimezone === true;

  // Đo bề rộng thanh cuộn dọc của TimeGrid để các cột ngày/lễ/giờ thẳng hàng nhau.
  // Dùng đúng class custom-scrollbar (6px ở dark mode) và đo lại khi đổi theme.
  const [scrollbarWidth, setScrollbarWidth] = React.useState(0);
  React.useEffect(() => {
    const measure = () => {
      const el = document.createElement("div");
      el.classList.add("custom-scrollbar");
      el.style.cssText =
        "position:absolute;visibility:hidden;top:-9999px;left:-9999px;width:50px;height:50px;overflow:scroll;";
      document.body.appendChild(el);
      setScrollbarWidth(el.offsetWidth - el.clientWidth);
      document.body.removeChild(el);
    };
    measure();
    const observer = new MutationObserver(measure);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);
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

  // Holiday của ngày đang chọn (chế độ Ngày)
  const selectedDayHolidays = mode === "day" ? getHolidaysForDate(selectedDate) : [];
  const selectedHolidayNames = selectedDayHolidays.map(h => h.title).join(" • ");

  return (
    <div className="flex flex-col border-b border-slate-200 dark:border-[#3c3c3c] bg-white dark:bg-[#2a2a2a] z-10 shadow-sm flex-shrink-0">
      {/* Row ngày */}
      <div className="flex" style={{ paddingRight: scrollbarWidth }}>
        {showSecondaryTz && (
          <div className="w-14 flex-shrink-0 border-r border-slate-200 dark:border-[#3c3c3c]"></div>
        )}
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
            {selectedDayHolidays.length > 0 ? (
              <Tooltip position="bottom" label={selectedHolidayNames}>
                <span
                  className={`text-3xl flex items-center justify-center w-14 h-14 rounded-full transition-all cursor-pointer ${
                    isSelectedToday
                      ? "bg-red-600 text-white font-bold shadow-md ring-2 ring-red-300 dark:ring-red-500/40"
                      : "bg-red-600 text-white font-bold shadow-md hover:bg-red-700"
                  }`}
                >
                  {selectedDate?.getDate()}
                </span>
              </Tooltip>
            ) : (
              <span
                className={`text-3xl flex items-center justify-center w-14 h-14 rounded-full transition-all ${
                  isSelectedToday
                    ? "bg-blue-600 text-white font-bold shadow-md"
                    : "font-bold text-slate-800 dark:text-[#f5f5f5]"
                }`}
              >
                {selectedDate?.getDate()}
              </span>
            )}
          </div>
        ) : (
          <div className={`flex-1 grid ${showWeekends ? "grid-cols-7" : "grid-cols-5"}`}>
            {displayWeekDays.map((day, idx) => {
              const dayHolidays = getHolidaysForDate(day.fullDate);
              const holidayNames = dayHolidays.map(h => h.title).join(" • ");
              return (
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
                  {dayHolidays.length > 0 ? (
                    <Tooltip position="bottom" label={holidayNames}>
                      <span
                        onClick={() => onDayClick?.(day.fullDate)}
                        className={`text-xl flex items-center justify-center w-10 h-10 rounded-full transition-all cursor-pointer ${
                          day.isToday
                            ? "bg-red-600 text-white font-bold shadow-md ring-2 ring-red-300 dark:ring-red-500/40"
                            : "bg-red-600 text-white font-bold shadow-md hover:bg-red-700"
                        }`}
                      >
                        {day.date}
                      </span>
                    </Tooltip>
                  ) : (
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
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
