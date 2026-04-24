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
  const [saving, setSaving] = useState(false);
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

  const visibleTabs = editingItem 
    ? TABS.filter(t => t.key === (editingItem.event_type || 'event'))
    : TABS;

  const hideWhileDraggingPreview = isPreviewDragging && !editingItem && !interactionState?.id;

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
        className={`create-modal-root fixed w-full max-w-lg bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] max-h-[90vh] border border-slate-200 ${hideWhileDraggingPreview ? 'hidden' : 'flex flex-col pointer-events-auto'}`}
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
        <div className="overflow-y-auto custom-scrollbar px-6 py-4 flex-1 border-t border-slate-50">
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
          handleLuu={handleLuu}
          lang={lang}
          activeTab={activeTab}
        />
      </div>
    </div>
  );
}