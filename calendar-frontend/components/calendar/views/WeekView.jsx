import React from "react";
import TimeGrid from "../TimeGrid";
import CalendarHeader from "../CalendarHeader";

export default function WeekView({
  weekDays,
  onGridClick,
  previewEvent,
  setPreviewEvent,
  setIsPreviewDragging,
  onInteractionEnd,
  setSelectedDate,
  handleDayClick,
  events = [],
  onEventClick,
  onEventUpdate,
  onInteractionUpdate,
  onToggleTask,
  appSettings,
}) {
  return (
    <>
      <CalendarHeader weekDays={weekDays} onDayClick={handleDayClick} appSettings={appSettings} />
      <TimeGrid
        mode="week"
        weekDays={weekDays}
        onGridClick={onGridClick}
        previewEvent={previewEvent}
        setPreviewEvent={setPreviewEvent}
        setIsPreviewDragging={setIsPreviewDragging}
        onInteractionEnd={onInteractionEnd}
        onInteractionUpdate={onInteractionUpdate}
        setSelectedDate={setSelectedDate}
        events={events}
        onEventClick={onEventClick}
        onEventUpdate={onEventUpdate}
        onToggleTask={onToggleTask}
        appSettings={appSettings}
      />
    </>
  );
}
