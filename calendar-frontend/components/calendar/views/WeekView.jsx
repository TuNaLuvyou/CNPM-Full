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
}) {
  return (
    <>
      <CalendarHeader weekDays={weekDays} onDayClick={handleDayClick} />
      <TimeGrid
        mode="week"
        weekDays={weekDays}
        onGridClick={onGridClick}
        previewEvent={previewEvent}
        setPreviewEvent={setPreviewEvent}
        setIsPreviewDragging={setIsPreviewDragging}
        onInteractionEnd={onInteractionEnd}
        setSelectedDate={setSelectedDate}
      />
    </>
  );
}
