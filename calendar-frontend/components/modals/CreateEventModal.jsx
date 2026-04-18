"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { X, Calendar as CalendarIcon, CheckSquare, Clock, GripHorizontal } from "lucide-react";
import EventForm from "@/components/forms/EventForm";
import TaskForm from "@/components/forms/TaskForm";
import AppointmentForm from "@/components/forms/AppointmentForm";
import { getVNTime, getEventStyle } from "@/lib/CalendarHelper";
import { createEvent, createTask, updateEvent, trashEvent, updateTask, trashTask, leaveEvent } from "@/lib/api";
import { t } from "@/lib/i18n";

const TABS = [
  { key: "event", label: "Sự kiện", i18nKey: "event", Icon: CalendarIcon },
  { key: "task", label: "Việc cần làm", i18nKey: "task", Icon: CheckSquare },
  { key: "appointment", label: "Lên lịch hẹn", i18nKey: "appointment", Icon: Clock },
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
  appSettings,
  currentUser,
}) {
  const lang = appSettings?.language || "vi";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const modalRef = useRef(null);
  
  // ── Drag state ──
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startDragPos = useRef({ x: 0, y: 0 });
  const initialOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isOpen) {
      setDragOffset({ x: 0, y: 0 });
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const dx = e.clientX - startDragPos.current.x;
      const dy = e.clientY - startDragPos.current.y;
      setDragOffset({
        x: initialOffset.current.x + dx,
        y: initialOffset.current.y + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleHeaderMouseDown = (e) => {
    // Only drag if left clicking the header itself (or the grip)
    if (e.button !== 0) return;
    
    setIsDragging(true);
    startDragPos.current = { x: e.clientX, y: e.clientY };
    initialOffset.current = { ...dragOffset };
  };
  
  // Xác định xem có sự tương tác kéo thả đang diễn ra cho item này không
  const isInteracting = !!(interactionState && (
    (editingItem && interactionState.id === editingItem.id) || 
    (!editingItem && !interactionState.id)
  ));

  // Nạp thông tin: ưu tiên interactionState (đang kéo) -> editingItem (đang sửa) -> previewEvent (vừa kéo xong/click)
  const activeSource = isInteracting ? interactionState : (editingItem ? null : previewEvent);

  const now = activeSource?.fullDate || (editingItem ? new Date(editingItem.start_time) : (initialDate || getVNTime()));
  
  const duration = activeSource 
    ? Math.round(((activeSource.height || 64) / 64) * 60) 
    : (editingItem 
        ? Math.round((new Date(editingItem.end_time) - new Date(editingItem.start_time)) / 60000) 
        : Math.round(((previewEvent?.height || 64) / 64) * 60));

  const [modalStyle, setModalStyle] = useState({ opacity: 0, transition: 'none' });

  const isOwner = !editingItem || editingItem.is_owner;
  const canEdit = !editingItem || editingItem.is_owner || editingItem.my_permission === 'edit';

  const handleLeave = async () => {
    if (!editingItem) return;
    if (!confirm(t('contacts_panel.leave_event', lang) + "?")) return;
    setDeleting(true);
    try {
      const cleanId = editingItem.id.toString().replace('task-', '').replace('event-', '');
      await leaveEvent(cleanId);
      onSaved?.();
      onClose();
    } catch (e) {
      alert("Lỗi: " + e.message);
    } finally {
      setDeleting(false);
    }
  };

  // ── Drag state removed to fix lag ──

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

  const visibleTabs = editingItem 
    ? TABS.filter(t => t.key === (editingItem.event_type || 'event'))
    : TABS;

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
      alert(t('create_modal.save_error', lang, [e.message]));
    } finally {
      setSaving(false);
    }
  };

  const handleXoa = async () => {
    if (!editingItem) return;
    if (!confirm(t('create_modal.confirm_trash', lang))) return;
    setDeleting(true);
    try {
      const cleanId = editingItem.id.toString().replace('task-', '').replace('event-', '');
      if (activeTab === "task") await trashTask(cleanId);
      else await trashEvent(cleanId);
      onSaved?.();
      onClose();
    } catch (e) {
      alert(t('create_modal.delete_error', lang, [e.message]));
    } finally {
      setDeleting(false);
    }
  };

  const formProps = { now, duration, isInteracting, onSave: handleFormSave, initialData: editingItem, appSettings };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none" onClick={onClose}>
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="create-modal-root fixed w-full max-w-lg bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] flex flex-col max-h-[90vh] border border-slate-200 pointer-events-auto transition-opacity duration-200"
        style={{ ...modalStyle }}
      >
        {/* Header / Drag handle */}
        <div
          onMouseDown={handleHeaderMouseDown}
          className="relative pt-3 pb-4 px-6 flex-shrink-0 rounded-t-2xl select-none cursor-move"
        >
          <div className="flex justify-center mb-1 pointer-events-none">
            <GripHorizontal className="w-5 h-5 text-slate-300" />
          </div>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="absolute right-1 top-1 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl">
            {visibleTabs.map(({ key, i18nKey, Icon }) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer
                    ${active ? "bg-white text-blue-600 shadow-sm scale-[1.02]" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-slate-400"}`} />
                  <span className="truncate">{t(i18nKey, lang)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form body */}
        <div className="overflow-y-auto custom-scrollbar px-6 py-4 flex-1 border-t border-slate-50">
          {activeTab === "event" && <EventForm key={`event-${editingItem?.id || 'new'}`} {...formProps} currentUser={currentUser} />}
          {activeTab === "task" && <TaskForm key={`task-${editingItem?.id || 'new'}`} {...formProps} />}
          {activeTab === "appointment" && <AppointmentForm key={`app-${editingItem?.id || 'new'}`} {...formProps} currentUser={currentUser} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-gray-50/50 rounded-b-2xl">
          <div className="flex-shrink-0 flex items-center gap-4">
            {editingItem && (
              isOwner ? (
                <button
                  onClick={handleXoa}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                >
                  {deleting ? t('deleting', lang) : t('delete', lang)}
                </button>
              ) : (
                editingItem.is_invitee && (
                  <button
                    onClick={handleLeave}
                    disabled={deleting}
                    className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 border border-red-100 rounded-lg transition cursor-pointer disabled:opacity-50"
                  >
                    {deleting ? '...' : t('contacts_panel.leave_event', lang)}
                  </button>
                )
              )
            )}
            
            {!isOwner && editingItem?.owner_name && (
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{t('contacts_panel.owned_by', lang)}</span>
                <span className="text-xs text-slate-600 font-medium">@{editingItem.owner_name}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              {t('cancel', lang)}
            </button>
            {canEdit && (
              <button
                onClick={handleLuu}
                disabled={saving}
                className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-60"
              >
                {saving ? t('saving', lang) : (editingItem ? t('update', lang) : t('save', lang))}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}