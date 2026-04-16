import { buildMonthCells, MONTH_NAMES, formatDateLocal, getOrderedDayKeys } from "../../../lib/CalendarHelper";
import { t } from "@/lib/i18n";

function MonthCard({ year, month, onDayClick, events = [], appSettings = {} }) {
  const lang = appSettings.language || "vi";
  const showWeekends = appSettings.showWeekends !== false;
  const cells = buildMonthCells(year, month, "monday");
  
  const hasEvent = (date) => {
    const dStr = formatDateLocal(date);
    return events.some(ev => formatDateLocal(new Date(ev.start_time)) === dStr);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 min-w-[196px]">
      <h3 className="text-sm font-semibold text-slate-700 mb-3 text-center">
        {(MONTH_NAMES[lang] || MONTH_NAMES.vi)[month]} {year}
      </h3>
      <div className={`grid ${showWeekends ? "grid-cols-7" : "grid-cols-5"} gap-0.5 text-center text-[11px] font-medium text-slate-400 mb-1`}>
        {getOrderedDayKeys("monday").filter(key => {
          if (showWeekends) return true;
          return key !== 'sat' && key !== 'sun';
        }).map((key) => {
          const label = t(`mini_calendar.days.${key}`, lang);
          return (
            <div key={key} className="truncate" title={label}>
              {label}
            </div>
          );
        })}
      </div>
      <div className={`grid ${showWeekends ? "grid-cols-7" : "grid-cols-5"} gap-0.5 text-center text-[11px]`}>
        {cells.filter(cell => {
          if (showWeekends) return true;
          const d = cell.fullDate.getDay();
          return d !== 0 && d !== 6;
        }).map((cell, idx) => {
          const hasEv = cell.isCurrentMonth && hasEvent(cell.fullDate);
          
          return (
            <div
              key={idx}
              onClick={(e) => cell.isCurrentMonth && onDayClick(cell.fullDate, e)}
              className="relative py-1 cursor-default group"
            >
              <div
                className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full transition-colors
                  ${
                    !cell.isCurrentMonth
                      ? "text-slate-300 pointer-events-none"
                      : "cursor-pointer text-slate-700 hover:bg-slate-100"
                  }
                  ${cell.isToday ? "!bg-blue-600 !text-white font-bold" : ""}`}
              >
                {cell.num}
              </div>
              {hasEv && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function YearView({ viewDate, onYearDayClick, events = [], appSettings = {} }) {
  return (
    <div className="flex-1 overflow-auto custom-scrollbar">
      <div className="grid grid-cols-4 gap-5 p-6 min-w-[880px]">
        {Array.from({ length: 12 }, (_, m) => (
          <MonthCard
            key={m}
            year={viewDate.getFullYear()}
            month={m}
            onDayClick={onYearDayClick}
            events={events}
            appSettings={appSettings}
          />
        ))}
      </div>
    </div>
  );
}
