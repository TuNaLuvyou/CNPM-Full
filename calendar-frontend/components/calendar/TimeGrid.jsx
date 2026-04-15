"use client";
import { useState, useEffect, useRef } from "react";
import { getVNTime } from "../../lib/CalendarHelper"; // Import hàm giờ VN

const HOUR_HEIGHT = 64;

/** Tính vị trí px của đường đỏ từ 00:00 (chuẩn giờ VN) */
function getNowOffset() {
  const now = getVNTime();
  // 10:00 AM -> 10 * 64px = 640px. 
  // Vì lưới grid thực sự bắt đầu từ 64px (h-16), nên offset này sẽ khớp với vạch kẻ ngang của từng giờ.
  return (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;
}

export default function TimeGrid({
  hours,
  weekDays,
  mode = "week",
  onGridClick,
  previewEvent,
  setPreviewEvent,
  setIsPreviewDragging,
  onInteractionEnd,
  setSelectedDate,
}) {
  const displayHours = hours || Array.from({ length: 24 }, (_, i) => i);
  const displayWeekDays = weekDays || [];

  const [nowOffset, setNowOffset] = useState(getNowOffset);
  const scrollRef = useRef(null);
  const gridContainerRef = useRef(null);
  const isInteractingRef = useRef(false);

  // Interaction state
  const [interaction, setInteraction] = useState(null); // { type, startY, startTop, startHeight, startDayIdx, grabOffsetY }

  // Ref để luôn truy cập được previewEvent mới nhất trong các closure handler (mouseup)
  const latestPreviewRef = useRef(previewEvent);
  useEffect(() => {
    latestPreviewRef.current = previewEvent;
  }, [previewEvent]);

  useEffect(() => {
    const id = setInterval(() => setNowOffset(getNowOffset()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Sync scroll to preview - Tự động cuộn khi preview thay đổi hoặc ra ngoài vùng nhìn thấy
  useEffect(() => {
    if (previewEvent && scrollRef.current) {
      // Bù 64px header
      const top = (previewEvent.type === "now" ? nowOffset : (previewEvent.top || 0)) + 64;
      const scrollEl = scrollRef.current;
      const currentScroll = scrollEl.scrollTop;
      const containerHeight = scrollEl.clientHeight;
      
      // Chỉ cuộn nếu nằm ngoài vùng nhìn thấy hoặc là lần tạo đầu tiên (ts thay đổi)
      const buffer = 100;
      const isOutOfBounds = top < currentScroll + buffer || top > currentScroll + containerHeight - buffer;
      
      if (isOutOfBounds || !interaction) {
        const targetScroll = Math.max(0, top - containerHeight / 3);
        scrollEl.scrollTo({ top: targetScroll, behavior: "smooth" });
      }
    }
  }, [previewEvent?.ts, previewEvent?.top, !!interaction]);

  const handleInteractionStart = (e, type) => {
    e.stopPropagation();
    e.preventDefault();
    if (!previewEvent) return;

    isInteractingRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    const grabOffsetY = e.clientY - rect.top;
    
    setInteraction({
      type,
      startY: e.clientY,
      startTop: previewEvent.type === 'now' ? nowOffset : (previewEvent.top || 0),
      startHeight: previewEvent.height || 64,
      startDayIdx: displayWeekDays.findIndex(d => d.fullDate.toDateString() === previewEvent.fullDate.toDateString()),
      grabOffsetY: type === 'move' ? grabOffsetY : 0
    });

    if (type === 'move') {
      setIsPreviewDragging(true);
    }
  };

  useEffect(() => {
    if (!interaction) return;

    const handleMouseMove = (e) => {
      const containerRect = gridContainerRef.current.getBoundingClientRect();
      const contentTop = containerRect.top + 64; // Vạch 00:00
      // SNAP 1 phút = 64 / 60 = 1.066px
      const SNAP = 64 / 60; 

      if (interaction.type === 'move') {
        const mouseRelY = e.clientY - contentTop;
        const newTopUnsnapped = mouseRelY - interaction.grabOffsetY;
        const newTop = Math.max(0, Math.round(newTopUnsnapped / SNAP) * SNAP);
        
        // Cần tính lại ngày nếu kéo ngang
        const columnWidth = (containerRect.width - 64) / (mode === 'day' ? 1 : 7);
        const relativeX = e.clientX - (containerRect.left + 64);
        let dayIdx = 0;
        
        if (mode === 'week') {
            const calculatedIdx = Math.floor(relativeX / columnWidth);
            dayIdx = Math.max(0, Math.min(displayWeekDays.length - 1, calculatedIdx));
        }

        const newDate = displayWeekDays[dayIdx]?.fullDate;
        
        if (newDate) {
          // Tính toán chính xác giờ và phút từ newTop
          const totalMinutes = Math.round((newTop / HOUR_HEIGHT) * 60);
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          
          const updatedDate = new Date(newDate);
          updatedDate.setHours(hours, minutes, 0, 0);

          // Cập nhật selectedDate để MiniCalendar nhảy theo thời gian thực
          if (setSelectedDate) {
             setSelectedDate(updatedDate);
          }

          setPreviewEvent(prev => ({
            ...prev,
            top: newTop,
            fullDate: updatedDate,
            type: 'grid' 
          }));
        }
      } else if (interaction.type === 'resize') {
        const deltaY = e.clientY - interaction.startY;
        const newHeightUnsnapped = interaction.startHeight + deltaY;
        const newHeight = Math.max(SNAP, Math.round(newHeightUnsnapped / SNAP) * SNAP);

        setPreviewEvent(prev => ({
          ...prev,
          height: newHeight
        }));
      }
    };

    const handleMouseUp = (e) => {
      const latest = latestPreviewRef.current;
      if (interaction && latest) {
        const targetDateStr = latest.fullDate?.toDateString();
        const targetCol = document.querySelector(`[data-column-date="${targetDateStr}"]`);
        if (targetCol) {
          onInteractionEnd?.({
            fullDate: latest.fullDate,
            topOffset: latest.top,
            columnRect: targetCol.getBoundingClientRect()
          });
        }
      }
      setInteraction(null);
      setIsPreviewDragging(false);
      // Giữ flag interacting thêm 50ms để chặn onClick của Grid
      setTimeout(() => {
        isInteractingRef.current = false;
      }, 50);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interaction]);

  const handleColumnClick = (e, day) => {
    if (isInteractingRef.current || !onGridClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    
    // 00:00 start at post 64px
    const clickedHour = Math.floor((offsetY - 64) / HOUR_HEIGHT);
    // Snap theo 1 phút khi click (64/60 pixels)
    const SNAP_1MIN = 64 / 60;
    const topOffset = Math.max(0, Math.round((offsetY - 64) / SNAP_1MIN) * SNAP_1MIN); 

    onGridClick({ x: e.clientX, y: e.clientY, fullDate: day.fullDate, hour: clickedHour, topOffset, columnRect: rect });
  };

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto bg-white relative scroll-smooth custom-scrollbar grid-interaction-area"
    >
      <div className="flex min-h-max" ref={gridContainerRef}>
        {/* Cột thời gian (Bên trái) */}
        <div className="w-16 flex-shrink-0 flex flex-col bg-white border-r border-slate-200 relative z-10">
          <div className="h-16 flex items-start justify-end pr-3 pt-2">
            <span className="text-[10px] font-medium text-slate-400">GMT+07</span>
          </div>
          {displayHours.map((hour) => (
            <div key={hour} className="h-16 flex items-start justify-end pr-3">
              <span className="text-[11px] font-medium text-slate-400 -mt-2">
                {hour === 0 ? "12 AM" : hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </span>
            </div>
          ))}
        </div>

        {/* Lưới ngày */}
        <div className={`flex-1 grid ${mode === "day" ? "grid-cols-1" : "grid-cols-7"} relative`}>
          <div className="absolute inset-0 pointer-events-none flex flex-col">
            {displayHours.map((hour) => (
              <div key={hour} className="h-16 border-t border-slate-200 w-full" />
            ))}
          </div>
          {displayWeekDays.map((day, idx) => (
            <div
              key={idx}
              data-column-date={day.fullDate?.toDateString()}
              className="border-l border-slate-200 relative h-[1536px] hover:bg-slate-50/50 transition-colors cursor-pointer"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => handleColumnClick(e, day)}
            >
              {/* Lớp phủ chứa vạch đỏ và preview - Tách biệt vùng header (top-16) */}
              <div className="absolute inset-0 top-16 pointer-events-none">
                  {previewEvent?.fullDate &&
                    previewEvent.fullDate.toDateString() === day.fullDate?.toDateString() && (
                    <div
                      onMouseDown={(e) => handleInteractionStart(e, 'move')}
                      onClick={(e) => e.stopPropagation()}
                      className={`preview-tab absolute left-1 right-1 z-30 bg-blue-50 border border-blue-400 rounded-md p-1 shadow-md opacity-95 transition-shadow flex flex-col pointer-events-auto cursor-grab active:cursor-grabbing
                        ${interaction?.type === 'move' ? 'shadow-lg ring-2 ring-blue-500/20' : ''}`}
                      style={{
                        top: `${previewEvent.type === "now" ? nowOffset : previewEvent.top}px`,
                        height: `${previewEvent.height || 64}px`,
                      }}
                    >
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="text-[11px] font-bold text-blue-600 truncate px-1 uppercase tracking-tight">
                          (Đang tạo...)
                        </span>
                      </div>
                      
                      {/* Resize handle at bottom - Increase hit area to h-3 */}
                      <div 
                        onMouseDown={(e) => handleInteractionStart(e, 'resize')}
                        className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize group"
                      >
                         <div className="mx-auto w-8 h-1 bg-blue-200 rounded-full mt-1.5 group-hover:bg-blue-400 transition-colors" />
                      </div>
                    </div>
                  )}

                  {day.isToday && (
                    <div
                      className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                      style={{ top: `${nowOffset - 4}px` }}
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0"></div>
                      <div className="flex-1 h-px bg-red-500"></div>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}