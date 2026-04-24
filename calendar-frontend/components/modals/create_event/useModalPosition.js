import { useState, useEffect } from 'react';

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
  activeTab
}) {
  const [isPositioned, setIsPositioned] = useState(false);
  const [modalStyle, setModalStyle] = useState({ opacity: 0, transition: 'none' });

  useEffect(() => {
    if (!isOpen) {
      setIsPositioned(false);
      setModalStyle({ opacity: 0, transition: 'none' });
      return;
    }
    
    // Nếu đang có tương tác kéo thả và IDs khớp, ưu tiên dùng tọa độ tương tác
    const isSticky = interactionState && (
      (editingItem && interactionState.id === editingItem.id) || 
      (!editingItem && !interactionState.id) // Kéo tạo mới
    );

    const calculatePosition = () => {
      if (!modalRef.current) return;
      const rect = modalRef.current.getBoundingClientRect();
      const modalWidth = rect.width || 512;
      const modalHeight = rect.height || 450;
      let top, left;

      // 1. Pivot point determination
      const pivotX = position?.x;
      const pivotY = position?.y;

      // 2. Identify the avoidance area (the event or the column)
      let avoidRect = position?.columnRect;
      
      // Nếu không có columnRect nhưng có anchor (đang kéo hoặc preview), thử tìm column element
      const anchor = isSticky ? interactionState : previewEvent;
      if (!avoidRect && anchor && ["week", "work_week", "day"].includes(view)) {
        const targetDateStr = anchor.fullDate?.toDateString();
        const colEl = document.querySelector(`[data-column-date="${targetDateStr}"]`);
        if (colEl) avoidRect = colEl.getBoundingClientRect();
      }

      // 3. Calculate Vertical Position (Top)
      if (pivotY !== undefined) {
        // Ưu tiên đặt modal căn giữa theo chiều dọc so với điểm click
        top = pivotY - modalHeight / 3;
      } else if (anchor && avoidRect && ["week", "work_week", "day"].includes(view)) {
        // Fallback dùng tọa độ lưới nếu không có pivotY
        // Nếu avoidRect là day-column (cao), ta dùng anchor.top để định vị
        const isTallColumn = avoidRect.height > 500;
        const relativeTop = isTallColumn ? anchor.top + 64 : 0;
        top = avoidRect.top + relativeTop - 40;
      }

      // 4. Calculate Horizontal Position (Left)
      if (view === "day" && avoidRect) {
        // Trong chế độ Ngày, căn giữa modal theo cột ngày
        left = avoidRect.left + (avoidRect.width / 2) - (modalWidth / 2);
      } else if (avoidRect) {
        const spaceRight = window.innerWidth - avoidRect.right;
        const spaceLeft = avoidRect.left;

        if (spaceRight > modalWidth + 30) {
          // Đặt bên phải nếu đủ chỗ (ưu tiên)
          left = avoidRect.right + 15;
        } else if (spaceLeft > modalWidth + 30) {
          // Đặt bên trái nếu đủ chỗ
          left = avoidRect.left - modalWidth - 15;
        } else {
          // Nếu cả 2 bên đều chật, căn giữa màn hình hoặc né sang bên có nhiều chỗ hơn
          left = spaceRight > spaceLeft ? avoidRect.right + 10 : avoidRect.left - modalWidth - 10;
        }
      } else if (pivotX !== undefined) {
        const spaceRight = window.innerWidth - pivotX;
        left = spaceRight > modalWidth + 60 ? pivotX + 40 : pivotX - modalWidth - 40;
      }

      // Default fallback
      if (top === undefined || left === undefined) {
        top = window.innerHeight / 2 - modalHeight / 2;
        left = window.innerWidth / 2 - modalWidth / 2;
      }

      // 5. Screen boundary constraints (Safety)
      const finalTop = Math.max(20, Math.min(top + dragOffset.y, window.innerHeight - modalHeight - 20));
      const finalLeft = Math.max(10, Math.min(left + dragOffset.x, window.innerWidth - modalWidth - 10));

      // 6. Apply styles
      const useTransition = (isSticky || isPositioned) && !isDragging;

      setModalStyle({ 
        top: finalTop, 
        left: finalLeft, 
        opacity: 1,
        transition: useTransition ? 'top 0.15s cubic-bezier(0.165, 0.84, 0.44, 1), left 0.15s cubic-bezier(0.165, 0.84, 0.44, 1)' : 'none'
      });
      setIsPositioned(true);
    };

    const raf = requestAnimationFrame(calculatePosition);
    window.addEventListener("resize", () => { setIsPositioned(false); });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", () => { setIsPositioned(false); }); };
  }, [isOpen, isPositioned, activeTab, position?.ts, view, interactionState, previewEvent, dragOffset, isDragging]);

  return modalStyle;
}
