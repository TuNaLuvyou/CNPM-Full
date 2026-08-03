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

    // Nếu đang có tương tác kéo thả và IDs khớp, ưu tiên dùng tọa độ tương tác
    const isSticky = interactionState && (
      (editingItem && interactionState.id === editingItem.id) ||
      (!editingItem && !interactionState.id) // Kéo tạo mới
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

      // 1. Điểm pivot (vị trí click / cuối thao tác kéo thả)
      const pivotX = position?.x;
      const pivotY = position?.y;

      // 2. Vùng cần né (cột ngày chứa tab đang tạo / thẻ đang sửa)
      let avoidRect = position?.columnRect;
      let colIndex = 0; // 0 to 6
      let dayColumnRect = null;
      
      if (["week", "work_week", "day"].includes(view)) {
        const itemDateStr = anchor?.fullDate?.toDateString() || (editingItem ? new Date(editingItem.start_time).toDateString() : null);
        if (itemDateStr) {
          const colEl = document.querySelector(`[data-column-date="${itemDateStr}"]`);
          if (colEl) {
            dayColumnRect = colEl.getBoundingClientRect();
            if (!avoidRect) avoidRect = dayColumnRect;
            
            // Determine column index among its siblings
            const siblings = Array.from(colEl.parentElement.querySelectorAll('.day-column'));
            colIndex = siblings.indexOf(colEl);
          }
        }
      }

      // 3. Vị trí dọc: Cố gắng đặt ngang hàng với đỉnh của tab/event
      if (dayColumnRect && ["week", "work_week", "day"].includes(view)) {
        let relativeTop = 0;
        if (anchor) {
            relativeTop = anchor.top || 0;
        } else if (editingItem) {
            const d = new Date(editingItem.start_time);
            relativeTop = (d.getHours() * 60 + d.getMinutes()) * (64 / 60);
        }
        // Đỉnh của event tương đối so với cột (đã cuộn)
        top = dayColumnRect.top + relativeTop;
      } else if (pivotY !== undefined) {
        top = pivotY - modalHeight / 3;
      }

      // 4. Vị trí ngang: Cột 1, 2, 3 bật bên phải. Cột 4, 5, 6, 7 bật bên trái.
      if (avoidRect && ["week", "work_week", "day"].includes(view)) {
        if (view === "day" || colIndex < 3) {
          // Hiển thị bên PHẢI của tab/cột
          left = avoidRect.right + 15;
        } else {
          // Hiển thị bên TRÁI của tab/cột
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
        // Fallback: căn giữa màn hình
        if (top === undefined || left === undefined) {
          top = vh / 2 - modalHeight / 2;
          left = vw / 2 - modalWidth / 2;
        }
      }

      // 5. Ràng buộc viewport
      let finalTop, finalLeft;
      if (dragOffset.x !== 0 || dragOffset.y !== 0 || isDragging) {
        // Cho phép di chuyển tự do khi kéo, giữ lại ít nhất 40px của header/cạnh
        finalTop = Math.max(0, Math.min(top, vh - 40));
        finalLeft = Math.max(-modalWidth + 40, Math.min(left, vw - 40));
      } else {
        // Khi tự động tính toán lúc mới mở, cố gắng giữ form gọn trong màn hình
        finalTop = Math.max(margin, Math.min(top, Math.max(margin, vh - modalHeight - margin)));
        finalLeft = Math.max(margin, Math.min(left, Math.max(margin, vw - modalWidth - margin)));
      }

      const useTransition = (isSticky || isPositioned) && !isDragging;

      setModalStyle({
        top: finalTop,
        left: finalLeft,
        opacity: 1,
        transition: 'none'
      });
      setIsPositioned(true);
    };

    const raf = requestAnimationFrame(calculatePosition);

    // Tính lại khi modal đổi kích thước (đổi tab, nội dung tải xong) hoặc cửa sổ đổi kích thước
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
