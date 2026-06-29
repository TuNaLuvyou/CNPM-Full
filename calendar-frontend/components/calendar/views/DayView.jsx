import React from "react";
import TimeGrid from "../TimeGrid";
import CalendarHeader from "../CalendarHeader";

export default function DayView({
  selectedDate,
  selectedDayName,
  isSelectedToday,
  onGridClick,
  previewEvent,
  setPreviewEvent,
  setIsPreviewDragging,
  onInteractionEnd,
  setSelectedDate,
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
      <CalendarHeader
        mode="day"
        selectedDate={selectedDate}
        selectedDayName={selectedDayName}
        isSelectedToday={isSelectedToday}
        appSettings={appSettings}
        events={events}
      />
      <TimeGrid
        mode="day"
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
        weekDays={[
          {
            day: selectedDayName,
            date: String(selectedDate.getDate()),
            isToday: isSelectedToday,
            fullDate: selectedDate,
          },
        ]}
      />
    </>
  );
}
