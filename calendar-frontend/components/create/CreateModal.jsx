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
    if (!isOpen || !position || !modalRef.current) {
      setModalStyle({ opacity: 0 });
      return;
    }

    const calculatePosition = () => {
      const rect = modalRef.current.getBoundingClientRect();
      let top, left;

      // NẾU BẤM NÚT "TẠO MỚI" TỪ SIDEBAR (truyền type: 'now')
      if (position.type === "now") {
        const redLine = document.getElementById("current-time-line");
        if (redLine) {
          const lineRect = redLine.getBoundingClientRect();
          // Cố gắng đặt ở bên phải của vạch đỏ
          top = lineRect.top - 20;
          left = lineRect.right + 20;
        } else {
          // Fallback: Căn giữa nếu không thấy vạch đỏ (ví dụ đang ở tháng khác)
          top = window.innerHeight / 2 - rect.height / 2;
          left = window.innerWidth / 2 - rect.width / 2;
        }
      }
      // NẾU BẤM TỪ LƯỚI GRID (Có columnRect để né)
      else if (position.columnRect) {
        top = position.y - 40; // Nhích lên 1 chút để không che chuột
        left = position.columnRect.right + 10; // Đặt bên phải cột
      }
      // Fallback cho tọa độ x, y cũ
      else {
        top = position.y;
        left = (position.x || 0) + 20;
      }

      // Xử lý chống tràn viền màn hình
      // Nếu tràn bên phải -> đẩy sang bên trái cột/vạch
      if (left + rect.width > window.innerWidth - 20) {
        if (position.columnRect) {
          left = position.columnRect.left - rect.width - 10;
        } else if (position.type === 'now') {
            const redLine = document.getElementById("current-time-line");
            if (redLine) left = redLine.getBoundingClientRect().left - rect.width - 20;
            else left = window.innerWidth - rect.width - 20;
        } else {
          left = (position.x || window.innerWidth / 2) - rect.width - 20;
        }
      }

      // Chống tràn dọc
      if (top + rect.height > window.innerHeight - 20) {
        top = window.innerHeight - rect.height - 20;
      }
      if (top < 20) top = 20;
      if (left < 20) left = 20;

      setModalStyle({ top, left, opacity: 1 });
    };

    // Sử dụng setTimeout 0 để đảm bảo DOM (vạch đỏ) đã kịp render/update
    const timer = setTimeout(calculatePosition, 0);
    return () => clearTimeout(timer);
  }, [isOpen, position]);

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
        <div className="flex items-center border-b border-slate-200 px-4 pt-4 pb-0 gap-1 flex-shrink-0 cursor-move">
          {TABS.map(({ key, label, Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors
                                    ${
                                      active
                                        ? "border-blue-600 text-blue-600 bg-blue-50/60"
                                        : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                    }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
          <button
            onClick={onClose}
            className="ml-auto mb-2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Form body ── */}
        <div className="overflow-y-auto custom-scrollbar px-6 py-4 flex-1">
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
