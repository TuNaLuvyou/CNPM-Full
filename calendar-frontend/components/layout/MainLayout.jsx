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
  notifications,
  setNotifications,
  appSettings,
  setEventSavedTick,
  events,
  onSearchItemClick,
}) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1f1f1f] relative min-w-[700px]">
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
        notifications={notifications}
        setNotifications={setNotifications}
        appSettings={appSettings}
        setEventSavedTick={setEventSavedTick}
        events={events}
        onSearchItemClick={onSearchItemClick}
      />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-[#1f1f1f] border-r border-slate-200 dark:border-[#3c3c3c]">
          {children}
        </main>
        <RightSidebar appSettings={appSettings} currentUser={currentUser} />
      </div>
    </div>
  );
}
