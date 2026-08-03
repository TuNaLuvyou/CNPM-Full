"use client";
import { useState, useEffect, useRef } from "react";
import { Calendar as CalendarIcon, CheckSquare, Clock } from "lucide-react";
import EventForm from "@/components/forms/EventForm";
import TaskForm from "@/components/forms/TaskForm";
import AppointmentForm from "@/components/forms/AppointmentForm";
import { getVNTime } from "@/lib/CalendarHelper";
import { createEvent, createTask, updateEvent, trashEvent, updateTask, trashTask, leaveEvent } from "@/lib/api";
import { t } from "@/lib/i18n";

import CreateModalHeader from "./create_event/CreateModalHeader";
import CreateModalFooter from "./create_event/CreateModalFooter";
import { useModalDrag } from "./create_event/useModalDrag";
import { useModalPosition } from "./create_event/useModalPosition";

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
  onCancel,
  onSaved, // callback sau khi save thành công
  position,
  view,
  previewEvent,
  editingItem = null,
  interactionState = null,
  isPreviewDragging = false,
  appSettings,
  currentUser,
}) {
  const lang = appSettings?.language || "vi";
  const [activeTab, setActiveTab] = useState(initialTab);
  const saving = false;
  const [deleting, setDeleting] = useState(false);
  const modalRef = useRef(null);

  // ── Drag & Position Hooks ──
  const { dragOffset, isDragging, handleHeaderMouseDown } = useModalDrag({ isOpen });
  const modalStyle = useModalPosition({
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
  });

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

  const isOwner = !editingItem || editingItem.is_owner;
  const canEdit = !editingItem || editingItem.is_owner || editingItem.my_permission === 'edit';

  const handleLeave = async () => {
    if (!editingItem) return;
    if (!confirm(t('contacts_panel.leave_event', lang) + "?")) return;
    setDeleting(true);
    try {
      let cleanId = editingItem.id.toString().replace('task-', '').replace('event-', '');
      cleanId = cleanId.split('_')[0];
      await leaveEvent(cleanId);
      onSaved?.();
      onClose();
    } catch (e) {
      alert("Lỗi: " + e.message);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (e.target.closest('.preview-tab') || e.target.closest('.year-day-popup')) return;
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

  const visibleTabs = editingItem 
    ? TABS.filter(t => t.key === (editingItem.event_type || 'event'))
    : TABS;

  const hideWhileDraggingPreview = isPreviewDragging;

  if (!isOpen) return null;

  const handleLuu = () => {
    const btn = document.getElementById(SAVE_BTN_ID[activeTab]);
    btn?.click();
  };

  // ── Gọi API thực sự khi save ──
  const handleFormSave = (formData) => {
    let cleanId = editingItem?.id?.toString().replace('task-', '').replace('event-', '');
    if (cleanId) cleanId = cleanId.split('_')[0];
    
    // Prevent shifting the recurrence origin by applying delta math
    if (editingItem && editingItem.recurrence_rule && editingItem.original_start_time) {
        const instanceStart = new Date(editingItem.start_time).getTime();
        const newStart = new Date(`${formData.date}T${formData.timeStart}`).getTime();
        const delta = newStart - instanceStart;

        const originalStart = new Date(editingItem.original_start_time).getTime();
        formData.start_time = new Date(originalStart + delta).toISOString();
        
        if (formData.timeEnd) {
            const instanceEnd = new Date(editingItem.end_time || editingItem.start_time).getTime();
            const newEnd = new Date(`${formData.date}T${formData.timeEnd}`).getTime();
            const endDelta = newEnd - instanceEnd;
            const originalEnd = new Date(editingItem.original_end_time || editingItem.original_start_time).getTime();
            formData.end_time = new Date(originalEnd + endDelta).toISOString();
        }

        // Remove frontend helper fields so the backend uses the exact ISO strings we calculated
        delete formData.date;
        delete formData.timeStart;
        delete formData.timeEnd;
    }

    formData.event_type = activeTab;

    // --- Tính toán start_time và end_time ISO cho Optimistic UI ---
    let startTimeIso = formData.start_time;
    let endTimeIso = formData.end_time;

    if (!startTimeIso && formData.date && formData.timeStart) {
      const d = new Date(`${formData.date}T${formData.timeStart}`);
      if (!isNaN(d.getTime())) startTimeIso = d.toISOString();
    }
    if (!endTimeIso && formData.date && formData.timeEnd) {
      const d = new Date(`${formData.date}T${formData.timeEnd}`);
      if (!isNaN(d.getTime())) endTimeIso = d.toISOString();
    }
    if (startTimeIso && !endTimeIso) {
      endTimeIso = new Date(new Date(startTimeIso).getTime() + 3600000).toISOString();
    }

    const duration = (startTimeIso && endTimeIso) 
      ? Math.round((new Date(endTimeIso) - new Date(startTimeIso)) / 60000) 
      : 60;

    // --- OPTIMISTIC UI: Giao diện đi trước ---
    const isUpdate = !!editingItem;
    const optimisticEvent = {
       ...editingItem,
       ...formData,
       id: isUpdate ? editingItem.id : (activeTab === 'task' ? `task-temp-${Date.now()}` : `temp-${Date.now()}`),
       start_time: startTimeIso || new Date().toISOString(),
       end_time: endTimeIso || startTimeIso || new Date().toISOString(),
       duration_minutes: duration,
       event_type: activeTab,
       title: formData.title || "(Không có tiêu đề)",
       is_optimistic: true
    };

    onSaved?.(optimisticEvent, isUpdate ? 'update' : 'create');
    onClose(); // Đóng giao diện ngay lập tức

    // --- API chạy ngầm ở dưới ---
    (async () => {
      try {
        if (activeTab === "task") {
          if (editingItem) await updateTask(cleanId, formData);
          else await createTask(formData);
        } else {
          if (editingItem) await updateEvent(cleanId, formData);
          else await createEvent(formData);
        }
        // Gọi lại chỉ type vừa tạo để lấy ID thật từ server và làm sạch data
        onSaved?.(null, null, activeTab);
      } catch (e) {
        alert(t('create_modal.save_error', lang, [e.message]));
        onSaved?.(null, null, activeTab); // refresh if failed
      }
    })();
  };

  const handleXoa = () => {
    if (!editingItem) return;
    if (!confirm(t('create_modal.confirm_trash', lang))) return;
    
    // --- OPTIMISTIC UI: Xóa ngay trên giao diện ---
    onSaved?.(editingItem, 'delete');
    onClose();

    // --- API chạy ngầm ---
    (async () => {
      try {
        let cleanId = editingItem.id.toString().replace('task-', '').replace('event-', '');
        cleanId = cleanId.split('_')[0];
        if (activeTab === "task") await trashTask(cleanId);
        else await trashEvent(cleanId);
        // Không cần refresh nếu xóa thành công, vì UI đã xóa rồi
      } catch (e) {
        alert(t('create_modal.delete_error', lang, [e.message]));
        onSaved?.(null, null, activeTab); // refresh to bring it back if failed
      }
    })();
  };

  const formProps = { now, duration, isInteracting, onSave: handleFormSave, initialData: editingItem, appSettings };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none" onClick={onClose}>
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={`create-modal-root fixed w-[calc(100vw-24px)] max-w-lg bg-white dark:bg-[#2d2d2d] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] max-h-[calc(100vh-24px)] border border-slate-200 dark:border-[#484848] ${hideWhileDraggingPreview ? 'hidden' : 'flex flex-col pointer-events-auto'}`}
        style={{ ...modalStyle }}
      >
        <CreateModalHeader
          handleHeaderMouseDown={handleHeaderMouseDown}
          onClose={onClose}
          visibleTabs={visibleTabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lang={lang}
        />

        {/* Form body */}
        <div className="overflow-y-auto custom-scrollbar px-6 py-4 flex-1 border-t border-slate-50 dark:border-[#484848]">
          {activeTab === "event" && <EventForm key={`event-${editingItem?.id || 'new'}`} {...formProps} currentUser={currentUser} />}
          {activeTab === "task" && <TaskForm key={`task-${editingItem?.id || 'new'}`} {...formProps} />}
          {activeTab === "appointment" && <AppointmentForm key={`app-${editingItem?.id || 'new'}`} {...formProps} currentUser={currentUser} />}
        </div>

        <CreateModalFooter
          editingItem={editingItem}
          isOwner={isOwner}
          canEdit={canEdit}
          deleting={deleting}
          saving={saving}
          handleXoa={handleXoa}
          handleLeave={handleLeave}
          onClose={onClose}
          onCancel={onCancel}
          handleLuu={handleLuu}
          lang={lang}
          activeTab={activeTab}
        />
      </div>
    </div>
  );
}