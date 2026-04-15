"use client";
import React, { useState } from "react";
import {
  Plus,
  Calendar as CalendarIcon,
  CheckSquare,
  Clock,
} from "lucide-react";
import MiniCalendar from "@/components/widgets/MiniCalendar";
import Calendar from "@/components/widgets/Calendar";
import CreateModal from "@/components/modals/CreateEventModal";
import YearDayPopup from "@/components/widgets/YearDayPopup";
import { getVNTime } from "@/lib/CalendarHelper";

export default function CalendarApp() {
  const [mounted, setMounted] = React.useState(false);

  // ── Shared calendar state ──
  const [view, setView] = React.useState("Tuần");
  const [viewDate, setViewDate] = React.useState(new Date(2026, 3, 13)); // Fixed date for SSR stability
  const [selectedDate, setSelectedDate] = React.useState(new Date(2026, 3, 13));

  React.useEffect(() => {
    setMounted(true);
    const now = getVNTime();
    setViewDate(now);
    setSelectedDate(now);
  }, []);

  // ── Sidebar dropdown ──
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  // ── Create modal & Tab preview ──
  const [createModal, setCreateModal] = useState({
    isOpen: false,
    tab: "event",
  });
  const [clickPosition, setClickPosition] = useState(null);
  const [previewEvent, setPreviewEvent] = useState(null);
  const [isPreviewDragging, setIsPreviewDragging] = useState(false);

  // ── Year Day Popup state ──
  const [yearDayPopup, setYearDayPopup] = useState({
    isOpen: false,
    date: null,
    position: null,
  });

  // ── MiniCalendar double-click logic ──
  const [lastMiniClick, setLastMiniClick] = useState(null);

  if (!mounted) {
    return (
      <div className="flex h-screen bg-white items-center justify-center">
        <div className="animate-pulse text-slate-400 font-medium">
          Đang tải lịch...
        </div>
      </div>
    );
  }

  const handleMiniDayClick = (clickedDate) => {
    const isSameDate =
      lastMiniClick &&
      clickedDate.toDateString() === lastMiniClick.toDateString();
    setLastMiniClick(clickedDate);
    setSelectedDate(clickedDate);

    if (view === "Ngày") {
      setViewDate(clickedDate);
    } else if (view === "Tuần") {
      if (isSameDate) {
        setView("Ngày");
        setViewDate(clickedDate);
      } else setViewDate(clickedDate);
    } else if (view === "Tháng") {
      if (isSameDate) {
        setView("Tuần");
        setViewDate(clickedDate);
      } else setViewDate(clickedDate);
    } else if (view === "Năm") {
      setView("Tháng");
      setViewDate(clickedDate);
    }
  };

  // Nhận dữ liệu tọa độ từ TimeGrid truyền lên
  const handleGridClick = ({ x, y, fullDate, hour, topOffset, columnRect }) => {
    const totalMinutes = Math.round((topOffset / 64) * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    const dateWithTime = new Date(fullDate);
    dateWithTime.setHours(h, m, 0, 0);

    setClickPosition({ x, y, columnRect });
    setPreviewEvent({
      fullDate: dateWithTime,
      top: topOffset,
      height: 64,
      type: "grid",
      ts: Date.now(),
    });
    setCreateModal({ isOpen: true, tab: "event" });
    setSelectedDate(dateWithTime);
  };

  // Khi kết thúc kéo thả/resize, cập nhật lại tọa độ "chốt" để Modal không bị nhảy về chỗ cũ
  const handleInteractionEnd = ({ fullDate, topOffset, columnRect }) => {
    setClickPosition((prev) => ({
      ...prev,
      columnRect,
      ts: Date.now(), // Force re-render position logic
    }));
    setSelectedDate(fullDate);
    setCreateModal((prev) => ({ ...prev, isOpen: true }));
  };

  // Mở modal từ nút "Tạo mới" (Tự động nhảy về hôm nay và tìm đường kẻ đỏ)
  const openCreate = (tab) => {
    const today = getVNTime();

    // Cập nhật ngày để nhảy về view hôm nay
    setViewDate(today);
    setSelectedDate(today);

    // Thêm timestamp và view để force CreateModal re-positioning
    const ts = Date.now();
    setClickPosition({ type: "now", ts });
    setPreviewEvent({
      fullDate: today,
      top: 0,
      height: 64,
      type: "now",
      ts,
    });

    setIsCreateMenuOpen(false);
    setCreateModal({ isOpen: true, tab });
  };

  // Khi click vào ngày ở trang Năm
  const handleYearDayClick = (date, event) => {
    const rect = event.target.getBoundingClientRect();
    setYearDayPopup({
      isOpen: true,
      date: date,
      position: { x: rect.left + rect.width / 2, y: rect.top },
    });
  };

  const handleNavigateFromYearPopup = (date) => {
    setSelectedDate(date);
    setViewDate(date);
    setView("Ngày");
    setYearDayPopup({ isOpen: false, date: null, position: null });
  };

  // Đóng Modal và xóa bóng mờ
  const handleCloseModal = () => {
    setCreateModal((prev) => ({ ...prev, isOpen: false }));
    setPreviewEvent(null);
  };

  return (
    <div className="flex h-screen bg-white text-slate-800 font-sans overflow-hidden">
      {/* ── SIDEBAR ── */}
      <aside className="w-72 flex-shrink-0 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Lịch Của Tôi
          </span>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          {/* Tạo mới dropdown */}
          <div className="relative mb-8">
            <button
              onClick={() => setIsCreateMenuOpen((v) => !v)}
              className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-5 h-5 mr-2" /> Tạo mới
            </button>

            {isCreateMenuOpen && (
              <div className="absolute top-14 left-0 w-full bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                <button
                  onClick={() => openCreate("event")}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center text-sm text-slate-700"
                >
                  <CalendarIcon className="w-4 h-4 mr-3 text-blue-500" /> Sự
                  kiện
                </button>
                <button
                  onClick={() => openCreate("task")}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center text-sm text-slate-700"
                >
                  <CheckSquare className="w-4 h-4 mr-3 text-emerald-500" /> Việc
                  cần làm
                </button>
                <button
                  onClick={() => openCreate("appointment")}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center text-sm text-slate-700"
                >
                  <Clock className="w-4 h-4 mr-3 text-purple-500" /> Lên lịch
                  hẹn
                </button>
              </div>
            )}
          </div>

          <MiniCalendar
            onDayClick={handleMiniDayClick}
            viewDate={viewDate}
            selectedDate={selectedDate}
          />

          <hr className="border-slate-200 my-6" />

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Lịch của tôi
            </h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">Cá nhân</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-purple-600"
                />
                <span className="text-sm">Công việc</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-emerald-600"
                />
                <span className="text-sm">Gia đình</span>
              </label>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden bg-white relative z-20">
        <Calendar
          view={view}
          setView={setView}
          viewDate={viewDate}
          setViewDate={setViewDate}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onOpenCreate={openCreate}
          onGridClick={handleGridClick}
          previewEvent={previewEvent}
          setPreviewEvent={setPreviewEvent}
          setIsPreviewDragging={setIsPreviewDragging}
          onInteractionEnd={handleInteractionEnd}
          onYearDayClick={handleYearDayClick}
        />
      </main>

      {/* ── CREATE MODAL ── */}
      <CreateModal
        isOpen={createModal.isOpen}
        initialTab={createModal.tab}
        position={clickPosition}
        initialDate={selectedDate}
        onClose={handleCloseModal}
        view={view}
        previewEvent={previewEvent}
      />

      {/* ── YEAR DAY POPUP ── */}
      <YearDayPopup
        key={yearDayPopup.date?.toDateString() || "none"}
        isOpen={yearDayPopup.isOpen}
        date={yearDayPopup.date}
        position={yearDayPopup.position}
        onClose={() => setYearDayPopup({ ...yearDayPopup, isOpen: false })}
        onNavigateToDay={handleNavigateFromYearPopup}
        events={[]} // Mock events, có thể kết nối data sau
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
                    .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
                `,
        }}
      />
    </div>
  );
}
