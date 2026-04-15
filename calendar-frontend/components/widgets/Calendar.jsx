"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  VI_DAY_NAMES,
  buildWeekDays,
  buildMonthCells,
  getVNTime,
  formatDateLocal,
} from "../../lib/CalendarHelper";
import { getEvents, getTrashedEvents, restoreEvent, permanentDeleteEvent, trashTask, restoreTask, permanentDeleteTask, getTrashedTasks, getMe, updateEvent, updateTask } from "@/lib/api";

// Layout & Components
import MainLayout from "@/components/layout/MainLayout";
import DayView from "@/components/calendar/views/DayView";
import WeekView from "@/components/calendar/views/WeekView";
import MonthView from "@/components/calendar/views/MonthView";
import YearView from "@/components/calendar/views/YearView";
import AuthModal from "@/components/modals/AuthModal";
import TrashModal from "@/components/modals/TrashModal";
import SettingsModal from "@/components/modals/SettingsModal";

export default function Calendar({
  view,
  setView,
  viewDate,
  setViewDate,
  selectedDate,
  setSelectedDate,
  onGridClick,
  previewEvent,
  setPreviewEvent,
  setIsPreviewDragging,
  onInteractionEnd,
  onOpenCreate,
  onYearDayClick,
  events = [],
  onEventUpdate,
  onInteractionUpdate,
}) {
  const now = getVNTime();

  const [currentUser, setCurrentUser] = useState(null);
  const [authModal, setAuthModal] = useState({ isOpen: false, type: "login" });
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // ── Khôi phục session khi mount ──
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    if (token) {
      getMe()
        .then(user => setCurrentUser(user))
        .catch(() => {
          if (typeof window !== "undefined") localStorage.removeItem("authToken");
        });
    }
  }, []);

  // ── Trash items ──
  const [deletedItems, setDeletedItems] = useState([]);

  const weekDays = buildWeekDays(viewDate);
  const monthCells = buildMonthCells(viewDate.getFullYear(), viewDate.getMonth());

  // Fetch trash items
  const fetchTrash = useCallback(async () => {
    try {
      const [trashedEvents, trashedTasks] = await Promise.all([
        getTrashedEvents(),
        getTrashedTasks(),
      ]);
      const items = [
        ...(Array.isArray(trashedEvents) ? trashedEvents : []).map(e => ({
          id: `event-${e.id}`, _id: e.id, type: "event",
          title: e.title, date: e.date_display, deletedAt: e.deleted_at
        })),
        ...(Array.isArray(trashedTasks) ? trashedTasks : []).map(t => ({
          id: `task-${t.id}`, _id: t.id, type: "task",
          title: t.title, date: t.date_display, deletedAt: t.deleted_at
        })),
      ];
      setDeletedItems(items);
    } catch (e) {
      console.error("Không thể tải thùng rác:", e);
    }
  }, []);

  const handleDayClick = (fullDate) => {
    setSelectedDate(fullDate);
    setViewDate(fullDate);
    setView("Ngày");
  };

  const selectedDayName = VI_DAY_NAMES[selectedDate.getDay()];
  const isSelectedToday = selectedDate.toDateString() === now.toDateString();

  // ── Trash handlers ──
  const handleOpenTrash = () => {
    fetchTrash();
    setIsTrashOpen(true);
  };

  const handleRestore = async (compositeId) => {
    const item = deletedItems.find(i => i.id === compositeId);
    if (!item) return;
    try {
      if (item.type === "event") await restoreEvent(item._id);
      else if (item.type === "task") await restoreTask(item._id);
      setDeletedItems(prev => prev.filter(i => i.id !== compositeId));
      fetchEvents();
    } catch (e) {
      alert("Không thể khôi phục: " + e.message);
    }
  };

  const handlePermanentDelete = async (compositeId) => {
    const item = deletedItems.find(i => i.id === compositeId);
    if (!item) return;
    try {
      if (item.type === "event") await permanentDeleteEvent(item._id);
      else if (item.type === "task") await permanentDeleteTask(item._id);
      setDeletedItems(prev => prev.filter(i => i.id !== compositeId));
    } catch (e) {
      alert("Không thể xóa: " + e.message);
    }
  };

  const handleClearAll = async () => {
    try {
      await Promise.all(
        deletedItems.map(item =>
          item.type === "event"
            ? permanentDeleteEvent(item._id)
            : permanentDeleteTask(item._id)
        )
      );
      setDeletedItems([]);
    } catch (e) {
      alert("Không thể xóa tất cả: " + e.message);
    }
  };

  const handleEventClick = (ev, e) => {
    // Capture coordinates for popup positioning
    // e có thể là MouseEvent hoặc Object chứa toạ độ/rect từ MonthView
    const position = e ? { 
        x: e.clientX, 
        y: e.clientY,
        fullDate: e.fullDate,
        columnRect: e.columnRect
    } : null;
    
    // Nếu ev là null, mặc định là tạo 'event'
    const type = ev?.event_type || 'event';
    onOpenCreate(type, ev, position);
  };

  return (
    <>
      <MainLayout
        view={view}
        setView={setView}
        viewDate={viewDate}
        setViewDate={setViewDate}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        weekDays={weekDays}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        setAuthModal={setAuthModal}
        deletedItems={deletedItems}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
        setIsTrashOpen={handleOpenTrash}
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          {view === "Năm" && (
            <YearView viewDate={viewDate} onYearDayClick={onYearDayClick} events={events} />
          )}
          {view === "Tháng" && (
            <MonthView 
              monthCells={monthCells} 
              handleDayClick={handleDayClick} 
              events={events}
              onEventClick={handleEventClick}
              onEventUpdate={onEventUpdate}
              previewEvent={previewEvent}
            />
          )}
          {view === "Tuần" && (
            <WeekView
              weekDays={weekDays}
              onGridClick={onGridClick}
              previewEvent={previewEvent}
              setPreviewEvent={setPreviewEvent}
              setIsPreviewDragging={setIsPreviewDragging}
              onInteractionUpdate={onInteractionUpdate}
              onInteractionEnd={onInteractionEnd}
              setSelectedDate={setSelectedDate}
              handleDayClick={handleDayClick}
              events={events}
              onEventClick={handleEventClick}
              onEventUpdate={onEventUpdate}
            />
          )}
          {view === "Ngày" && (
            <DayView
              selectedDate={selectedDate}
              selectedDayName={selectedDayName}
              isSelectedToday={isSelectedToday}
              onGridClick={onGridClick}
              previewEvent={previewEvent}
              setPreviewEvent={setPreviewEvent}
              setIsPreviewDragging={setIsPreviewDragging}
              onInteractionUpdate={onInteractionUpdate}
              onInteractionEnd={onInteractionEnd}
              setSelectedDate={setSelectedDate}
              events={events}
              onEventClick={handleEventClick}
              onEventUpdate={onEventUpdate}
            />
          )}
        </div>
      </MainLayout>

      <AuthModal
        isOpen={authModal.isOpen}
        type={authModal.type}
        onClose={() => setAuthModal((p) => ({ ...p, isOpen: false }))}
        onSwitchType={(newType) => setAuthModal((p) => ({ ...p, type: newType }))}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setAuthModal({ isOpen: false, type: "login" });
        }}
      />
      <TrashModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        deletedItems={deletedItems}
        onRestore={handleRestore}
        onPermanentDelete={handlePermanentDelete}
        onClearAll={handleClearAll}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </>
  );
}
