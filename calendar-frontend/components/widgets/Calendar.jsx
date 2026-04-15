"use client";
import React, { useState } from "react";
import {
  VI_DAY_NAMES,
  buildWeekDays,
  buildMonthCells,
  getVNTime,
} from "../../lib/CalendarHelper";

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
}) {
  const now = getVNTime();

  // --- Global UI state coordinated by Calendar (God component refactored) ---
  const [currentUser, setCurrentUser] = useState(null);
  const [authModal, setAuthModal] = useState({ isOpen: false, type: "login" });
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [deletedItems, setDeletedItems] = useState([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // --- Shared Logic ---
  const weekDays = buildWeekDays(viewDate);
  const monthCells = buildMonthCells(
    viewDate.getFullYear(),
    viewDate.getMonth(),
  );

  const handleDayClick = (fullDate) => {
    setSelectedDate(fullDate);
    setViewDate(fullDate);
    setView("Ngày");
  };

  const selectedDayName = VI_DAY_NAMES[selectedDate.getDay()];
  const isSelectedToday = selectedDate.toDateString() === now.toDateString();

  // --- Handlers for high-level actions ---
  const handleRestore = (id) =>
    setDeletedItems((prev) => prev.filter((item) => item.id !== id));
  const handlePermanentDelete = (id) =>
    setDeletedItems((prev) => prev.filter((item) => item.id !== id));
  const handleClearAll = () => setDeletedItems([]);

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
        setIsTrashOpen={setIsTrashOpen}
      >
        {/* Render View Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {view === "Năm" && (
            <YearView viewDate={viewDate} onYearDayClick={onYearDayClick} />
          )}
          {view === "Tháng" && (
            <MonthView monthCells={monthCells} handleDayClick={handleDayClick} />
          )}
          {view === "Tuần" && (
            <WeekView
              weekDays={weekDays}
              onGridClick={onGridClick}
              previewEvent={previewEvent}
              setPreviewEvent={setPreviewEvent}
              setIsPreviewDragging={setIsPreviewDragging}
              onInteractionEnd={onInteractionEnd}
              setSelectedDate={setSelectedDate}
              handleDayClick={handleDayClick}
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
              onInteractionEnd={onInteractionEnd}
              setSelectedDate={setSelectedDate}
            />
          )}
        </div>
      </MainLayout>

      {/* --- Modals managed at the top level --- */}
      <AuthModal
        isOpen={authModal.isOpen}
        type={authModal.type}
        onClose={() => setAuthModal((p) => ({ ...p, isOpen: false }))}
        onSwitchType={(newType) =>
          setAuthModal((p) => ({ ...p, type: newType }))
        }
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
