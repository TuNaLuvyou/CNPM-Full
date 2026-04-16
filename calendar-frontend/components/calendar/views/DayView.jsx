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
  return (
    <>
      <CalendarHeader
        mode="day"
        selectedDate={selectedDate}
        selectedDayName={selectedDayName}
        isSelectedToday={isSelectedToday}
        appSettings={appSettings}
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
        events={events}
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
