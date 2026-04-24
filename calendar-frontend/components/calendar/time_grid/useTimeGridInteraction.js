import { useState, useEffect, useRef } from "react";
import { getEventStyle, formatDateLocal } from "@/lib/CalendarHelper";

export function useTimeGridInteraction({
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
}) {
  const isInteractingRef = useRef(false);
  const didMoveRef = useRef(false);
  const [interaction, setInteraction] = useState(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState({});
  
  const latestPreviewRef = useRef(previewEvent);
  useEffect(() => { latestPreviewRef.current = previewEvent; }, [previewEvent]);

  const lastResultRef = useRef(null);

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

  useEffect(() => {
    if (!Object.keys(optimisticUpdates).length) return;
    setOptimisticUpdates(prev => {
      const next = { ...prev };
      let changed = false;
      for (const id of Object.keys(next)) {
        const ev = events.find(e => String(e.id) === String(id));
        if (ev) {
          const { top, height } = getEventStyle(ev);
          if (Math.abs(top - next[id].top) < 2 && Math.abs(height - next[id].height) < 2) {
            delete next[id];
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [events]);

  const handleInteractionStart = (e, type, existingEvent = null) => {
    e.stopPropagation();

    isInteractingRef.current = true;
    didMoveRef.current = false;
    const rect = e.currentTarget.getBoundingClientRect();
    const grabOffsetY = e.clientY - rect.top;
    
    const containerRect = gridContainerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const currentPreview = latestPreviewRef.current;
    let freshEvent = existingEvent ? (events.find(ev => ev.id === existingEvent.id) || existingEvent) : null;
    let baseItem = freshEvent || currentPreview || previewEvent;

    let startTop = freshEvent ? getEventStyle(freshEvent).top : (baseItem.type === 'now' ? nowOffset : (baseItem.top || 0));
    let startHeight = freshEvent ? getEventStyle(freshEvent).height : (baseItem.height || 64);
    let itemDate = freshEvent ? new Date(freshEvent.start_time) : baseItem.fullDate;

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

    const currentDayStr = formatDateLocal(itemDate);
    const sortedEvents = events
      .filter(ev => ev.id !== (freshEvent?.id || ''))
      .filter(ev => formatDateLocal(new Date(ev.start_time)) === currentDayStr)
      .sort((a, b) => getEventStyle(a).top - getEventStyle(b).top);

    setInteraction({
      type,
      existingEvent: freshEvent,
      startY: e.clientY,
      startX: e.clientX,
      startTop,
      startHeight,
      currentTop: startTop,
      currentHeight: startHeight,
      currentDate: itemDate,
      grabOffsetY: type === 'move' ? grabOffsetY : 0,
      containerRect,
      sortedEvents
    });
    setIsPreviewDragging?.(true);
  };

  useEffect(() => {
    if (!interaction) return;

    let rafId;
    const handleMouseMove = (e) => {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        if (!interaction || !interaction.containerRect) return;

        const { containerRect } = interaction;
        const contentTop = containerRect.top;
        const SNAP = 64 / 60;

        if (interaction.type === 'move') {
          if (interaction.existingEvent && interaction.existingEvent.my_permission === 'view') return;

          const mouseRelY = e.clientY - contentTop;
          const newTopUnsnapped = mouseRelY - interaction.grabOffsetY;
          let newTop = Math.max(0, Math.round(newTopUnsnapped / SNAP) * SNAP);

          if (Math.abs(e.clientY - interaction.startY) > 10 || Math.abs(e.clientX - interaction.startX) > 10) didMoveRef.current = true;

          const columnWidth = (containerRect.width - 64) / (mode === 'day' ? 1 : 7);
          const relativeX = e.clientX - (containerRect.left + 64);
          let dayIdx = 0;
          if (mode === 'week') {
            dayIdx = Math.max(0, Math.min(displayWeekDays.length - 1, Math.floor(relativeX / columnWidth)));
          }

          if (interaction.existingEvent?.event_type === 'task' && interaction.existingEvent.deadline) {
            const deadlineDate = new Date(interaction.existingEvent.deadline);
            const deadlineDateOnly = new Date(deadlineDate);
            deadlineDateOnly.setHours(0, 0, 0, 0);

            const deadlineIdx = displayWeekDays.findIndex(d => {
               const dOnly = new Date(d.fullDate);
               dOnly.setHours(0,0,0,0);
               return dOnly.getTime() === deadlineDateOnly.getTime();
            });

            if (deadlineIdx !== -1 && dayIdx > deadlineIdx) {
              dayIdx = deadlineIdx;
            }
          }

          let targetDate = displayWeekDays[dayIdx]?.fullDate;
          if (targetDate) {
            const targetDayStr = targetDate.toDateString();
            const dayEvents = events.filter(e => 
              new Date(e.start_time).toDateString() === targetDayStr && 
              e.id !== interaction.existingEvent?.id
            );

            let snappedTop = newTop;
            let collisionFound = true;
            let safetyCounter = 0;

            while (collisionFound && safetyCounter < 10) {
              collisionFound = false;
              for (const ev of dayEvents) {
                const { top: et, height: eh } = getEventStyle(ev);
                const eb = et + eh;
                const buffer = 1; 
                
                if (snappedTop < eb && (snappedTop + interaction.currentHeight) > et) {
                  collisionFound = true;
                  if ((snappedTop + interaction.currentHeight / 2) < (et + eh / 2)) {
                    snappedTop = et - interaction.currentHeight - buffer;
                  } else {
                    snappedTop = eb + buffer;
                  }
                  break; 
                }
              }
              safetyCounter++;
            }
            
            newTop = Math.max(0, snappedTop);
            const MAX_GRID_Y = 1536; 
            
            let isClamped = false;
            if (interaction.existingEvent?.event_type === 'task' && interaction.existingEvent.deadline) {
              const deadlineDate = new Date(interaction.existingEvent.deadline);
              const targetDateOnly = new Date(targetDate);
              targetDateOnly.setHours(0, 0, 0, 0);
              const deadlineDateOnly = new Date(deadlineDate);
              deadlineDateOnly.setHours(0, 0, 0, 0);

              if (targetDateOnly.getTime() === deadlineDateOnly.getTime()) {
                const deadlineMinutes = deadlineDate.getHours() * 60 + deadlineDate.getMinutes();
                const deadlineY = (deadlineMinutes / 60) * 64;
                if (newTop + interaction.currentHeight > deadlineY) {
                    newTop = Math.max(0, deadlineY - interaction.currentHeight);
                    isClamped = true;
                }
              } else if (targetDateOnly.getTime() > deadlineDateOnly.getTime()) {
                  newTop = 0;
                  isClamped = true;
              }
              interaction.isClamped = isClamped;
            }

            if (newTop + interaction.currentHeight > MAX_GRID_Y) {
              newTop = MAX_GRID_Y - interaction.currentHeight;
            }

            const totalMinutes = Math.round((newTop / 64) * 60);
            const updatedDate = new Date(targetDate);
            updatedDate.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);

            callbacksRef.current.onInteractionUpdate?.({
              id: interaction.existingEvent?.id,
              top: newTop,
              fullDate: updatedDate,
              height: interaction.currentHeight,
              columnRect: containerRect,
              ts: Date.now()
            });

            if (interaction.existingEvent) {
              if (newTop !== interaction.currentTop || updatedDate.getTime() !== interaction.currentDate?.getTime() || isClamped !== interaction.isClamped) {
                setInteraction(prev => ({ ...prev, currentTop: newTop, currentDate: updatedDate, isClamped }));
              }
            } else {
              const currentPreview = latestPreviewRef.current;
              if (newTop !== currentPreview?.top || updatedDate.getTime() !== currentPreview?.fullDate?.getTime()) {
                setPreviewEvent?.(prev => ({ ...prev, top: newTop, fullDate: updatedDate, height: interaction.currentHeight, type: 'grid' }));
              }
            }
          }
        } else if (interaction.type === 'resize') {
          if (interaction.existingEvent && interaction.existingEvent.my_permission === 'view') return;

          const deltaY = e.clientY - interaction.startY;
          let newHeight = Math.round(Math.max(SNAP, interaction.startHeight + deltaY) / SNAP) * SNAP;
          
          const startTop = interaction.existingEvent ? interaction.startTop : latestPreviewRef.current?.top;
          const MAX_GRID_Y = 1536;
          
          let isClamped = false;
          if (interaction.existingEvent?.event_type === 'task' && interaction.existingEvent.deadline) {
            const deadlineDate = new Date(interaction.existingEvent.deadline);
            const startDayDate = new Date(interaction.existingEvent.start_time);
            startDayDate.setHours(0, 0, 0, 0);
            const deadlineDayDate = new Date(deadlineDate);
            deadlineDayDate.setHours(0, 0, 0, 0);

            if (startDayDate.getTime() === deadlineDayDate.getTime()) {
              const dlMin = deadlineDate.getHours() * 60 + deadlineDate.getMinutes();
              const dlY = (dlMin / 60) * 64;
              if (startTop + newHeight > dlY) {
                newHeight = dlY - startTop;
                isClamped = true;
              }
            }
            interaction.isClamped = isClamped;
          }

          if (startTop + newHeight > MAX_GRID_Y) {
            newHeight = MAX_GRID_Y - startTop;
          }

          if (Math.abs(deltaY) > 3) didMoveRef.current = true;
          
          callbacksRef.current.onInteractionUpdate?.({
            id: interaction.existingEvent?.id,
            top: startTop,
            fullDate: interaction.existingEvent ? interaction.currentDate : latestPreviewRef.current?.fullDate,
            height: newHeight,
            columnRect: containerRect,
            ts: Date.now()
          });

          if (interaction.existingEvent) {
            if (newHeight !== interaction.currentHeight || isClamped !== interaction.isClamped) {
              setInteraction(prev => ({ ...prev, currentHeight: newHeight, isClamped }));
            }
          } else {
            if (newHeight !== interaction.currentHeight) {
                setInteraction(prev => ({ ...prev, currentHeight: newHeight }));
            }
            if (newHeight !== latestPreviewRef.current?.height) {
                setPreviewEvent?.(prev => ({ ...prev, height: newHeight }));
            }
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
        const hasMoved = didMoveRef.current;

        if (existingEvent) {
          let newDurationMin = Math.round((latest.height / 64) * 60);
          const start = latest.fullDate;
          
          if (start.getHours() === 23 && start.getMinutes() + newDurationMin > 60) {
            newDurationMin = 60 - start.getMinutes();
          }

          setOptimisticUpdates(prev => ({
            ...prev,
            [String(existingEvent.id)]: {
              top: interaction.currentTop,
              height: interaction.currentHeight,
            }
          }));

          if (!hasMoved) {
            callbacksRef.current.onEventClick?.(existingEvent, {
                clientX: e.clientX,
                clientY: e.clientY,
                columnRect: interaction.containerRect
            });
          } else {
            callbacksRef.current.onEventUpdate?.(existingEvent, start, newDurationMin);
          }
          callbacksRef.current.onInteractionEnd?.({ fullDate: latest.fullDate, isUpdate: true, hasMoved }); 
        } else {
          const targetCol = e.target.closest('.day-column') || e.target.closest('[data-column-date]');
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

        lastResultRef.current = {
            id: interaction.existingEvent?.id,
            topOffset: interaction.existingEvent ? interaction.currentTop : latest.top,
            height: latest.height,
            fullDate: latest.fullDate,
            ts: Date.now()
        };
      }

      setTimeout(() => {
        setInteraction(null);
        setIsPreviewDragging?.(false);
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
    if (didMoveRef.current || isInteractingRef.current || !callbacksRef.current.onGridClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const SNAP_1MIN = 64 / 60;
    let topOffset = Math.max(0, Math.round(offsetY / SNAP_1MIN) * SNAP_1MIN);
    
    if (topOffset > 1536 - 30) { 
      topOffset = 1536 - 30;
    }

    const clickedHour = Math.floor(topOffset / 64);
    callbacksRef.current.onGridClick({ x: e.clientX, y: e.clientY, fullDate: day.fullDate, hour: clickedHour, topOffset, columnRect: rect });
  };

  return {
    interaction,
    optimisticUpdates,
    handleInteractionStart,
    handleColumnClick,
    didMoveRef,
    isInteractingRef,
  };
}
