"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { X, Calendar as CalendarIcon, CheckSquare, Clock, GripHorizontal } from "lucide-react";
import EventForm from "@/components/forms/EventForm";
import TaskForm from "@/components/forms/TaskForm";
import AppointmentForm from "@/components/forms/AppointmentForm";
import { getVNTime, getEventStyle } from "@/lib/CalendarHelper";
import { createEvent, createTask, updateEvent, trashEvent, updateTask, trashTask } from "@/lib/api";

const TABS = [
  { key: "event", label: "Sự kiện", Icon: CalendarIcon },
  { key: "task", label: "Việc cần làm", Icon: CheckSquare },
  { key: "appointment", label: "Lên lịch hẹn", Icon: Clock },
];
const SAVE_BTN_ID = {
  event: "__eventSave",
  task: "__taskSave",
  appointment: "__appointmentSave",
};

export default function CreateModal({
  isOpen,
  initialTab = "event",
  initialDate,
  onClose,
  onSaved, // callback sau khi save thành công
  position,
  view,
  previewEvent,
  editingItem = null,
  interactionState = null,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const modalRef = useRef(null);
  
  // Nạp thông tin từ editingItem nếu có
  const now = editingItem ? new Date(editingItem.start_time) : (previewEvent?.fullDate || initialDate || getVNTime());
  const diffMs = editingItem ? (new Date(editingItem.end_time) - new Date(editingItem.start_time)) : null;
  const duration = editingItem ? Math.round(diffMs / 60000) : Math.round(((previewEvent?.height || 64) / 64) * 60);

  const [modalStyle, setModalStyle] = useState({ opacity: 0, transition: 'none' });

  // ── Drag state ──
  const [isDragging, setIsDragging] = useState(false);
  const dragOrigin = useRef({ mouseX: 0, mouseY: 0, boxLeft: 0, boxTop: 0 });

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (e.target.closest('.grid-interaction-area') || e.target.closest('.preview-tab') || e.target.closest('.year-day-popup')) return;
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    };
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  // ── Positioning logic ──
  const [isPositioned, setIsPositioned] = useState(false);

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
      if (!avoidRect && anchor && ["Tuần", "Tuần làm việc", "Ngày"].includes(view)) {
        const targetDateStr = anchor.fullDate?.toDateString();
        const colEl = document.querySelector(`[data-column-date="${targetDateStr}"]`);
        if (colEl) avoidRect = colEl.getBoundingClientRect();
      }

      // 3. Calculate Vertical Position (Top)
      if (pivotY !== undefined) {
        // Ưu tiên đặt modal căn giữa theo chiều dọc so với điểm click
        top = pivotY - modalHeight / 3;
      } else if (anchor && avoidRect && ["Tuần", "Tuần làm việc", "Ngày"].includes(view)) {
        // Fallback dùng tọa độ lưới nếu không có pivotY
        // Nếu avoidRect là day-column (cao), ta dùng anchor.top để định vị
        const isTallColumn = avoidRect.height > 500;
        const relativeTop = isTallColumn ? anchor.top + 64 : 0;
        top = avoidRect.top + relativeTop - 40;
      }

      // 4. Calculate Horizontal Position (Left)
      if (avoidRect) {
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
      const finalTop = Math.max(20, Math.min(top, window.innerHeight - modalHeight - 20));
      const finalLeft = Math.max(10, Math.min(left, window.innerWidth - modalWidth - 10));

      // 6. Apply styles
      const useTransition = isSticky || isPositioned;

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
  }, [isOpen, isPositioned, activeTab, position?.ts, view, interactionState, previewEvent]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragOrigin.current.mouseX;
    const dy = e.clientY - dragOrigin.current.mouseY;
    let newLeft = dragOrigin.current.boxLeft + dx;
    let newTop = dragOrigin.current.boxTop + dy;
    const w = modalRef.current?.offsetWidth || 500;
    const h = modalRef.current?.offsetHeight || 400;
    newLeft = Math.max(8, Math.min(newLeft, window.innerWidth - w - 8));
    newTop = Math.max(8, Math.min(newTop, window.innerHeight - h - 8));
    setModalStyle((prev) => ({ ...prev, left: newLeft, top: newTop }));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleDragStart = (e) => {
    if (e.target.closest("button")) return;
    if (e.button !== 0) return;
    e.preventDefault();
    dragOrigin.current = { mouseX: e.clientX, mouseY: e.clientY, boxLeft: modalStyle.left, boxTop: modalStyle.top };
    setIsDragging(true);
  };

  if (!isOpen) return null;

  const handleLuu = () => {
    const btn = document.getElementById(SAVE_BTN_ID[activeTab]);
    btn?.click();
  };

  // ── Gọi API thực sự khi save ──
  const handleFormSave = async (formData) => {
    setSaving(true);
    try {
      const cleanId = editingItem?.id?.toString().replace('task-', '').replace('event-', '');
      if (activeTab === "task") {
        if (editingItem) await updateTask(cleanId, formData);
        else await createTask(formData);
      } else {
        if (editingItem) await updateEvent(cleanId, formData);
        else await createEvent(formData);
      }
      onSaved?.();
      onClose();
    } catch (e) {
      alert("Lỗi khi lưu: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleXoa = async () => {
    if (!editingItem) return;
    if (!confirm("Bạn có chắc chắn muốn chuyển mục này vào thùng rác?")) return;
    setDeleting(true);
    try {
      const cleanId = editingItem.id.toString().replace('task-', '').replace('event-', '');
      if (activeTab === "task") await trashTask(cleanId);
      else await trashEvent(cleanId);
      onSaved?.();
      onClose();
    } catch (e) {
      alert("Lỗi khi xoá: " + e.message);
    } finally {
      setDeleting(false);
    }
  };

  const formProps = { now, duration, onSave: handleFormSave, initialData: editingItem };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none" onClick={onClose}>
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="create-modal-root fixed w-full max-w-lg bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] flex flex-col max-h-[90vh] border border-slate-200 pointer-events-auto transition-opacity duration-200"
        style={{ ...modalStyle, cursor: isDragging ? "grabbing" : "default", userSelect: isDragging ? "none" : "auto" }}
      >
        {/* Header / Drag handle */}
        <div
          onMouseDown={handleDragStart}
          className={`relative pt-3 pb-4 px-6 flex-shrink-0 rounded-t-2xl select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        >
          <div className="flex justify-center mb-1 pointer-events-none">
            <GripHorizontal className="w-5 h-5 text-slate-300" />
          </div>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="absolute right-4 top-3 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            {TABS.map(({ key, label, Icon }) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer
                    ${active ? "bg-blue-600 text-white shadow-md shadow-blue-200 scale-105" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form body */}
        <div className="overflow-y-auto custom-scrollbar px-6 py-4 flex-1 border-t border-slate-50">
          {activeTab === "event" && <EventForm key={`event-${editingItem?.id || 'new'}`} {...formProps} />}
          {activeTab === "task" && <TaskForm key={`task-${editingItem?.id || 'new'}`} {...formProps} />}
          {activeTab === "appointment" && <AppointmentForm key={`app-${editingItem?.id || 'new'}`} {...formProps} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-gray-50/50 rounded-b-2xl">
          <div className="flex-shrink-0">
            {editingItem && (
              <button
                onClick={handleXoa}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Đang xoá..." : "Xoá"}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              Huỷ
            </button>
            <button
              onClick={handleLuu}
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : (editingItem ? "Cập nhật" : "Lưu")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}