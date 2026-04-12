"use client";
import { useState, useEffect, useRef } from "react";
import { X, Calendar as CalendarIcon, CheckSquare, Clock } from "lucide-react";
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
  view, // Thêm prop view
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const modalRef = useRef(null);
  const [modalStyle, setModalStyle] = useState({ opacity: 0 }); // Ẩn lúc render lần đầu để đo kích thước

  const now = initialDate || getVNTime(); // Ưu tiên ngày được truyền vào (từ grid click)

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  // Tính toán lại vị trí Modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) {
      setModalStyle({ opacity: 0 });
      return;
    }

    const calculatePosition = () => {
      const rect = modalRef.current.getBoundingClientRect();
      let top, left;

      // ══ XỬ LÝ THEO VIEW ══
      
      // 1. VIEW NGÀY - LUÔN Ở GIỮA
      if (view === "Ngày") {
        top = window.innerHeight / 2 - rect.height / 2;
        left = window.innerWidth / 2 - rect.width / 2;
      }
      // 2. VIEW THÁNG - CẠNH Ô NGÀY (THỬ TÌM Ô HÔM NAY)
      else if (view === "Tháng" && position?.type === "now") {
        const todayCell = document.getElementById("today-cell");
        if (todayCell) {
          const cellRect = todayCell.getBoundingClientRect();
          top = cellRect.top - 20;
          left = cellRect.right + 20;
        } else {
          top = window.innerHeight / 2 - rect.height / 2;
          left = window.innerWidth / 2 - rect.width / 2;
        }
      }
      // 3. VIEW TUẦN HOẶC BẤM TỪ SIDEBAR (CÓ TYPE 'NOW')
      else if (position?.type === "now") {
        const redLine = document.getElementById("current-time-line");
        if (redLine) {
          const lineRect = redLine.getBoundingClientRect();
          top = lineRect.top - 80;
          // Nếu là Chủ Nhật (mép phải), tự động nhảy sang trái để không bị che/tràn
          if (now.getDay() === 0) {
            left = lineRect.left - rect.width - 40;
          } else {
            left = lineRect.right + 120;
          }
        } else {
          top = window.innerHeight / 2 - rect.height / 2;
          left = window.innerWidth / 2 - rect.width / 2;
        }
      }
      // 4. BẤM TỪ LƯỚI GRID (TimeGrid)
      else if (position?.columnRect) {
        top = position.y - 40;
        // Nếu là Chủ Nhật, ưu tiên hiện bên trái cột
        if (now.getDay() === 0) {
          left = position.columnRect.left - rect.width - 20;
        } else {
          left = position.columnRect.right + 10;
        }
      }
      // 5. FALLBACK
      else if (position?.x && position?.y) {
        top = position.y;
        left = position.x + 20;
      } else {
        top = window.innerHeight / 2 - rect.height / 2;
        left = window.innerWidth / 2 - rect.width / 2;
      }

      // ══ CHỐNG TRÀN VIỀN ══
      if (left + rect.width > window.innerWidth - 20) {
        if (position?.columnRect) {
          left = position.columnRect.left - rect.width - 10;
        } else {
          left = window.innerWidth - rect.width - 20;
        }
      }

      if (top + rect.height > window.innerHeight - 20) {
        top = window.innerHeight - rect.height - 20;
      }
      if (top < 20) top = 20;
      if (left < 20) left = 20;

      setModalStyle({ top, left, opacity: 1 });
    };

    const timer = setTimeout(calculatePosition, 50); // Tăng delay một chút để DOM ổn định
    return () => clearTimeout(timer);
  }, [isOpen, position, view]);

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
    // Xóa class nền mờ, đổi thành div bọc ngoài xử lý click ra ngoài để đóng modal
    <div className="fixed inset-0 z-50 pointer-events-none" onClick={onClose}>
      {/* Modal Box */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()} // Ngăn không cho click xuyên xuống div bọc ngoài
        className="fixed w-full max-w-lg bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] flex flex-col max-h-[90vh] border border-slate-200 pointer-events-auto transition-opacity duration-200"
        style={modalStyle}
      >
        {/* ── Tabs header ── */}
        <div className="relative pt-8 pb-4 px-6 flex-shrink-0">
          {/* Close button - Absolute corner */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Tabs - Pill style */}
          <div className="flex items-center gap-3">
            {TABS.map(({ key, label, Icon }) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200
                                    ${
                                      active
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-200 scale-105"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                                    }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
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
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            Huỷ
          </button>
          <button
            onClick={handleLuu}
            className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
