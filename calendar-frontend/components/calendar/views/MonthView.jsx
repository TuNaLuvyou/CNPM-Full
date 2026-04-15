import React from "react";
import { formatDateLocal } from "../../../lib/CalendarHelper";

export default function MonthView({ 
    monthCells, 
    handleDayClick, 
    events = [],
    onEventClick,
    onEventUpdate,
    previewEvent = null
}) {
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

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-slate-200">
      <div className="flex shadow-sm flex-shrink-0 sticky top-0 z-20 bg-slate-200">
        <div className="flex-1 grid grid-cols-7 gap-px">
          {[
            "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật",
          ].map((d) => (
            <div key={d} className="bg-white text-center py-3 text-sm font-semibold text-slate-500">
              {d}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 flex-1 gap-px bg-slate-200 mt-px">
        {monthCells.map((cell, idx) => {
          const cellEvents = getEventsForCell(cell.fullDate);
          const isHovered = hoverCellIdx === idx;
          
          return (
            <div 
                key={idx} 
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
                            {(previewEvent.fullDate || new Date()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-medium">Đang tạo...</span>
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
                    const time = new Date(ev.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                        <div 
                            key={ev.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, ev)}
                            onDragEnd={() => { setDraggingId(null); setHoverCellIdx(null); }}
                            onClick={(e) => { e.stopPropagation(); onEventClick?.(ev, e); }}
                            className={`text-[10px] px-1.5 py-0.5 rounded border truncate leading-tight cursor-pointer active:scale-95 transition-all
                                ${colorClass} ${draggingId === ev.id ? 'opacity-20 scale-95' : ''}`}
                        >
                            <span className="opacity-60 mr-1">{time}</span>
                            <span className="font-medium">{ev.title}</span>
                        </div>
                    );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
