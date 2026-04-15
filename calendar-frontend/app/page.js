"use client";
import React, { useState, useCallback } from "react";
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
import { getVNTime, formatDateLocal, buildWeekDays } from "@/lib/CalendarHelper";
import { getEvents, getTasks, updateEvent, updateTask, trashEvent, trashTask } from "@/lib/api";
import { CALENDAR_CATEGORIES } from "@/components/forms/FormHelpers";

export default function CalendarApp() {
  const [mounted, setMounted] = React.useState(false);

  // ── visible categories ──
  const [visibleCategories, setVisibleCategories] = useState(
    CALENDAR_CATEGORIES.map(c => c.value)
  );

  // ── Shared calendar state ──
  const [view, setView] = React.useState("Tuần");
  const [viewDate, setViewDate] = React.useState(getVNTime());
  const [selectedDate, setSelectedDate] = React.useState(getVNTime());

  // ── Events state ──
  const [events, setEvents] = React.useState([]);

  // ── Trigger reload Calendar khi save event/task ──
  const [eventSavedTick, setEventSavedTick] = useState(0);

  const fetchEvents = useCallback(async () => {
    try {
      let params = {};
      if (view === "Ngày") {
        const d = formatDateLocal(selectedDate);
        params = { date_from: d, date_to: d };
      } else if (view === "Tuần" || view === "Tuần làm việc") {
        const days = buildWeekDays(viewDate);
        params = {
          date_from: formatDateLocal(days[0].fullDate),
          date_to: formatDateLocal(days[days.length - 1].fullDate),
        };
      } else if (view === "Tháng") {
        const y = viewDate.getFullYear(), m = viewDate.getMonth();
        params = {
          date_from: formatDateLocal(new Date(y, m, 1)),
          date_to: formatDateLocal(new Date(y, m + 1, 0)),
        };
      } else if (view === "Năm") {
        params = {
          date_from: `${viewDate.getFullYear()}-01-01`,
          date_to: `${viewDate.getFullYear()}-12-31`,
        };
      }
      const [eventsResponse, tasksResponse] = await Promise.all([
        getEvents(params),
        getTasks(params)
      ]);

      const formattedEvents = (Array.isArray(eventsResponse) 
        ? eventsResponse 
        : (eventsResponse.results || [])).map(e => {
          const start = new Date(e.start_time);
          const end = new Date(e.end_time);
          const duration = !isNaN(start) && !isNaN(end) ? Math.round((end - start) / 60000) : 60;
          return { ...e, duration_minutes: duration };
        });

      const formattedTasks = (Array.isArray(tasksResponse) 
        ? tasksResponse 
        : (tasksResponse.results || [])).map(t => {
          const start = new Date(t.start_time);
          const deadline = new Date(t.deadline || t.deadline_display);
          const duration = !isNaN(start) && !isNaN(deadline) ? Math.round((deadline - start) / 60000) : 60;
          return {
            ...t,
            event_type: 'task',
            duration_minutes: duration,
            end_time: t.deadline || t.deadline_display,
            id: `task-${t.id}` 
          };
        });

      setEvents([...formattedEvents, ...formattedTasks]);
    } catch (e) {
      console.error("Không thể tải events:", e);
    }
  }, [view, viewDate, selectedDate]);

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents, eventSavedTick]);

  const handleEventSaved = useCallback(() => {
    setEventSavedTick(t => t + 1);
  }, []);

  const handleGlobalEventUpdate = useCallback(async (item, newStartTime, newDurationMin) => {
    const itemType = item.event_type || 'event';
    
    // Sử dụng độ dài mới (từ resize) hoặc độ dài cũ (từ item) hoặc mặc định 1h
    const finalDurationMin = newDurationMin || item.duration_minutes || 60;
    const durationMs = finalDurationMin * 60 * 1000;
            
    const newEndTime = new Date(newStartTime.getTime() + durationMs);

    setEvents(prev => prev.map(ev => {
        if (ev.id === item.id) {
            return {
                ...ev,
                start_time: newStartTime.toISOString(),
                end_time: newEndTime.toISOString(),
                deadline: newEndTime.toISOString(),
                duration_minutes: finalDurationMin, // Ghi nhớ duration mới 
                date: formatDateLocal(newStartTime),
            };
        }
        return ev;
    }));

    // Đồng bộ hóa bảng chỉnh sửa nếu đang mở cho chính item này
    if (editingItem && editingItem.id === item.id) {
      setEditingItem(prev => ({
        ...prev,
        start_time: newStartTime.toISOString(),
        end_time: newEndTime.toISOString(),
        date: formatDateLocal(newStartTime),
      }));
    }

    try {
      const itemId = item.id.toString().replace('event-', '').replace('task-', '');
      let payload = { start_time: newStartTime.toISOString() };
      const isEventRelated = itemType === 'event' || itemType === 'appointment';

      if (isEventRelated) {
        payload.end_time = newEndTime.toISOString();
        await updateEvent(itemId, payload);
      } else {
        payload.deadline = newEndTime.toISOString(); // Cập nhật deadline cho Task
        await updateTask(itemId, payload);
      }
      handleEventSaved();
    } catch (e) {
      console.error("Lỗi cập nhật:", e);
      handleEventSaved();
      alert("Không thể cập nhật sự kiện. Đang đồng bộ lại...");
    }
  }, [handleEventSaved]);

  React.useEffect(() => {
    setMounted(true);
    const now = getVNTime();
    setViewDate(now);
    setSelectedDate(now);
  }, []);

  const filteredEvents = React.useMemo(() => {
    return events.filter(ev => {
        const cat = ev.category || 'Mặc định';
        return visibleCategories.includes(cat);
    });
  }, [events, visibleCategories]);

  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [createModal, setCreateModal] = useState({ isOpen: false, tab: "event" });
  const [editingItem, setEditingItem] = useState(null);
  const [clickPosition, setClickPosition] = useState(null);
  const [previewEvent, setPreviewEvent] = useState(null);
  const [isPreviewDragging, setIsPreviewDragging] = useState(false);
  const [interactionState, setInteractionState] = useState(null);

  const handleInteractionUpdate = useCallback((data) => {
    setInteractionState(data);
  }, []);

  const [yearDayPopup, setYearDayPopup] = useState({ isOpen: false, date: null, position: null });
  const [lastMiniClick, setLastMiniClick] = useState(null);

  if (!mounted) {
    return (
      <div className="flex h-screen bg-white items-center justify-center">
        <div className="animate-pulse text-slate-400 font-medium text-sm">Đang tải lịch...</div>
      </div>
    );
  }

  const handleMiniDayClick = (clickedDate) => {
    const isSameDate = lastMiniClick && clickedDate.toDateString() === lastMiniClick.toDateString();
    setLastMiniClick(clickedDate);
    setSelectedDate(clickedDate);
    if (view === "Ngày") setViewDate(clickedDate);
    else if (view === "Tuần" && isSameDate) { setView("Ngày"); setViewDate(clickedDate); }
    else if (view === "Tháng" && isSameDate) { setView("Tuần"); setViewDate(clickedDate); }
    else setViewDate(clickedDate);
  };

  const handleGridClick = ({ x, y, fullDate, hour, topOffset, columnRect }) => {
    setEditingItem(null); // Reset trạng thái đang sửa để hiện form tạo mới
    let finalTop = topOffset;
    let totalMinutes = Math.round((topOffset / 64) * 60);
    
    // Nếu qua 11h tối (giờ thứ 23), fix cứng về 11h00 theo yêu cầu
    if (totalMinutes >= 1380) { // 23 * 60 = 1380
      totalMinutes = 1380;
      finalTop = 23 * 64; // 1472px
    }

    const dateWithTime = new Date(fullDate);
    dateWithTime.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);

    setClickPosition({ x, y, columnRect });
    setPreviewEvent({ fullDate: dateWithTime, top: finalTop, height: 64, type: "grid", ts: Date.now() });
    setCreateModal({ isOpen: true, tab: "event" });
    setSelectedDate(dateWithTime);
  };

  const handleInteractionEnd = ({ fullDate, topOffset, height, columnRect, isUpdate, hasMoved }) => {
    setInteractionState(null); // Kết thúc dragging
    setClickPosition(prev => ({ ...prev, columnRect, ts: Date.now() }));
    setSelectedDate(fullDate);
    
    if (height) {
      let finalHeight = height;
      // Nếu bắt đầu từ 11h đêm và kéo dài >= 1 tiếng, cap chiều cao hiển thị về 59 phút (11:59 PM)
      if (fullDate.getHours() >= 23 && Math.round((height / 64) * 60) >= 60) {
        finalHeight = (59 / 60) * 64;
      }

      setPreviewEvent(prev => ({ 
        fullDate, 
        top: topOffset, 
        height: finalHeight, 
        type: "grid", 
        ts: Date.now() 
      }));
    }

    // Không tự động mở modal sau khi kéo thả/resize, chỉ mở khi click
    // setCreateModal(prev => ({ ...prev, isOpen: true }));
  };

  const openCreate = (tab, item = null, position = null) => {
    setPreviewEvent(null);
    if (item) {
      setEditingItem(item);
      setClickPosition(position);
      setCreateModal({ isOpen: true, tab: item.event_type || tab });
      return;
    }
    setEditingItem(null);
    const ts = Date.now();
    
    // Nếu bấm nút ở sidebar (không có position), tự động quay về ngày hôm nay
    let baseDate = position?.fullDate || selectedDate || getVNTime();
    let finalTop = position?.topOffset || 0;

    let createType = position?.type || "now";
    if (!position && !item) {
        baseDate = getVNTime();
        // Nếu qua 11h tối, mặc định tạo từ đúng 11h
        if (baseDate.getHours() >= 23) {
            baseDate.setMinutes(0, 0, 0);
            finalTop = 23 * 64;
            createType = "grid"; // Chuyển sang grid để tab hiển thị đúng ở mốc 11h
        }
        setSelectedDate(baseDate); // Đồng bộ chọn ngày
        setViewDate(baseDate);    // Chuyển view về hôm nay
    }
    
    setClickPosition(position || { type: createType, topOffset: finalTop, ts });
    setPreviewEvent({ fullDate: baseDate, top: finalTop, height: 64, type: createType, ts });
    setIsCreateMenuOpen(false);
    setCreateModal({ isOpen: true, tab });
  };

  const handleYearDayClick = (date, event) => {
    const rect = event.target.getBoundingClientRect();
    setYearDayPopup({ isOpen: true, date, position: { x: rect.left + rect.width / 2, y: rect.top } });
  };

  const handleNavigateFromYearPopup = (date) => {
    setSelectedDate(date);
    setViewDate(date);
    setView("Ngày");
    setYearDayPopup({ isOpen: false, date: null, position: null });
  };

  const handleCloseModal = () => {
    setCreateModal(prev => ({ ...prev, isOpen: false }));
    setEditingItem(null);
    setPreviewEvent(null);
  };

  const handleDelete = async () => {
    if (!editingItem) return;
    try {
      const isTask = editingItem.event_type === 'task';
      const cleanId = editingItem.id.toString().replace('event-', '').replace('task-', '');
      if (isTask) await trashTask(cleanId);
      else await trashEvent(cleanId);
      handleEventSaved();
      handleCloseModal();
    } catch (e) {
      console.error("Lỗi xóa:", e);
      alert("Không thể xóa. Vui lòng thử lại sau.");
    }
  };

  return (
    <div className="flex h-screen bg-white text-slate-800 font-sans overflow-hidden">
      <aside className="w-80 flex-shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col z-30 relative shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Lịch Của Tôi</span>
        </div>

        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
          <div className="relative mb-8">
            <button onClick={() => setIsCreateMenuOpen(v => !v)} className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-sm active:scale-95">
              <Plus className="w-5 h-5 mr-2" /> Tạo mới
            </button>
            {isCreateMenuOpen && (
              <div className="absolute top-14 left-0 w-full bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                <button onClick={() => openCreate("event")} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center text-sm text-slate-700">
                  <CalendarIcon className="w-4 h-4 mr-3 text-blue-500" /> Sự kiện
                </button>
                <button onClick={() => openCreate("task")} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center text-sm text-slate-700">
                  <CheckSquare className="w-4 h-4 mr-3 text-emerald-500" /> Việc cần làm
                </button>
                <button onClick={() => openCreate("appointment")} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center text-sm text-slate-700">
                  <Clock className="w-4 h-4 mr-3 text-purple-500" /> Lên lịch hẹn
                </button>
              </div>
            )}
          </div>

          <MiniCalendar onDayClick={handleMiniDayClick} viewDate={viewDate} selectedDate={selectedDate} events={filteredEvents} />
          <hr className="border-slate-200 my-6" />

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Lịch của tôi</h3>
            <div className="space-y-2">
              {CALENDAR_CATEGORIES.map(cat => (
                <label key={cat.value} className="flex items-center space-x-3 cursor-pointer group px-1 py-1 rounded-md hover:bg-slate-100 transition-colors">
                  <input type="checkbox" checked={visibleCategories.includes(cat.value)} onChange={() => setVisibleCategories(prev => prev.includes(cat.value) ? prev.filter(v => v !== cat.value) : [...prev, cat.value])} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-x-auto overflow-y-hidden bg-white relative z-20">
        <Calendar
          view={view} setView={setView} viewDate={viewDate} setViewDate={setViewDate}
          selectedDate={selectedDate} setSelectedDate={setSelectedDate}
          onOpenCreate={openCreate} onGridClick={handleGridClick}
          previewEvent={previewEvent} setPreviewEvent={setPreviewEvent}
          setIsPreviewDragging={setIsPreviewDragging} 
          onInteractionUpdate={handleInteractionUpdate}
          onInteractionEnd={handleInteractionEnd}
          onYearDayClick={handleYearDayClick} events={filteredEvents} onEventUpdate={handleGlobalEventUpdate}
        />
      </main>

      <CreateModal
        isOpen={createModal.isOpen} initialTab={createModal.tab} editingItem={editingItem}
        position={clickPosition} initialDate={selectedDate} onClose={handleCloseModal}
        onSaved={handleEventSaved} onDelete={handleDelete}
        view={view} previewEvent={previewEvent} interactionState={interactionState}
      />

      <YearDayPopup
        key={yearDayPopup.date?.toDateString() || "none"}
        isOpen={yearDayPopup.isOpen} date={yearDayPopup.date} position={yearDayPopup.position}
        onClose={() => setYearDayPopup({ ...yearDayPopup, isOpen: false })}
        onNavigateToDay={handleNavigateFromYearPopup}
        events={events.filter(ev => formatDateLocal(new Date(ev.start_time)) === formatDateLocal(yearDayPopup.date))}
        onEventClick={(ev, e) => {
          const pos = e ? { x: e.clientX, y: e.clientY } : null;
          openCreate(ev.event_type || 'event', ev, pos);
        }}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; border: 2px solid transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
      `}} />
    </div>
  );
}
