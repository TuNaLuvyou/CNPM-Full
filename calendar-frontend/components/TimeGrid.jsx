"use client";
import { useState, useEffect, useRef } from "react";
import Event from "./Event";
import { getVNTime } from "../lib/CalendarHelper"; // Import hàm giờ VN

const HOUR_HEIGHT = 64;

/** Tính vị trí px của đường đỏ từ 00:00 (chuẩn giờ VN) */
function getNowOffset() {
  const now = getVNTime();
  // 10:00 AM -> 10 * 64px = 640px. 
  // Vì lưới grid thực sự bắt đầu từ 64px (h-16), nên offset này sẽ khớp với vạch kẻ ngang của từng giờ.
  return (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;
}

export default function TimeGrid({
  hours,
  weekDays,
  mode = "week",
  onGridClick,
  previewEvent, // <-- THÊM PROP NÀY ĐỂ NHẬN DỮ LIỆU BÓNG MỜ
}) {
  const displayHours = hours || Array.from({ length: 23 }, (_, i) => i + 1);
  const displayWeekDays = weekDays || [];

  const [nowOffset, setNowOffset] = useState(getNowOffset);
  const scrollRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNowOffset(getNowOffset()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Tự động cuộn tới vị trí tab mới tạo
  useEffect(() => {
    if (previewEvent && scrollRef.current) {
      // Tính toán vị trí cần cuộn tới (bù 64px header của grid)
      const top = (previewEvent.type === "now" ? nowOffset : previewEvent.top) + 64;
      const containerHeight = scrollRef.current.clientHeight;
      
      // Cuộn sao cho slot nằm ở khoảng 1/3 từ trên xuống để dễ nhìn
      const targetScroll = Math.max(0, top - containerHeight / 3);
      
      scrollRef.current.scrollTo({
        top: targetScroll,
        behavior: "smooth"
      });
    }
  }, [previewEvent?.ts, previewEvent?.top]); // Trigger khi có event mới (dựa vào ts hoặc top)

  // Xử lý khi click vào ô grid
  const handleColumnClick = (e, day) => {
    if (!onGridClick) return;

    // Lấy tọa độ hiển thị modal
    const x = e.clientX;
    const y = e.clientY;

    // Tính giờ dựa theo vị trí click chuột (tùy chọn để truyền cho form)
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const clickedHour = Math.floor((offsetY - 64) / HOUR_HEIGHT); // -64px bù phần top

    // Tính khoảng cách từ trên xuống để vẽ khối preview bóng mờ
    const topOffset = Math.max(0, Math.floor(offsetY - 64));

    // Truyền thêm topOffset lên cho page.js
    onGridClick({ x, y, fullDate: day.fullDate, hour: clickedHour, topOffset, columnRect: rect });
  };

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto bg-white relative scroll-smooth custom-scrollbar"
    >
      <div className="flex min-h-max">
        {/* Cột thời gian (Bên trái) */}
        <div className="w-16 flex-shrink-0 flex flex-col bg-white border-r border-slate-200 relative z-10">
          <div className="h-16 flex items-start justify-end pr-3 pt-2">
            <span className="text-[10px] font-medium text-slate-400">
              GMT+07
            </span>
          </div>
          {displayHours.map((hour) => (
            <div key={hour} className="h-16 flex items-start justify-end pr-3">
              <span className="text-[11px] font-medium text-slate-400 -mt-2">
                {hour === 12
                  ? "12 PM"
                  : hour > 12
                    ? `${hour - 12} PM`
                    : `${hour} AM`}
              </span>
            </div>
          ))}
        </div>

        {/* Lưới ngày */}
        <div
          className={`flex-1 grid ${mode === "day" ? "grid-cols-1" : "grid-cols-7"} relative`}
        >
          {/* Đường kẻ ngang */}
          <div className="absolute inset-0 pointer-events-none flex flex-col">
            <div className="h-16 w-full"></div>
            {displayHours.map((hour) => (
              <div
                key={hour}
                className="h-16 border-t border-slate-200 w-full"
              ></div>
            ))}
          </div>

          {/* Các cột ngày */}
          {displayWeekDays.map((day, idx) => (
            <div
              key={idx}
              className="border-l border-slate-200 relative h-[1536px] hover:bg-slate-50/50 transition-colors cursor-pointer"
              onClick={(e) => handleColumnClick(e, day)}
            >
              {/* Lớp phủ chứa vạch đỏ và preview - Bắt đầu từ top-0 để khớp tuyệt đối với tọa độ click */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Bù 64px (h-16) cho phần header của lưới */}
                <div className="relative h-full pt-16">
                {/* 🔴 KHỐI PREVIEW TẠM THỜI (BÓNG MỜ) 🔴 */}
                {previewEvent &&
                  previewEvent.fullDate.toDateString() ===
                    day.fullDate.toDateString() && (
                    <div
                      className="absolute left-1 right-1 z-30 bg-blue-50 border border-blue-400 rounded-md p-1 shadow-sm opacity-90 transition-all pointer-events-none flex items-start"
                      style={{
                        // Nếu bấm nút tạo mới -> bám sát vạch đỏ, nếu click lưới -> bám sát chuột
                        top:
                          previewEvent.type === "now"
                            ? `${nowOffset}px`
                            : `${previewEvent.top}px`,
                        height: "64px", // Mặc định dài 1 tiếng
                      }}
                    >
                      <span className="text-[11px] font-semibold text-blue-600 truncate px-1">
                        (Tạo mới...)
                      </span>
                    </div>
                  )}

                {/* Đường đỏ giờ hiện tại */}
                {day.isToday && (
                  <div
                    id="current-time-line" // <-- THÊM ID NÀY ĐỂ MODAL TÌM ĐƯỢC VỊ TRÍ
                    className="absolute left-0 right-0 z-20 flex items-center"
                    style={{ top: `${nowOffset}px` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0"></div>
                    <div className="flex-1 h-px bg-red-500"></div>
                  </div>
                )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}