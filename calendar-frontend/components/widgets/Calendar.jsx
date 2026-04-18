"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  DAY_NAMES,
  buildWeekDays,
  buildMonthCells,
  getLocalizedTime,
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
  onToggleTask,
  currentUser,
  setCurrentUser,
  setAuthModal,
  setIsSettingsModalOpen,
  setIsTrashOpen,
  deletedItems,
  notifications,
  setNotifications,
  appSettings,
  setEventSavedTick,
}) {
  const now = getLocalizedTime(appSettings.primaryTimezone);

  // Chỉ giao diện Tuần mới dùng startDay động, các giao diện khác (Tháng, Mini, Năm) mặc định Thứ 2
  const weekStartDay = view === "week" ? appSettings.weekStartDay : "monday";
  
  const weekDays = buildWeekDays(viewDate, weekStartDay, appSettings.language);
  const monthCells = buildMonthCells(viewDate.getFullYear(), viewDate.getMonth(), "monday");

  const handleDayClick = (fullDate) => {
    setSelectedDate(fullDate);
    setViewDate(fullDate);
    setView("day");
  };

  const selectedDayName = DAY_NAMES[appSettings.language || "vi"][selectedDate.getDay()];
  const isSelectedToday = selectedDate.toDateString() === now.toDateString();

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
        setIsTrashOpen={setIsTrashOpen}
        notifications={notifications}
        setNotifications={setNotifications}
        appSettings={appSettings}
        setEventSavedTick={setEventSavedTick}
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          {view === "year" && (
            <YearView viewDate={viewDate} onYearDayClick={onYearDayClick} events={events} appSettings={appSettings} />
          )}
          {view === "month" && (
            <MonthView 
              monthCells={monthCells} 
              handleDayClick={handleDayClick} 
              events={events}
              onEventClick={handleEventClick}
              onEventUpdate={onEventUpdate}
              previewEvent={previewEvent}
              appSettings={appSettings}
            />
          )}
          {view === "week" && (
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
              onToggleTask={onToggleTask}
              appSettings={appSettings}
            />
          )}
          {view === "day" && (
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
              onToggleTask={onToggleTask}
              appSettings={appSettings}
            />
          )}
        </div>
      </MainLayout>
    </>
  );
}
