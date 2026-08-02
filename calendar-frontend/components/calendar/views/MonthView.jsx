import React from "react";
import { Circle, CheckCircle, Calendar as CalendarIcon, Clock } from "lucide-react";
import { t } from "@/lib/i18n";
import HolidayChip from "@/components/ui/HolidayChip";
import { DAY_NAMES, formatDateLocal, getOrderedDayLabels, getWeekNumber } from "../../../lib/CalendarHelper";

export default function MonthView({ 
    monthCells, 
    handleDayClick, 
    events = [],
    onEventClick,
    onEventUpdate,
    previewEvent = null,
    appSettings = {}
}) {
  const lang = appSettings.language || "vi";

  // Lấy danh sách events cho từng cell
  function getEventsForCell(fullDate) {
    const dStr = formatDateLocal(fullDate);
    return events.filter(ev => formatDateLocal(new Date(ev.start_time)) === dStr);
  }

  function getHolidaysForCell(fullDate) {
    const dStr = formatDateLocal(fullDate);
    return events.filter(ev => ev.is_holiday && formatDateLocal(new Date(ev.start_time)) === dStr);
  }

  function getRegularEventsForCell(fullDate) {
    const dStr = formatDateLocal(fullDate);
    return events.filter(ev => !ev.is_holiday && formatDateLocal(new Date(ev.start_time)) === dStr);
  }

  const [draggingId, setDraggingId] = React.useState(null);

  const [hoverCellIdx, setHoverCellIdx] = React.useState(null);

  const handleDragStart = (e, ev) => {
    setDraggingId(ev.id);
    e.dataTransfer.setData("application/json", JSON.stringify(ev));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e, cellDate) => {
    e.preventDefault();
    setDraggingId(null);
    setHoverCellIdx(null);
    try {
        const data = e.dataTransfer.getData("application/json");
        if (!data) return;
        const ev = JSON.parse(data);
        const oldStart = new Date(ev.start_time);
        const newStart = new Date(cellDate);
        newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);
        onEventUpdate?.(ev, newStart);
    } catch (err) {
        console.error("Drop error:", err);
    }
  };

  // Month view luôn giữ bắt đầu từ Thứ 2 theo yêu cầu mới
  const dayHeaders = getOrderedDayLabels(lang, "monday");
  const showWeekends = appSettings.showWeekends !== false;
  const showWeekNum = appSettings.showWeekNumbers === true;

  const filteredHeaders = showWeekends 
    ? dayHeaders 
    : dayHeaders.filter((d) => {
        // Lọc bỏ Thứ 7 và Chủ Nhật dựa trên tên (hoặc index gốc trong DAY_NAMES)
        const isWeekend = d === DAY_NAMES.vi[0] || d === DAY_NAMES.vi[6] || 
                          d === DAY_NAMES.en[0] || d === DAY_NAMES.en[6];
        return !isWeekend;
      });

  const filteredCells = showWeekends 
    ? monthCells 
    : monthCells.filter(cell => {
        const d = cell.fullDate.getDay();
        return d !== 0 && d !== 6;
      });

  // Số lượng cột dựa trên settings — dùng inline style để Tailwind không bỏ sót class động
  const gridStyle = {
    gridTemplateColumns: showWeekNum
      ? `40px repeat(${showWeekends ? 7 : 5}, 1fr)`
      : `repeat(${showWeekends ? 7 : 5}, 1fr)`,
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-slate-200 dark:bg-[#1f1f1f]">
      <div className="flex shadow-sm flex-shrink-0 sticky top-0 z-20 bg-slate-200 dark:bg-[#1f1f1f]">
        <div className="flex-1 grid gap-px" style={gridStyle}>
          {showWeekNum && (
            <div className="bg-white dark:bg-[#2a2a2a] text-center py-3 text-[10px] font-bold text-slate-300 dark:text-[#616161] uppercase">
              {lang === 'vi' ? 'Tuần' : 'Wk'}
            </div>
          )}
          {filteredHeaders.map((d) => (
            <div key={d} className="bg-white dark:bg-[#2a2a2a] text-center py-3 text-sm font-semibold text-slate-500 dark:text-[#9e9e9e]">
              {d}
            </div>
          ))}
        </div>
      </div>
      <div className="grid flex-1 gap-px bg-slate-200 dark:bg-[#3c3c3c] mt-px" style={gridStyle}>
        {filteredCells.map((cell, idx) => {
          const cellEvents = getEventsForCell(cell.fullDate);
          const isHovered = hoverCellIdx === idx;
          const isFirstDayOfRow = idx % (showWeekends ? 7 : 5) === 0;
          
          return (
            <React.Fragment key={idx}>
              {showWeekNum && isFirstDayOfRow && (
                <div className="bg-white dark:bg-[#2a2a2a] flex items-start justify-center pt-3 text-[11px] font-medium text-slate-300 dark:text-[#616161] italic border-r border-slate-100 dark:border-[#3c3c3c]">
                  {getWeekNumber(cell.fullDate)}
                </div>
              )}
              <div 
                  className={`bg-white dark:bg-[#2a2a2a] p-2 min-h-[120px] transition-colors cursor-cell relative
                      ${isHovered ? "bg-blue-50/50 dark:bg-blue-900/20 ring-2 ring-inset ring-blue-400/30" : "hover:bg-slate-50 dark:hover:bg-[#2d2d2d]"}`}
                onDragOver={(e) => { e.preventDefault(); setHoverCellIdx(idx); }}
                onDragLeave={() => setHoverCellIdx(null)}
                onDrop={(e) => handleDrop(e, cell.fullDate)}
                onClick={(e) => {
                    // Mở Create Modal khi bấm vào vùng trống
                    const rect = e.currentTarget.getBoundingClientRect();
                    onEventClick?.(null, { 
                        clientX: e.clientX, 
                        clientY: e.clientY,
                        fullDate: cell.fullDate,
                        columnRect: rect
                    });
                }}
            >
              <div className="flex justify-between items-start mb-1">
                <div
                  onClick={(e) => { e.stopPropagation(); handleDayClick(cell.fullDate); }}
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-all cursor-pointer
                    ${!cell.isCurrentMonth ? "text-slate-400 dark:text-[#9e9e9e] opacity-60" : ""}
                    ${
                      cell.isToday
                        ? "bg-blue-600 text-white shadow-md font-bold"
                        : cell.isCurrentMonth
                        ? "text-slate-700 dark:text-[#9e9e9e] hover:bg-slate-200 dark:hover:bg-[#353535]"
                        : ""
                    }`}
                >
                  {cell.num}
                </div>
              </div>

              {/* Danh sách sự kiện nhỏ */}
              <div className="space-y-1 mt-1">
                {/* Preview Event (Tab mới đang tạo) */}
                {previewEvent && formatDateLocal(previewEvent.fullDate) === formatDateLocal(cell.fullDate) && (
                    <div className="text-[10px] px-1.5 py-0.5 rounded border border-blue-300 bg-blue-50 text-blue-700 shadow-sm transition-all">
                        <span className="opacity-60 mr-1">
                            {(previewEvent.fullDate || new Date()).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: lang !== 'vi' })} - ...
                        </span>
                        <span className="font-medium">{t('creating', lang)}</span>
                    </div>
                )}

                {/* Holiday events — hiển thị ở đầu ô ngày */}
                {getHolidaysForCell(cell.fullDate).map((ev) => (
                    <div key={ev.id} className="flex items-center">
                        <HolidayChip ev={ev} variant="cell" />
                    </div>
                ))}

                {/* Regular events */}
                {getRegularEventsForCell(cell.fullDate).map((ev) => {
                    const colors = {
                        blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:border-blue-800/50 dark:text-blue-300 dark:hover:bg-blue-900/60',
                        purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/40 dark:border-purple-800/50 dark:text-purple-300 dark:hover:bg-purple-900/60',
                        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:border-emerald-800/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60',
                        pink: 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100 dark:bg-pink-900/40 dark:border-pink-800/50 dark:text-pink-300 dark:hover:bg-pink-900/60',
                        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/40 dark:border-yellow-800/50 dark:text-yellow-300 dark:hover:bg-yellow-900/60',
                        red: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900/40 dark:border-red-800/50 dark:text-red-300 dark:hover:bg-red-900/60',
                    };
                    const colorClass = colors[ev.color] || colors.blue;
                    
                    const timeLocale = lang === 'vi' ? 'vi-VN' : 'en-US';
                    const hour12 = lang !== 'vi';

                    const startStr = new Date(ev.start_time).toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit', hour12 });
                    const endTime = ev.end_time || ev.deadline_time || ev.start_time;
                    const endStr = new Date(endTime).toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit', hour12 });

                    return (
                        <div 
                            key={ev.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, ev)}
                            onDragEnd={() => { setDraggingId(null); setHoverCellIdx(null); }}
                            onClick={(e) => { e.stopPropagation(); onEventClick?.(ev, e); }}
                            className={`text-[9px] px-1 py-0.5 rounded border truncate leading-tight cursor-pointer active:scale-95 transition-all flex items-center gap-1
                              ${colorClass} ${draggingId === ev.id ? 'opacity-20 scale-95' : ''}`}
                        >
                            <span className="flex-shrink-0 opacity-80">
                                {ev.event_type === 'task' ? (
                                    ev.is_completed ? <CheckCircle className="w-2.5 h-2.5" /> : <Circle className="w-2.5 h-2.5" />
                                ) : ev.event_type === 'appointment' ? (
                                    <Clock className="w-2.5 h-2.5" />
                                ) : (
                                    <CalendarIcon className="w-2.5 h-2.5" />
                                )}
                            </span>
                            <span className="opacity-70 text-[8px] whitespace-nowrap">{startStr}-{endStr}</span>
                            <span className="font-medium truncate">{ev.title}</span>
                        </div>
                    );
                })}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
