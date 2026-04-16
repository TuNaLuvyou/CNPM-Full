import React from "react";
import { Circle, CheckCircle, Calendar as CalendarIcon, Clock } from "lucide-react";
import { t } from "@/lib/i18n";
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

  // Số lượng cột dựa trên settings
  const columnCount = (showWeekends ? 7 : 5) + (showWeekNum ? 1 : 0);
  const gridStyle = { gridTemplateColumns: `repeat(${columnCount}, 1fr)` };
  // Nếu hiện số tuần thì cột đầu tiên hẹp hơn
  const gridClass = showWeekNum 
    ? `grid-cols-[40px_repeat(${showWeekends ? 7 : 5},1fr)]` 
    : `grid-cols-${showWeekends ? 7 : 5}`;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-slate-200">
      <div className="flex shadow-sm flex-shrink-0 sticky top-0 z-20 bg-slate-200">
        <div className={`flex-1 grid ${gridClass} gap-px`}>
          {showWeekNum && (
            <div className="bg-white text-center py-3 text-[10px] font-bold text-slate-300 uppercase">
              {lang === 'vi' ? 'Tuần' : 'Wk'}
            </div>
          )}
          {filteredHeaders.map((d) => (
            <div key={d} className="bg-white text-center py-3 text-sm font-semibold text-slate-500">
              {d}
            </div>
          ))}
        </div>
      </div>
      <div className={`grid ${gridClass} flex-1 gap-px bg-slate-200 mt-px`}>
        {filteredCells.map((cell, idx) => {
          const cellEvents = getEventsForCell(cell.fullDate);
          const isHovered = hoverCellIdx === idx;
          const isFirstDayOfRow = idx % (showWeekends ? 7 : 5) === 0;
          
          return (
            <React.Fragment key={idx}>
              {showWeekNum && isFirstDayOfRow && (
                <div className="bg-white flex items-start justify-center pt-3 text-[11px] font-medium text-slate-300 italic border-r border-slate-100">
                  {getWeekNumber(cell.fullDate)}
                </div>
              )}
              <div 
                  className={`bg-white p-2 min-h-[120px] transition-colors cursor-cell relative
                      ${isHovered ? "bg-blue-50/50 ring-2 ring-inset ring-blue-400/30" : "hover:bg-slate-50"}`}
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
                    ${!cell.isCurrentMonth ? "text-slate-400 opacity-60" : ""}
                    ${
                      cell.isToday
                        ? "bg-blue-600 text-white shadow-md font-bold"
                        : cell.isCurrentMonth
                        ? "text-slate-700 hover:bg-slate-200"
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

                {cellEvents.map((ev) => {
                    const colors = {
                        blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
                        purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
                        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
                        pink: 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100',
                        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100',
                        red: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
                    };
                    const colorClass = colors[ev.color] || colors.blue;
                    
                    const timeLocale = lang === 'vi' ? 'vi-VN' : 'en-US';
                    const hour12 = lang !== 'vi';

                    const startStr = new Date(ev.start_time).toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit', hour12 });
                    const endTime = ev.end_time || ev.deadline_time || ev.start_time;
                    const endStr = new Date(endTime).toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit', hour12 });
                    const isPast = appSettings.dimPastEvents && new Date(endTime) < new Date();

                    return (
                        <div 
                            key={ev.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, ev)}
                            onDragEnd={() => { setDraggingId(null); setHoverCellIdx(null); }}
                            onClick={(e) => { e.stopPropagation(); onEventClick?.(ev, e); }}
                            className={`text-[9px] px-1 py-0.5 rounded border truncate leading-tight cursor-pointer active:scale-95 transition-all flex items-center gap-1
                                ${colorClass} ${draggingId === ev.id ? 'opacity-20 scale-95' : ''}
                                ${isPast ? 'opacity-50 grayscale-[0.3]' : ''}`}
                        >
                            <span className="flex-shrink-0 opacity-80">
                                {ev.event_type === 'task' ? (
                                    ev.is_completed ? <CheckCircle className="w-2.5 h-2.5" /> : <Circle className="w-2.5 h-2.5" />
                                ) : ev.event_type === 'appointment' ? (
                                    <CalendarIcon className="w-2.5 h-2.5" />
                                ) : (
                                    <Clock className="w-2.5 h-2.5" />
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
