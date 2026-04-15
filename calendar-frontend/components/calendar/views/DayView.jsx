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
}) {
  return (
    <>
      <CalendarHeader
        mode="day"
        selectedDate={selectedDate}
        selectedDayName={selectedDayName}
        isSelectedToday={isSelectedToday}
      />
      <TimeGrid
        mode="day"
        onGridClick={onGridClick}
        previewEvent={previewEvent}
        setPreviewEvent={setPreviewEvent}
        setIsPreviewDragging={setIsPreviewDragging}
        onInteractionEnd={onInteractionEnd}
        setSelectedDate={setSelectedDate}
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
