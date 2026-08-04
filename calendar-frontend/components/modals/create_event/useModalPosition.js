import { useState, useEffect, useRef } from 'react';

export function useModalPosition({
  isOpen,
  modalRef,
  position,
  view,
  interactionState,
  previewEvent,
  editingItem,
  dragOffset,
  isDragging,
  activeTab,
}) {
  const [isPositioned, setIsPositioned] = useState(false);
  const [modalStyle, setModalStyle] = useState({ opacity: 0, transition: 'none' });

  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (prevOpen !== isOpen) {
    setPrevOpen(isOpen);
    if (!isOpen) {
      setIsPositioned(false);
      setModalStyle({ opacity: 0, transition: 'none' });
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    const isSticky = interactionState && (
      (editingItem && interactionState.id === editingItem.id) ||
      (!editingItem && !interactionState.id)
    );

    const anchor = isSticky ? interactionState : previewEvent;

    const calculatePosition = () => {
      if (!modalRef.current) return;
      const rect = modalRef.current.getBoundingClientRect();
      const modalWidth = rect.width || 512;
      const modalHeight = rect.height || 450;

      const margin = 24;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let top, left;

      const pivotX = position?.x;
      const pivotY = position?.y;

      let avoidRect = position?.columnRect;
      let colIndex = 0;
      let dayColumnRect = null;

      if (["week", "work_week", "day"].includes(view)) {
        const itemDateStr = anchor?.fullDate?.toDateString() || (editingItem ? new Date(editingItem.start_time).toDateString() : null);
        if (itemDateStr) {
          const colEl = document.querySelector(`[data-column-date="${itemDateStr}"]`);
          if (colEl) {
            dayColumnRect = colEl.getBoundingClientRect();
            if (!avoidRect) avoidRect = dayColumnRect;
            const siblings = Array.from(colEl.parentElement.querySelectorAll('.day-column'));
            colIndex = siblings.indexOf(colEl);
          }
        }
      }

      if (dayColumnRect && ["week", "work_week", "day"].includes(view)) {
        let relativeTop = 0;
        if (anchor) {
          relativeTop = anchor.top || 0;
        } else if (editingItem) {
          const d = new Date(editingItem.start_time);
          relativeTop = (d.getHours() * 60 + d.getMinutes()) * (64 / 60);
        }
        top = dayColumnRect.top + relativeTop;
      } else if (pivotY !== undefined) {
        top = pivotY - modalHeight / 3;
      }

      if (avoidRect && ["week", "work_week", "day"].includes(view)) {
        if (view === "day" || colIndex < 3) {
          left = avoidRect.right + 15;
        } else {
          left = avoidRect.left - modalWidth - 15;
        }
      } else if (pivotX !== undefined) {
        const spaceRight = vw - pivotX;
        left = spaceRight > modalWidth + 60 ? pivotX + 40 : pivotX - modalWidth - 40;
      }

      const isManuallyDragged = dragOffset.x !== 0 || dragOffset.y !== 0;

      if (isManuallyDragged) {
        top = dragOffset.y;
        left = dragOffset.x;
      } else {
        if (top === undefined || left === undefined) {
          top = vh / 2 - modalHeight / 2;
          left = vw / 2 - modalWidth / 2;
        }
      }

      let finalTop, finalLeft;
      if (dragOffset.x !== 0 || dragOffset.y !== 0 || isDragging) {
        finalTop = Math.max(0, Math.min(top, vh - 40));
        finalLeft = Math.max(-modalWidth + 40, Math.min(left, vw - 40));
      } else {
        finalTop = Math.max(margin, Math.min(top, Math.max(margin, vh - modalHeight - margin)));
        finalLeft = Math.max(margin, Math.min(left, Math.max(margin, vw - modalWidth - margin)));
      }

      const useTransition = (isSticky || isPositioned) && !isDragging;

      setModalStyle({
        top: finalTop,
        left: finalLeft,
        opacity: 1,
        transition: useTransition ? 'top 0.2s ease, left 0.2s ease' : 'none',
      });
      setIsPositioned(true);
    };

    const raf = requestAnimationFrame(calculatePosition);

    let ro = null;
    if (modalRef.current) {
      ro = new ResizeObserver(calculatePosition);
      ro.observe(modalRef.current);
    }
    window.addEventListener("resize", calculatePosition);

    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      window.removeEventListener("resize", calculatePosition);
    };
  }, [isOpen, isPositioned, activeTab, position?.ts, view, interactionState, previewEvent, dragOffset, isDragging]);

  return modalStyle;
}