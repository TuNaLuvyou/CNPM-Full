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
    gridContainerRef,
    lang: appSettings.language
  });

  function getEventsForDay(fullDate) {
    if (!fullDate || !events.length) return [];

    const dateStr = formatDateLocal(fullDate);
    return events.filter(ev => {
      // If this event has an optimistic update (after drop), use that date
      const optimistic = optimisticUpdates[String(ev.id)];
      const effectiveDateStr = optimistic?.date
        ? formatDateLocal(optimistic.date)
        : formatDateLocal(new Date(ev.start_time));
      return effectiveDateStr === dateStr;
    });
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto bg-white dark:bg-[#1f1f1f] relative scroll-smooth custom-scrollbar grid-interaction-area"
    >
      <div className="flex min-h-full" ref={gridContainerRef}>
        {/* Cột thời gian */}
        <div className="flex bg-white dark:bg-[#2a2a2a] border-r border-slate-200 dark:border-[#3c3c3c] relative z-10 flex-shrink-0">
          {showSecondary && (
            <div className="w-14 flex flex-col border-r border-slate-100 dark:border-[#3c3c3c] bg-slate-50/30">
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
                <span className="text-[11px] font-semibold text-slate-400 dark:text-[#9e9e9e] -mt-2 leading-none text-right">
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
          <div className="absolute inset-x-0 top-0 h-[1536px] pointer-events-none flex flex-col border-b border-slate-200 dark:border-[#484848]">
            {displayHours.map((hour) => (
              <div key={hour} className="h-16 border-t border-slate-200 dark:border-[#3c3c3c] w-full" />
            ))}
          </div>

          {displayWeekDays.map((day, idx) => {
            const dayEvents = getEventsForDay(day.fullDate);
            const isTargetDay = interaction?.currentDate && formatDateLocal(interaction.currentDate) === formatDateLocal(day.fullDate);

            return (
              <div
                key={idx}
                data-column-date={day.fullDate?.toDateString()}
                className="border-l border-slate-200 dark:border-[#3c3c3c] relative min-h-full hover:bg-slate-50 dark:hover:bg-[#2d2d2d]/50 dark:hover:bg-[#2d2d2d]/60 transition-colors cursor-pointer day-column"
                onMouseDown={(e) => handleInteractionStart(e, 'create')}
                onClick={(e) => handleColumnClick(e, day)}
              >
                <div className="h-[1536px]" />
                <div className="absolute inset-0 top-0 pointer-events-none">
                  {dayEvents.map((ev) => {
                    const isCurrentlyDragging = interaction?.existingEvent && String(interaction.existingEvent.id) === String(ev.id);
                    const { top: originalTop, height: originalHeight } = getEventStyle(ev);
                    
                    const optimistic = optimisticUpdates[String(ev.id)];
                    const top = isCurrentlyDragging ? originalTop : (optimistic?.top ?? originalTop);
                    const height = isCurrentlyDragging ? originalHeight : (optimistic?.height ?? originalHeight);

                    const timeOptions = appSettings.timeFormat === "24h" 
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
                        className={isCurrentlyDragging ? "opacity-40 pointer-events-none grayscale-[0.3]" : "transition-all duration-200"}
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
                        lang={appSettings.language}
                        onToggleComplete={() => callbacksRef.current.onToggleTask?.(ev.id)}
                      />
                    );
                  })}

                  {/* Render GHOST (Tab ảo) di chuyển theo chuột */}
                  {isTargetDay && interaction?.existingEvent && (
                    <EventBlock
                      key={`ghost-${interaction.existingEvent.id}`}
                      {...interaction.existingEvent}
                      time={new Date(interaction.currentDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: appSettings.timeFormat !== "24h" })}
                      top={interaction.currentTop}
                      height={interaction.currentHeight}
                      is_ghost={true}
                      className="shadow-2xl ring-2 ring-blue-500/30 z-50 scale-[1.02]"
                      is_clamped={interaction.isClamped}
                      lang={appSettings.language}
                      onMouseDown={(e) => handleInteractionStart(e, 'move', interaction.existingEvent)}
                      onResizeMouseDown={(e) => handleInteractionStart(e, 'resize', interaction.existingEvent)}
                    />
                  )}

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
                            height: previewEvent.height,
                            columnRect: e.currentTarget.parentElement.getBoundingClientRect()
                          });
                        }}
                        className={`preview-tab absolute left-1 right-1 z-30 bg-blue-50 border-l-4 border-blue-500 rounded-md p-2 shadow-md flex flex-col pointer-events-auto cursor-grab active:cursor-grabbing select-none
                          ${interaction ? 'shadow-lg ring-2 ring-blue-500/20 scale-[1.01]' : 'transition-all duration-200'} ${((interaction && !interaction.existingEvent) ? interaction.currentHeight : (previewEvent.height || 64)) < 35 ? 'justify-center' : ''}`}
                        style={{
                          top: `${(interaction && !interaction.existingEvent) ? interaction.currentTop : (previewEvent.type === "now" ? nowOffset : previewEvent.top)}px`,
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