"use client";
import { useState, useEffect, useRef } from "react";
import { getLocalizedTime, formatDateLocal, getEventStyle, HOUR_HEIGHT, getTimezoneOffsetMinutes, formatTimezoneOffset } from "../../lib/CalendarHelper";
import { t } from "@/lib/i18n";
import EventBlock from "./EventBlock";

import { useTimeGridInteraction } from "./time_grid/useTimeGridInteraction";

function getNowOffset(timezone = "Asia/Ho_Chi_Minh") {
  const now = getLocalizedTime(timezone);
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
  events = [], 
  onEventClick,
  onEventUpdate,
  onInteractionUpdate,
  onToggleTask,
  appSettings = {},
}) {
  const timeFormat = appSettings.timeFormat || "24h";
  const displayHours = hours || Array.from({ length: 24 }, (_, i) => i);
  const showWeekends = appSettings.showWeekends !== false;
  const displayWeekDays = (weekDays || []).filter(day => {
    if (mode === "day") return true;
    if (showWeekends) return true;
    const d = day.fullDate.getDay();
    return d !== 0 && d !== 6;
  });

  const primaryTz = appSettings.primaryTimezone || "Asia/Ho_Chi_Minh";
  const secondaryTz = appSettings.secondaryTimezone || "America/New_York";
  const showSecondary = appSettings.showSecondaryTimezone || false;

  const [nowOffset, setNowOffset] = useState(() => getNowOffset(primaryTz));
  const scrollRef = useRef(null);
  const gridContainerRef = useRef(null);

  const callbacksRef = useRef({
    onInteractionUpdate, onEventUpdate, onInteractionEnd, onGridClick, onEventClick, onToggleTask
  });
  useEffect(() => {
    callbacksRef.current = { onInteractionUpdate, onEventUpdate, onInteractionEnd, onGridClick, onEventClick, onToggleTask };
  }, [onInteractionUpdate, onEventUpdate, onInteractionEnd, onGridClick, onEventClick, onToggleTask]);

  useEffect(() => {
    const id = setInterval(() => setNowOffset(getNowOffset(primaryTz)), 60_000);
    return () => clearInterval(id);
  }, [primaryTz]);

  const {
    interaction,
    optimisticUpdates,
    handleInteractionStart,
    handleColumnClick,
    didMoveRef,
    isInteractingRef
  } = useTimeGridInteraction({
    events,
    mode,
    displayWeekDays,
    nowOffset,
    previewEvent,
    setPreviewEvent,
    setIsPreviewDragging,
    callbacksRef,
    scrollRef,
    gridContainerRef
  });

  function getEventsForDay(fullDate) {
    if (!fullDate || !events.length) {
        if (interaction?.existingEvent && interaction.currentDate?.toDateString() === fullDate?.toDateString()) {
            return [interaction.existingEvent];
        }
        return [];
    }

    const dateStr = formatDateLocal(fullDate);
    let dayEvents = events.filter(ev => {
      if (interaction?.existingEvent?.id === ev.id) return false; 
      const evDate = formatDateLocal(new Date(ev.start_time));
      return evDate === dateStr;
    });

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
        <div className="flex bg-white border-r border-slate-200 relative z-10 flex-shrink-0">
          {showSecondary && (
            <div className="w-14 flex flex-col border-r border-slate-100 bg-slate-50/30">
              {displayHours.map((hour) => {
                const primaryOffset = getTimezoneOffsetMinutes(primaryTz);
                const secondaryOffset = getTimezoneOffsetMinutes(secondaryTz);
                const diffHours = (primaryOffset - secondaryOffset) / 60;
                let secondaryHour = (hour + diffHours) % 24;
                if (secondaryHour < 0) secondaryHour += 24;
                
                return (
                  <div key={hour} className="h-16 flex items-start justify-end pr-2">
                    <span className="text-[10px] font-medium text-slate-300 -mt-2">
                      {hour === 0 
                        ? formatTimezoneOffset(secondaryTz)
                        : (timeFormat === "24h" 
                            ? `${String(Math.floor(secondaryHour)).padStart(2, '0')}:00` 
                            : (secondaryHour === 0 ? "" : secondaryHour === 12 ? "12 PM" : secondaryHour > 12 ? `${Math.floor(secondaryHour - 12)} PM` : `${Math.floor(secondaryHour)} AM`)
                          )
                      }
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="w-16 flex flex-col">
            {displayHours.map((hour) => (
              <div key={hour} className="h-16 flex items-start justify-end pr-3">
                <span className="text-[11px] font-semibold text-slate-400 -mt-2 leading-none text-right">
                  {hour === 0 
                    ? ""
                    : (timeFormat === "24h" 
                        ? `${String(hour).padStart(2, '0')}:00` 
                        : (hour === 0 ? "" : hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`)
                      )
                  }
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Lưới ngày */}
        <div className={`flex-1 grid ${mode === "day" ? "grid-cols-1" : (showWeekends ? "grid-cols-7" : "grid-cols-5")} relative`}>
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
                className="border-l border-slate-200 relative min-h-full hover:bg-slate-50/50 transition-colors cursor-pointer day-column"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => handleColumnClick(e, day)}
              >
                <div className="h-[1536px]" />
                <div className="absolute inset-0 top-0 pointer-events-none">
                  {dayEvents.map((ev) => {
                    const isDragging = interaction?.existingEvent?.id === ev.id;
                    const { top: originalTop, height: originalHeight } = getEventStyle(ev);
                    
                    const optimistic = optimisticUpdates[String(ev.id)];
                    const top = isDragging ? interaction.currentTop : (optimistic?.top ?? originalTop);
                    const height = isDragging ? interaction.currentHeight : (optimistic?.height ?? originalHeight);

                    const timeOptions = timeFormat === "24h" 
                        ? { hour: "2-digit", minute: "2-digit", hour12: false }
                        : { hour: "numeric", minute: "2-digit", hour12: true };
                    
                    const startStr = new Date(ev.start_time).toLocaleTimeString("vi-VN", timeOptions);
                    const endTime = ev.end_time || ev.deadline_time || ev.start_time;
                    const endStr = new Date(endTime).toLocaleTimeString("vi-VN", timeOptions);
                    const timeLabel = `${startStr} - ${endStr}`;

                    return (
                      <EventBlock
                        key={ev.id}
                        {...ev}
                        owner_name={ev.owner_name}
                        owner_email={ev.owner_email}
                        is_owner={ev.is_owner}
                        time={timeLabel}
                        top={top}
                        height={height}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (didMoveRef.current) return; 
                            onEventClick?.(ev, { 
                                clientX: e.clientX, 
                                clientY: e.clientY, 
                                columnRect: e.currentTarget.getBoundingClientRect() 
                            });
                        }}
                        onMouseDown={(e) => handleInteractionStart(e, 'move', ev)}
                        onResizeMouseDown={(e) => {
                          handleInteractionStart(e, 'resize', ev);
                        }}
                        description={ev.description}
                        event_type={ev.event_type}
                        is_completed={ev.is_completed}
                        is_clamped={isDragging && interaction.isClamped}
                        lang={appSettings.language}
                        onToggleComplete={() => callbacksRef.current.onToggleTask?.(ev.id)}
                        className={isDragging ? "shadow-2xl ring-2 ring-blue-500/50 z-50 opacity-90 scale-[1.01]" : "transition-all duration-200"}
                      />
                    );
                  })}

                  {previewEvent?.fullDate &&
                    previewEvent.fullDate.toDateString() === day.fullDate?.toDateString() && (
                      <div
                        onMouseDown={(e) => handleInteractionStart(e, 'move')}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (didMoveRef.current) return;
                          callbacksRef.current.onGridClick?.({
                            x: e.clientX,
                            y: e.clientY,
                            fullDate: previewEvent.fullDate,
                            topOffset: previewEvent.top,
                            columnRect: e.currentTarget.parentElement.getBoundingClientRect()
                          });
                        }}
                        className={`preview-tab absolute left-1 right-1 z-30 bg-blue-50 border-l-4 border-blue-500 rounded-md p-2 shadow-md flex flex-col pointer-events-auto cursor-grab active:cursor-grabbing
                          ${interaction ? 'shadow-lg ring-2 ring-blue-500/20 scale-[1.01]' : 'transition-all duration-200'} ${((interaction && !interaction.existingEvent) ? interaction.currentHeight : (previewEvent.height || 64)) < 35 ? 'justify-center' : ''}`}
                        style={{
                          top: `${previewEvent.type === "now" ? nowOffset : previewEvent.top}px`,
                          height: `${(interaction && !interaction.existingEvent) ? interaction.currentHeight : (previewEvent.height || 64)}px`,
                        }}
                      >
                        {((interaction && !interaction.existingEvent) ? interaction.currentHeight : (previewEvent.height || 64)) > 22 && (
                          <div className="flex justify-between items-start mb-0.5">
                            <span className="text-[11px] font-bold text-blue-700 truncate uppercase tracking-tight">
                              ({t('creating', appSettings.language)})
                            </span>
                          </div>
                        )}
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