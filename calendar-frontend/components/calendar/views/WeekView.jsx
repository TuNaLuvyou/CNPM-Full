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
  // Tách holiday events để hiển trong CalendarHeader (banner), không đưa lên time grid
  const nonHolidayEvents = events.filter(ev => !ev.is_holiday);

  return (
    <>
      <CalendarHeader weekDays={weekDays} onDayClick={handleDayClick} appSettings={appSettings} events={events} />
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
        events={nonHolidayEvents}
        onEventClick={onEventClick}
        onEventUpdate={onEventUpdate}
        onToggleTask={onToggleTask}
        appSettings={appSettings}
      />
    </>
  );
}
