import { useState, useEffect, useRef } from "react";
import { getEventStyle, formatDateLocal } from "@/lib/CalendarHelper";
import { t } from "@/lib/i18n";

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
  gridContainerRef,
  lang = 'vi'
}) {
  const isInteractingRef = useRef(false);
  const didMoveRef = useRef(false);
  const [interaction, setInteraction] = useState(null);
  // optimisticUpdates: { [id]: { top, height, date } }
  const [optimisticUpdates, setOptimisticUpdates] = useState({});

  const latestPreviewRef = useRef(previewEvent);
  useEffect(() => { latestPreviewRef.current = previewEvent; }, [previewEvent]);

  const lastResultRef = useRef(null);
  const eventsRef = useRef(events);
  useEffect(() => { eventsRef.current = events; }, [events]);

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
          const optimistic = next[id];
          // Xét cả top/height lẫn ngày — chỉ xóa khi server đã đồng bộ xong
          const dateMatches = optimistic.date
            ? formatDateLocal(new Date(ev.start_time)) === formatDateLocal(optimistic.date)
            : true;
          if (Math.abs(top - optimistic.top) < 2 && Math.abs(height - optimistic.height) < 2 && dateMatches) {
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
    let freshEvent = existingEvent ? (eventsRef.current?.find(ev => String(ev.id) === String(existingEvent.id)) || existingEvent) : null;
    let baseItem = freshEvent || currentPreview || previewEvent;

    const SNAP_1MIN = 64 / 60;
    const clickTop = Math.max(0, Math.round(grabOffsetY / SNAP_1MIN) * SNAP_1MIN);

    let startTop = freshEvent 
      ? getEventStyle(freshEvent).top 
      : (baseItem 
          ? (baseItem.type === 'now' ? nowOffset : (baseItem.top || 0)) 
          : clickTop);
    let startHeight = freshEvent ? getEventStyle(freshEvent).height : (baseItem?.height || 64);
    const targetCol = e.currentTarget.closest('.day-column');
    const colDateStr = targetCol?.dataset.columnDate;
    const colDate = colDateStr ? new Date(colDateStr) : (displayWeekDays[0]?.fullDate || new Date());

    let itemDate = freshEvent ? new Date(freshEvent.start_time) : (baseItem?.fullDate || colDate);

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
      grabOffsetY: (type === 'move' || type === 'create') ? grabOffsetY : 0,
      containerRect,
      sortedEvents
    });

    if (type === 'create') {
      setPreviewEvent({
        id: 'preview',
        title: `(${t('creating', lang)}...)`,
        top: startTop,
        height: 64,
        type: 'event',
        fullDate: itemDate,
        ts: Date.now()
      });
    }

    setIsPreviewDragging?.(true);
  };

  const interactionRef = useRef(null);
  useEffect(() => { interactionRef.current = interaction; }, [interaction]);

  const isDragging = !!interaction;
  useEffect(() => {
    if (!isDragging) return;

    let rafId;
    const handleMouseMove = (e) => {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        const currInteraction = interactionRef.current;
        if (!currInteraction || !currInteraction.containerRect) return;

        const { containerRect } = currInteraction;
        const contentTop = containerRect.top;
        const SNAP = 64 / 60;

        if (currInteraction.type === 'move') {
          if (currInteraction.existingEvent && currInteraction.existingEvent.my_permission === 'view') return;

          const mouseRelY = e.clientY - contentTop;
          const newTopUnsnapped = mouseRelY - currInteraction.grabOffsetY;
          let newTop = Math.max(0, Math.round(newTopUnsnapped / SNAP) * SNAP);

          didMoveRef.current = true;

          const columnWidth = (containerRect.width - 64) / (mode === 'day' ? 1 : 7);
          const relativeX = e.clientX - (containerRect.left + 64);
          let dayIdx = 0;
          if (mode === 'week') {
            dayIdx = Math.max(0, Math.min(displayWeekDays.length - 1, Math.floor(relativeX / columnWidth)));
          }

          if (currInteraction.existingEvent?.event_type === 'task' && currInteraction.existingEvent.deadline) {
            const deadlineDate = new Date(currInteraction.existingEvent.deadline);
            const deadlineDateOnly = new Date(deadlineDate);
            deadlineDateOnly.setHours(0, 0, 0, 0);

            const deadlineIdx = displayWeekDays.findIndex(d => {
              const dOnly = new Date(d.fullDate);
              dOnly.setHours(0, 0, 0, 0);
              return dOnly.getTime() === deadlineDateOnly.getTime();
            });

            if (deadlineIdx !== -1 && dayIdx > deadlineIdx) {
              dayIdx = deadlineIdx;
            }
          }

          let targetDate = displayWeekDays[dayIdx]?.fullDate;
          if (targetDate) {
            const targetDayStr = targetDate.toDateString();
            const dayEvents = eventsRef.current.filter(e =>
              new Date(e.start_time).toDateString() === targetDayStr &&
              e.id !== currInteraction.existingEvent?.id
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

                if (snappedTop < eb && (snappedTop + currInteraction.currentHeight) > et) {
                  collisionFound = true;
                  if ((snappedTop + currInteraction.currentHeight / 2) < (et + eh / 2)) {
                    snappedTop = et - currInteraction.currentHeight - buffer;
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
            if (currInteraction.existingEvent?.event_type === 'task' && currInteraction.existingEvent.deadline) {
              const deadlineDate = new Date(currInteraction.existingEvent.deadline);
              const targetDateOnly = new Date(targetDate);
              targetDateOnly.setHours(0, 0, 0, 0);
              const deadlineDateOnly = new Date(deadlineDate);
              deadlineDateOnly.setHours(0, 0, 0, 0);

              if (targetDateOnly.getTime() === deadlineDateOnly.getTime()) {
                const deadlineMinutes = deadlineDate.getHours() * 60 + deadlineDate.getMinutes();
                const deadlineY = (deadlineMinutes / 60) * 64;
                if (newTop + currInteraction.currentHeight > deadlineY) {
                  newTop = Math.max(0, deadlineY - currInteraction.currentHeight);
                  isClamped = true;
                }
              } else if (targetDateOnly.getTime() > deadlineDateOnly.getTime()) {
                newTop = 0;
                isClamped = true;
              }
            }

            if (newTop + currInteraction.currentHeight > MAX_GRID_Y) {
              newTop = MAX_GRID_Y - currInteraction.currentHeight;
            }

            const totalMinutes = Math.round((newTop / 64) * 60);
            const updatedDate = new Date(targetDate);
            updatedDate.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);

            callbacksRef.current.onInteractionUpdate?.({
              id: currInteraction.existingEvent?.id,
              top: newTop,
              fullDate: updatedDate,
              height: currInteraction.currentHeight,
              columnRect: containerRect,
              ts: Date.now()
            });

            const isPreviewMove = !currInteraction.existingEvent && (currInteraction.type === 'move' || currInteraction.type === 'create');
            if (currInteraction.existingEvent || isPreviewMove) {
              if (newTop !== currInteraction.currentTop || updatedDate.getTime() !== currInteraction.currentDate?.getTime() || isClamped !== currInteraction.isClamped) {
                const next = { ...currInteraction, currentTop: newTop, currentDate: updatedDate, isClamped };
                interactionRef.current = next;
                setInteraction(next);

                if (isPreviewMove) {
                  setPreviewEvent(prev => ({
                    ...prev,
                    top: newTop,
                    fullDate: updatedDate,
                    ts: Date.now()
                  }));
                }
              }
            }
          }
        } else if (currInteraction.type === 'resize') {
          if (currInteraction.existingEvent && currInteraction.existingEvent.my_permission === 'view') return;

          const deltaY = e.clientY - currInteraction.startY;
          let newHeight = Math.round(Math.max(SNAP, currInteraction.startHeight + deltaY) / SNAP) * SNAP;

          const startTop = currInteraction.existingEvent ? currInteraction.startTop : latestPreviewRef.current?.top;
          const MAX_GRID_Y = 1536;

          let isClamped = false;
          if (currInteraction.existingEvent?.event_type === 'task' && currInteraction.existingEvent.deadline) {
            const deadlineDate = new Date(currInteraction.existingEvent.deadline);
            const startDayDate = new Date(currInteraction.existingEvent.start_time);
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
          }

          if (startTop + newHeight > MAX_GRID_Y) {
            newHeight = MAX_GRID_Y - startTop;
          }

          didMoveRef.current = true;

          callbacksRef.current.onInteractionUpdate?.({
            id: currInteraction.existingEvent?.id,
            top: startTop,
            fullDate: currInteraction.existingEvent ? currInteraction.currentDate : latestPreviewRef.current?.fullDate,
            height: newHeight,
            columnRect: containerRect,
            ts: Date.now()
          });

          const isPreviewResize = !currInteraction.existingEvent && (currInteraction.type === 'resize');
          if (currInteraction.existingEvent || isPreviewResize) {
            if (newHeight !== currInteraction.currentHeight || isClamped !== currInteraction.isClamped) {
              const next = { ...currInteraction, currentHeight: newHeight, isClamped };
              interactionRef.current = next;
              setInteraction(next);

              if (isPreviewResize) {
                setPreviewEvent(prev => ({
                  ...prev,
                  height: newHeight,
                  ts: Date.now()
                }));
              }
            }
          }
        }
      });
    };

    const handleMouseUp = async (e) => {
      const currInteraction = interactionRef.current;
      if (!currInteraction) return;

      const { existingEvent } = currInteraction;
      const isPreview = !currInteraction.existingEvent && (currInteraction.type === 'move' || currInteraction.type === 'create' || currInteraction.type === 'resize');
      const latest = (currInteraction.existingEvent || isPreview) ? {
        fullDate: currInteraction.currentDate,
        height: currInteraction.currentHeight,
        top: currInteraction.currentTop
      } : latestPreviewRef.current;

      if (currInteraction && latest) {
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
              top: currInteraction.currentTop,
              height: currInteraction.currentHeight,
              date: latest.fullDate,  // lưu ngày mới để render đúng ngày sau khi thả
            }
          }));

          if (!hasMoved) {
            callbacksRef.current.onEventClick?.(existingEvent, {
              clientX: e.clientX,
              clientY: e.clientY,
              columnRect: currInteraction.containerRect
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
          id: currInteraction.existingEvent?.id,
          topOffset: currInteraction.existingEvent ? currInteraction.currentTop : latest.top,
          height: latest.height,
          fullDate: latest.fullDate,
          ts: Date.now()
        };
      }

      setTimeout(() => {
        setInteraction(null);
        interactionRef.current = null;
        setIsPreviewDragging?.(false);
      }, 50);

      setTimeout(() => {
        isInteractingRef.current = false;
        didMoveRef.current = false;
      }, 200);

      if (rafId) cancelAnimationFrame(rafId);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, displayWeekDays, mode]);

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
