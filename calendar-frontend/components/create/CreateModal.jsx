"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { X, Calendar as CalendarIcon, CheckSquare, Clock, GripHorizontal } from "lucide-react";
import EventForm from "./EventForm";
import TaskForm from "./TaskForm";
import AppointmentForm from "./AppointmentForm";
import { getVNTime } from "../../lib/CalendarHelper";

const TABS = [
  { key: "event", label: "Sự kiện", Icon: CalendarIcon },
  { key: "task", label: "Việc cần làm", Icon: CheckSquare },
  { key: "appointment", label: "Lên lịch hẹn", Icon: Clock },
];
const SAVE_BTN_ID = {
  event: "__eventSave",
  task: "__taskSave",
  appointment: "__appointmentSave",
};

export default function CreateModal({
  isOpen,
  initialTab = "event",
  initialDate,
  onClose,
  onSave,
  position,
  view,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const modalRef = useRef(null);

  // modalStyle lưu vị trí hiển thị (opacity + top + left)
  const [modalStyle, setModalStyle] = useState({ opacity: 0 });

  // ── Drag state ──
  const [isDragging, setIsDragging] = useState(false);
  const dragOrigin = useRef({ mouseX: 0, mouseY: 0, boxLeft: 0, boxTop: 0 });

  const now = initialDate || getVNTime();

  // Reset tab khi mở lại
  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  // ── Tính toán vị trí ban đầu mỗi lần modal mở ──
  // (luôn chạy lại → không giữ vị trí cũ sau khi kéo)
  useEffect(() => {
    if (!isOpen || !modalRef.current) {
      setModalStyle({ opacity: 0 });
      return;
    }

    const calculatePosition = () => {
      const rect = modalRef.current.getBoundingClientRect();
      let top, left;

      if (view === "Ngày") {
        top = window.innerHeight / 2 - rect.height / 2;
        left = window.innerWidth / 2 - rect.width / 2;
      } else if (view === "Tháng" && position?.type === "now") {
        const todayCell = document.getElementById("today-cell");
        if (todayCell) {
          const cellRect = todayCell.getBoundingClientRect();
          top = cellRect.top - 20;
          left = cellRect.right + 20;
        } else {
          top = window.innerHeight / 2 - rect.height / 2;
          left = window.innerWidth / 2 - rect.width / 2;
        }
      } else if (position?.type === "now") {
        const redLine = document.getElementById("current-time-line");
        if (redLine) {
          const lineRect = redLine.getBoundingClientRect();
          top = lineRect.top - 80;
          left =
            now.getDay() === 0
              ? lineRect.left - rect.width - 40
              : lineRect.right + 120;
        } else {
          top = window.innerHeight / 2 - rect.height / 2;
          left = window.innerWidth / 2 - rect.width / 2;
        }
      } else if (position?.columnRect) {
        top = position.y - 40;
        left =
          now.getDay() === 0
            ? position.columnRect.left - rect.width - 20
            : position.columnRect.right + 10;
      } else if (position?.x && position?.y) {
        top = position.y;
        left = position.x + 20;
      } else {
        top = window.innerHeight / 2 - rect.height / 2;
        left = window.innerWidth / 2 - rect.width / 2;
      }

      // Chống tràn viền
      if (left + rect.width > window.innerWidth - 20) {
        left = position?.columnRect
          ? position.columnRect.left - rect.width - 10
          : window.innerWidth - rect.width - 20;
      }
      if (top + rect.height > window.innerHeight - 20)
        top = window.innerHeight - rect.height - 20;
      if (top < 20) top = 20;
      if (left < 20) left = 20;

      setModalStyle({ top, left, opacity: 1 });
    };

    const timer = setTimeout(calculatePosition, 50);
    return () => clearTimeout(timer);
  }, [isOpen, position, view]); // isOpen thay đổi → luôn tính lại từ đầu

  // ── Drag: mousemove & mouseup ──
  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragOrigin.current.mouseX;
      const dy = e.clientY - dragOrigin.current.mouseY;

      let newLeft = dragOrigin.current.boxLeft + dx;
      let newTop = dragOrigin.current.boxTop + dy;

      // Giữ modal trong viewport
      const w = modalRef.current?.offsetWidth || 500;
      const h = modalRef.current?.offsetHeight || 400;
      newLeft = Math.max(8, Math.min(newLeft, window.innerWidth - w - 8));
      newTop = Math.max(8, Math.min(newTop, window.innerHeight - h - 8));

      setModalStyle((prev) => ({ ...prev, left: newLeft, top: newTop }));
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Bắt đầu kéo khi giữ vùng header
  const handleDragStart = (e) => {
    // Không kéo khi click vào button (tab, close…)
    if (e.target.closest("button")) return;
    if (e.button !== 0) return; // chỉ chuột trái
    e.preventDefault();
    dragOrigin.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      boxLeft: modalStyle.left,
      boxTop: modalStyle.top,
    };
    setIsDragging(true);
  };

  if (!isOpen) return null;

  const handleLuu = () => {
    const btn = document.getElementById(SAVE_BTN_ID[activeTab]);
    btn?.click();
  };

  const handleFormSave = (data) => {
    onSave?.(data);
    onClose();
  };

  const formProps = { now, onSave: handleFormSave };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none" onClick={onClose}>
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="fixed w-full max-w-lg bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] flex flex-col max-h-[90vh] border border-slate-200 pointer-events-auto transition-opacity duration-200"
        style={{
          ...modalStyle,
          cursor: isDragging ? "grabbing" : "default",
          userSelect: isDragging ? "none" : "auto",
        }}
      >
        {/* ── Header / Drag handle ── */}
        <div
          onMouseDown={handleDragStart}
          className={`relative pt-3 pb-4 px-6 flex-shrink-0 rounded-t-2xl select-none
            ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        >
          {/* Grip icon – gợi ý kéo thả */}
          <div className="flex justify-center mb-1 pointer-events-none">
            <GripHorizontal className="w-5 h-5 text-slate-300" />
          </div>

          {/* Close button */}
          <button
            onMouseDown={(e) => e.stopPropagation()} // tránh trigger drag
            onClick={onClose}
            className="absolute right-4 top-3 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Tabs */}
          <div className="flex items-center gap-3">
            {TABS.map(({ key, label, Icon }) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onMouseDown={(e) => e.stopPropagation()} // tránh trigger drag
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer
                    ${active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200 scale-105"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Form body ── */}
        <div className="overflow-y-auto custom-scrollbar px-6 py-4 flex-1 border-t border-slate-50">
          {activeTab === "event" && <EventForm {...formProps} />}
          {activeTab === "task" && <TaskForm {...formProps} />}
          {activeTab === "appointment" && <AppointmentForm {...formProps} />}
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-gray-50/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            Huỷ
          </button>
          <button
            onClick={handleLuu}
            className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}