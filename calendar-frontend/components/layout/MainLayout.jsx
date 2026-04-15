import React from "react";
import Header from "./Header";
import RightSidebar from "./RightSidebar";

export default function MainLayout({
  children,
  view,
  setView,
  viewDate,
  setViewDate,
  selectedDate,
  setSelectedDate,
  weekDays,
  currentUser,
  setCurrentUser,
  setAuthModal,
  deletedItems,
  setIsSettingsModalOpen,
  setIsTrashOpen,
}) {
  return (
    <div className="flex flex-col h-full bg-white relative min-w-[700px]">
      <Header
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
      />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden flex flex-col bg-white border-r border-slate-200">
          {children}
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}
