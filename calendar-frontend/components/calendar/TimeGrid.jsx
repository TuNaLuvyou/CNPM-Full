"use client";
import { useState, useEffect, useRef } from "react";
import { getVNTime, formatDateLocal, getEventStyle, HOUR_HEIGHT } from "../../lib/CalendarHelper";
import EventBlock from "./EventBlock";

function getNowOffset() {
  const now = getVNTime();
  return (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;
}


/**
 * TimeGrid component
 */

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
  events = [], // Events từ API
  onEventClick,
  onEventUpdate,
  onInteractionUpdate,
}) {
  const displayHours = hours || Array.from({ length: 24 }, (_, i) => i);
  const displayWeekDays = weekDays || [];

  const [nowOffset, setNowOffset] = useState(getNowOffset);
  const scrollRef = useRef(null);
  const gridContainerRef = useRef(null);
  const isInteractingRef = useRef(false);
  const didMoveRef = useRef(false);

  const [interaction, setInteraction] = useState(null);
  const latestPreviewRef = useRef(previewEvent);
  useEffect(() => { latestPreviewRef.current = previewEvent; }, [previewEvent]);

  // Bộ nhớ đệm cho hành động vừa xong (để xử lý click bồi, kéo giãn xong rồi kéo đi ngay)
  const lastResultRef = useRef(null);

  // Refs cho các callback để giữ useEffect dependency ổn định
  const callbacksRef = useRef({
    onInteractionUpdate,
    onEventUpdate,
    onInteractionEnd,
    onGridClick,
    onEventClick
  });
  useEffect(() => {
    callbacksRef.current = { onInteractionUpdate, onEventUpdate, onInteractionEnd, onGridClick, onEventClick };
  }, [onInteractionUpdate, onEventUpdate, onInteractionEnd, onGridClick, onEventClick]);

  useEffect(() => {
    const id = setInterval(() => setNowOffset(getNowOffset()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (previewEvent && scrollRef.current) {
      const top = (previewEvent.type === "now" ? nowOffset : (previewEvent.top || 0)) + 64;
      const scrollEl = scrollRef.current;
      const currentScroll = scrollEl.scrollTop;
      const containerHeight = scrollEl.clientHeight;
      const buffer = 100;
      const isOutOfBounds = top < currentScroll + buffer || top > currentScroll + containerHeight - buffer;
      if (isOutOfBounds || !interaction) {
        const targetScroll = Math.max(0, top - containerHeight / 3);
        scrollEl.scrollTo({ top: targetScroll, behavior: "smooth" });
      }
    }
  }, [previewEvent?.ts, previewEvent?.top, !!interaction, nowOffset]);

  const handleInteractionStart = (e, type, existingEvent = null) => {
    e.stopPropagation();
    e.preventDefault();

    if (!existingEvent && !previewEvent) return;
    isInteractingRef.current = true;
    didMoveRef.current = false; // Reset khi bắt đầu
    const rect = e.currentTarget.getBoundingClientRect();
    const grabOffsetY = e.clientY - rect.top;
    
    // Cache containerRect để tối ưu hiệu năng (giảm rít)
    const containerRect = gridContainerRef.current.getBoundingClientRect();

    // Tìm kiếm bản ghi tươi mới nhất từ props để tránh dùng stale state
    const currentPreview = latestPreviewRef.current;
    let freshEvent = existingEvent ? (events.find(ev => ev.id === existingEvent.id) || existingEvent) : null;
    let baseItem = freshEvent || currentPreview || previewEvent;

    let startTop = freshEvent ? getEventStyle(freshEvent).top : (baseItem.type === 'now' ? nowOffset : (baseItem.top || 0));
    let startHeight = freshEvent ? getEventStyle(freshEvent).height : (baseItem.height || 64);
    let itemDate = freshEvent ? new Date(freshEvent.start_time) : baseItem.fullDate;

    // Ưu tiên dùng bộ nhớ đệm vừa xong nếu ID khớp và thời gian gần đây (< 2s)
    const lr = lastResultRef.current;
    if (lr && (Date.now() - lr.ts < 2000)) {
        const isSameEvent = freshEvent && lr.id === freshEvent.id;
        const isSamePreview = !freshEvent && !lr.id;
        if (isSameEvent || isSamePreview) {
            startTop = lr.topOffset ?? startTop;
            startHeight = lr.height ?? startHeight;
            itemDate = lr.fullDate ?? itemDate;
        }
    }

    // Cache info cho né tránh va chạm
    const currentDayStr = formatDateLocal(itemDate);
    const sortedEvents = events
      .filter(ev => ev.id !== (freshEvent?.id || ''))
      .filter(ev => formatDateLocal(new Date(ev.start_time)) === currentDayStr)
      .sort((a, b) => getEventStyle(a).top - getEventStyle(b).top);

    setInteraction({
      type,
      existingEvent: freshEvent,
      startY: e.clientY,
      startTop,
      startHeight,
      currentTop: startTop,
      currentHeight: startHeight,
      currentDate: itemDate,
      grabOffsetY: type === 'move' ? grabOffsetY : 0,
      containerRect,
      sortedEvents // Cache danh sách đã sắp xếp 
    });
    setIsPreviewDragging(true);
  };

  useEffect(() => {
    if (!interaction) return;

    let rafId;
    const handleMouseMove = (e) => {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        // Rào chắn bảo vệ: Nếu interaction đã bị xóa (null) thì dừng việc tính toán
        if (!interaction || !interaction.containerRect) return;

        const { containerRect, sortedEvents } = interaction;
        const contentTop = containerRect.top + 64;
        const SNAP = 64 / 60;

        if (interaction.type === 'move') {
          const mouseRelY = e.clientY - contentTop;
          const newTopUnsnapped = mouseRelY - interaction.grabOffsetY;
          let newTop = Math.max(0, Math.round(newTopUnsnapped / SNAP) * SNAP);

          if (Math.abs(e.clientY - interaction.startY) > 3) didMoveRef.current = true;

          const columnWidth = (containerRect.width - 64) / (mode === 'day' ? 1 : 7);
          const relativeX = e.clientX - (containerRect.left + 64);
          let dayIdx = 0;
          if (mode === 'week') {
            dayIdx = Math.max(0, Math.min(displayWeekDays.length - 1, Math.floor(relativeX / columnWidth)));
          }

          const targetDate = displayWeekDays[dayIdx]?.fullDate;
          if (targetDate) {
            // Né tránh va chạm dùng danh sách đã cache
            let snappedTop = newTop;
            for (const ev of sortedEvents) {
              const { top: et, height: eh } = getEventStyle(ev);
              const eb = et + eh;
              if (snappedTop < eb && (snappedTop + interaction.currentHeight) > et) {
                if ((snappedTop + interaction.currentHeight / 2) < (et + eh / 2)) {
                  snappedTop = et - interaction.currentHeight;
                } else {
                  snappedTop = eb;
                }
              }
            }
            newTop = Math.max(0, snappedTop);

            // Không cho phép kéo vượt quá 11h59p đêm (Giới hạn lưới là 1536px)
            // Cố định kết thúc tối đa là 11h59p (khoảng 1535px)
            const MAX_GRID_Y = 1535; 
            if (newTop + interaction.currentHeight > MAX_GRID_Y) {
              newTop = MAX_GRID_Y - interaction.currentHeight;
            }

            // Nếu kéo vào vùng sau 11h đêm (1472px), tự động hít về đúng 11h
            if (newTop >= 1472) {
              newTop = 1472;
            }

            const totalMinutes = Math.round((newTop / 64) * 60);
            const updatedDate = new Date(targetDate);
            updatedDate.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);

            // Báo cáo tọa độ thực tế để Modal có thể bám theo (Sticky Modal)
            callbacksRef.current.onInteractionUpdate?.({
              id: interaction.existingEvent?.id,
              top: newTop,
              fullDate: updatedDate,
              height: interaction.currentHeight,
              columnRect: containerRect,
              ts: Date.now()
            });

            if (interaction.existingEvent) {
              if (newTop !== interaction.currentTop || updatedDate.getTime() !== interaction.currentDate?.getTime()) {
                setInteraction(prev => ({ ...prev, currentTop: newTop, currentDate: updatedDate }));
              }
            } else {
              const currentPreview = latestPreviewRef.current;
              if (newTop !== currentPreview?.top || updatedDate.getTime() !== currentPreview?.fullDate?.getTime()) {
                setPreviewEvent(prev => ({ ...prev, top: newTop, fullDate: updatedDate, height: interaction.currentHeight, type: 'grid' }));
              }
            }
          }
        } else if (interaction.type === 'resize') {
          const deltaY = e.clientY - interaction.startY;
          let newHeight = Math.round(Math.max(SNAP, interaction.startHeight + deltaY) / SNAP) * SNAP;
          
          const startTop = interaction.existingEvent ? interaction.startTop : latestPreviewRef.current?.top;
          const MAX_GRID_Y = 1535;
          
          // Chặn không cho kéo giãn vượt quá 11h59p đêm
          if (startTop + newHeight > MAX_GRID_Y) {
            newHeight = MAX_GRID_Y - startTop;
          }

          if (Math.abs(deltaY) > 3) didMoveRef.current = true;
          
          // Báo cáo khi thay đổi kích thước (để Modal cũng lướt theo nút kéo giãn)
          callbacksRef.current.onInteractionUpdate?.({
            id: interaction.existingEvent?.id,
            top: startTop,
            fullDate: interaction.existingEvent ? interaction.currentDate : latestPreviewRef.current?.fullDate,
            height: newHeight,
            columnRect: containerRect,
            ts: Date.now()
          });

          if (interaction.existingEvent) {
            if (newHeight !== interaction.currentHeight) setInteraction(prev => ({ ...prev, currentHeight: newHeight }));
          } else {
            if (newHeight !== latestPreviewRef.current?.height) setPreviewEvent(prev => ({ ...prev, height: newHeight }));
          }
        }
      });
    };


    const handleMouseUp = async (e) => {
      if (!interaction) return;

      const { existingEvent } = interaction;
      const latest = interaction.existingEvent ? {
          fullDate: interaction.currentDate,
          height: interaction.currentHeight
      } : latestPreviewRef.current;

      if (interaction && latest) {
        // Sử dụng didMoveRef để xác định có di chuyển thực tế không
        const hasMoved = didMoveRef.current;

        if (existingEvent) {
          let newDurationMin = Math.round((latest.height / 64) * 60);
          const start = latest.fullDate;
          
          // Nếu sự kiện bắt đầu lúc 11h đêm và kéo dài >= 1 tiếng, fix kết thúc lúc 11h59p (59 phút)
          if (start.getHours() >= 23 && newDurationMin >= 60) {
            newDurationMin = 59;
          }

          // Gọi callback của cha để xử lý cập nhật (bao gồm độ dài mới)
          callbacksRef.current.onEventUpdate?.(existingEvent, start, newDurationMin);
          callbacksRef.current.onInteractionEnd?.({ fullDate: latest.fullDate, isUpdate: true, hasMoved }); 
        } else {
          const targetCol = e.target.closest('.day-column');
          if (targetCol) {
            callbacksRef.current.onInteractionEnd?.({ 
               fullDate: latest.fullDate, 
               topOffset: latest.top, 
               height: latest.height,
               columnRect: targetCol.getBoundingClientRect(),
               hasMoved 
            });
          }
        }

        // Lưu vào bộ nhớ đệm kết quả vừa tương tác (để dùng cho click bồi)
        lastResultRef.current = {
            id: interaction.existingEvent?.id,
            topOffset: interaction.existingEvent ? interaction.currentTop : latest.top,
            height: latest.height,
            fullDate: latest.fullDate,
            ts: Date.now()
        };
      }

      // Trì hoãn việc set null 50ms để tránh race condition (tab bị nháy nhỏ lại khi vừa thả chuột)
      setTimeout(() => {
        setInteraction(null);
        setIsPreviewDragging(false);
        // Chặn click ảo trong 150ms sau khi tương tác xong
        setTimeout(() => { 
            isInteractingRef.current = false; 
            didMoveRef.current = false; 
        }, 150);
      }, 50);

      if (rafId) cancelAnimationFrame(rafId);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interaction, displayWeekDays, mode]);

  const handleColumnClick = (e, day) => {
    if (didMoveRef.current || isInteractingRef.current || !onGridClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const clickedHour = Math.floor((offsetY - 64) / HOUR_HEIGHT);
    const SNAP_1MIN = 64 / 60;
    let topOffset = Math.max(0, Math.round((offsetY - 64) / SNAP_1MIN) * SNAP_1MIN);
    
    // Nếu click vào khung giờ sau 11h đêm (giờ thứ 23), tự động hít về đúng 11h
    if (clickedHour >= 23) {
      topOffset = 23 * 64; // 1472px
    }

    onGridClick({ x: e.clientX, y: e.clientY, fullDate: day.fullDate, hour: clickedHour, topOffset, columnRect: rect });
  };

  function getEventsForDay(fullDate) {
    if (!fullDate || !events.length) {
        // Nếu đang kéo vào ngày trống này, hãy tiêm nó vào
        if (interaction?.existingEvent && interaction.currentDate?.toDateString() === fullDate?.toDateString()) {
            return [interaction.existingEvent];
        }
        return [];
    }

    const dateStr = formatDateLocal(fullDate);
    let dayEvents = events.filter(ev => {
      if (interaction?.existingEvent?.id === ev.id) return false; // Ẩn bản gốc
      const evDate = formatDateLocal(new Date(ev.start_time));
      return evDate === dateStr;
    });

    // Tiêm sự kiện đang kéo vào ngày mục tiêu
    if (interaction?.existingEvent && interaction.currentDate?.toDateString() === fullDate?.toDateString()) {
        dayEvents.push(interaction.existingEvent);
    }

    return dayEvents;
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto bg-white relative scroll-smooth custom-scrollbar grid-interaction-area"
    >
      <div className="flex min-h-full" ref={gridContainerRef}>
        {/* Cột thời gian */}
        <div className="w-16 flex-shrink-0 flex flex-col bg-white border-r border-b border-slate-200 relative z-10">
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
          <div className="absolute inset-x-0 top-0 h-[1536px] pointer-events-none flex flex-col border-b border-slate-200">
            {displayHours.map((hour) => (
              <div key={hour} className="h-16 border-t border-slate-200 w-full" />
            ))}
          </div>

          {displayWeekDays.map((day, idx) => {
            const dayEvents = getEventsForDay(day.fullDate);
            return (
              <div
                key={idx}
                data-column-date={day.fullDate?.toDateString()}
                className="border-l border-slate-200 relative min-h-full hover:bg-slate-50/50 transition-colors cursor-pointer"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => handleColumnClick(e, day)}
              >
                {/* Spacer để đảm bảo cột đủ 24 giờ và kéo dài xuống hết */}
                <div className="h-[1536px]" />
                <div className="absolute inset-0 top-16 pointer-events-none">
                  {/* Events từ API */}
                  {dayEvents.map((ev) => {
                    const isDragging = interaction?.existingEvent?.id === ev.id;
                    const { top: originalTop, height: originalHeight } = getEventStyle(ev);
                    
                    const top = isDragging ? interaction.currentTop : originalTop;
                    const height = isDragging ? interaction.currentHeight : originalHeight;

                    const startLabel = new Date(ev.start_time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                    return (
                      <EventBlock
                        key={ev.id}
                        title={ev.title}
                        time={startLabel}
                        type={ev.color || "blue"}
                        top={top}
                        height={height}
                        location={ev.location}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (didMoveRef.current) return; // Chặn popup nếu vừa kéo xong
                            onEventClick?.(ev, { 
                                clientX: e.clientX, 
                                clientY: e.clientY, 
                                columnRect: e.currentTarget.getBoundingClientRect() 
                            });
                        }}
                        onMouseDown={(e) => handleInteractionStart(e, 'move', ev)}
                        onResizeMouseDown={(e) => handleInteractionStart(e, 'resize', ev)}
                        className={isDragging ? "shadow-2xl ring-2 ring-blue-500/50 z-50 opacity-90 scale-[1.01]" : "transition-all duration-200"}
                      />
                    );
                  })}

                  {/* Preview khi đang tạo */}
                  {previewEvent?.fullDate &&
                    previewEvent.fullDate.toDateString() === day.fullDate?.toDateString() && (
                    <div
                      onMouseDown={(e) => handleInteractionStart(e, 'move')}
                      onClick={(e) => {
                        e.stopPropagation();
                        onGridClick?.({
                          x: e.clientX,
                          y: e.clientY,
                          fullDate: previewEvent.fullDate,
                          topOffset: previewEvent.top,
                          columnRect: e.currentTarget.parentElement.getBoundingClientRect()
                        });
                      }}
                      className={`preview-tab absolute left-1 right-1 z-30 bg-blue-50 border-l-4 border-blue-500 rounded-md p-2 shadow-md flex flex-col pointer-events-auto cursor-grab active:cursor-grabbing
                        ${interaction ? 'shadow-lg ring-2 ring-blue-500/20 scale-[1.01]' : 'transition-all duration-200'}`}
                      style={{
                        top: `${previewEvent.type === "now" ? nowOffset : previewEvent.top}px`,
                        height: `${(interaction && !interaction.existingEvent) ? interaction.currentHeight : (previewEvent.height || 64)}px`,
                      }}
                    >
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="text-[11px] font-bold text-blue-700 truncate uppercase tracking-tight">
                          (Đang tạo...)
                        </span>
                      </div>
                      <div
                        onMouseDown={(e) => handleInteractionStart(e, 'resize')}
                        className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize group"
                      >
                        <div className="mx-auto w-8 h-1 bg-blue-200 rounded-full mt-1.5 group-hover:bg-blue-400 transition-colors" />
                      </div>
                    </div>
                  )}

                  {/* Vạch thời gian hiện tại */}
                  {day.isToday && (
                    <div
                      id="current-time-line"
                      className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                      style={{ top: `${nowOffset - 4}px` }}
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0"></div>
                      <div className="flex-1 h-px bg-red-500"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}