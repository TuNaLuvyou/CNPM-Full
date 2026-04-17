"use client";
import React, { useState, useCallback, useEffect } from "react";
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
import { getLocalizedTime, getVNTime, formatDateLocal, buildWeekDays, buildMonthCells, DAY_NAMES, MONTH_NAMES } from "@/lib/CalendarHelper";
import { getEvents, getTasks, updateEvent, updateTask, toggleTask, trashEvent, trashTask,
  getMe, getTrashedEvents, getTrashedTasks, restoreEvent, permanentDeleteEvent, restoreTask, permanentDeleteTask,
  getNotifications
} from "@/lib/api";
import { CALENDAR_CATEGORIES } from "@/components/forms/FormHelpers";
import AuthModal from "@/components/modals/AuthModal";
import TrashModal from "@/components/modals/TrashModal";
import SettingsModal from "@/components/modals/SettingsModal";
import { t } from "@/lib/i18n";

export default function CalendarApp() {
  const [mounted, setMounted] = React.useState(false);

  // ── visible categories ──
  const [visibleCategories, setVisibleCategories] = useState([]);
  

  // ── Shared calendar state ──
  const [view, setView] = React.useState("Tuần");
  const [viewDate, setViewDate] = React.useState(() => getVNTime());
  const [selectedDate, setSelectedDate] = React.useState(() => getVNTime());

  // ── Events state ──
  const [events, setEvents] = React.useState([]);

  // ── Global UI state (Lifted from Calendar.jsx) ──
  const [currentUser, setCurrentUser] = useState(null);
  const [authModal, setAuthModal] = useState({ isOpen: false, type: "login" });
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [deletedItems, setDeletedItems] = useState([]);

  // ── Global App Settings ──
  const [appSettings, setAppSettings] = useState({
    language: "vi",
    country: "VN",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    showSecondaryTimezone: false,
    primaryTimezone: "Asia/Ho_Chi_Minh",
    secondaryTimezone: "America/New_York",
    notificationType: "screen",
    notificationMinutes: 10,
    showWeekends: true,
    showCompletedTasks: true,
    weekStartDay: "monday",
    vietnamHolidays: true,
    worldHolidays: false,
    otherHolidays: false,
    customHolidays: [],
    customCategories: ["Mặc định", "Công việc", "Gia đình", "Cá nhân"],
  });

  const [visibleHolidays, setVisibleHolidays] = useState(["vietnam", "world", "other"]);

  // Sync visibleCategories with appSettings.customCategories when they change
  useEffect(() => {
    if (appSettings.customCategories) {
      setVisibleCategories(appSettings.customCategories);
    }
  }, [appSettings.customCategories?.length]);

  // Sync visibleHolidays with appSettings.customHolidays
  useEffect(() => {
    if (appSettings.customHolidays) {
      const holidayIds = appSettings.customHolidays.map(h => h.id);
      setVisibleHolidays(prev => {
        // Keep presets + existing valid custom IDs + any newly added IDs
        const presets = prev.filter(id => ["vietnam", "world", "other"].includes(id));
        const validCustomIds = prev.filter(id => holidayIds.includes(id));
        const newIds = holidayIds.filter(id => !prev.includes(id));
        return [...presets, ...validCustomIds, ...newIds];
      });
    }
  }, [appSettings.customHolidays?.length]);

  // ── Trigger reload Calendar khi save event/task ──
  const [eventSavedTick, setEventSavedTick] = useState(0);

  // ── Notifications state (Lifted from Header) ──
  const [notifications, setNotifications] = useState([]);
  const notifiedEventsRef = React.useRef(new Set());

  // Persistence for settings
  useEffect(() => {
    const saved = localStorage.getItem("appSettings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAppSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const handleSaveSettings = (newSettings) => {
    setAppSettings(newSettings);
    localStorage.setItem("appSettings", JSON.stringify(newSettings));
  };

  const fetchEvents = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

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
          const end = new Date(t.end_time || t.deadline_time || t.start_time);
          const deadlineRaw = t.deadline_time || t.deadline_display;
          const duration = !isNaN(start) && !isNaN(end) ? Math.round((end - start) / 60000) : 60;
          return {
            ...t,
            event_type: 'task',
            duration_minutes: duration,
            end_time: t.end_time || t.deadline_time || t.start_time,
            deadline: deadlineRaw,
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

  // ── Khôi phục session & Trash logic (Lifted from Calendar.jsx) ──
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      getMe()
        .then(user => setCurrentUser(user))
        .catch(() => {
          if (typeof window !== "undefined") localStorage.removeItem("token");
        });
    }
  }, []);

  const fetchTrash = useCallback(async () => {
    try {
      const [trashedEvents, trashedTasks] = await Promise.all([
        getTrashedEvents(),
        getTrashedTasks(),
      ]);
      const items = [
        ...(Array.isArray(trashedEvents) ? trashedEvents : []).map(e => ({
          id: `event-${e.id}`, _id: e.id, type: "event",
          title: e.title, date: e.date_display, deletedAt: e.deleted_at
        })),
        ...(Array.isArray(trashedTasks) ? trashedTasks : []).map(t => ({
          id: `task-${t.id}`, _id: t.id, type: "task",
          title: t.title, date: t.date_display, deletedAt: t.deleted_at
        })),
      ];
      setDeletedItems(items);
    } catch (e) {
      console.error("Không thể tải thùng rác:", e);
    }
  }, []);

  const handleOpenTrash = () => {
    fetchTrash();
    setIsTrashOpen(true);
  };

  const fetchNotifs = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await getNotifications();
      // Chuyển đổi format BE -> FE nếu cần
      const formatted = data.map(n => ({
        id: n.id,
        type: n.event ? 'event' : 'task',
        ntype: n.ntype,
        title: n.ntype === 'invite' ? t('invitation_found', appSettings.language) : 
               n.ntype === 'friend_request' ? t('contacts_panel.friend_request_title', appSettings.language) :
               n.ntype === 'friend_accepted' ? t('contacts_panel.friend_accepted_title', appSettings.language) :
               n.content,
        is_read: n.is_read,
        event: n.event,
        time: n.created_at
      }));
      setNotifications(formatted);
    } catch (e) {
      console.error("Lỗi lấy thông báo:", e);
    }
  }, [currentUser, appSettings.language]);

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000); // Poll mỗi 30s để giảm tải server
    return () => clearInterval(id);
  }, [fetchNotifs]);

  const handleRestore = async (compositeId) => {
    const item = deletedItems.find(i => i.id === compositeId);
    if (!item) return;
    try {
      if (item.type === "event") await restoreEvent(item._id);
      else if (item.type === "task") await restoreTask(item._id);
      setDeletedItems(prev => prev.filter(i => i.id !== compositeId));
      fetchEvents();
    } catch (e) {
      alert("Không thể khôi phục: " + e.message);
    }
  };

  const handlePermanentDelete = async (compositeId) => {
    const item = deletedItems.find(i => i.id === compositeId);
    if (!item) return;
    try {
      if (item.type === "event") await permanentDeleteEvent(item._id);
      else if (item.type === "task") await permanentDeleteTask(item._id);
      setDeletedItems(prev => prev.filter(i => i.id !== compositeId));
    } catch (e) {
      alert("Không thể xóa: " + e.message);
    }
  };

  const handleClearAllTrash = async () => {
    try {
      await Promise.all(
        deletedItems.map(item =>
          item.type === "event"
            ? permanentDeleteEvent(item._id)
            : permanentDeleteTask(item._id)
        )
      );
      setDeletedItems([]);
    } catch (e) {
      alert("Không thể xóa tất cả: " + e.message);
    }
  };

  const handleEventSaved = useCallback(() => {
    setEventSavedTick(t => t + 1);
  }, []);

  const handleToggleTask = async (compositeId) => {
    try {
      const cleanId = compositeId.toString().replace('task-', '');
      await toggleTask(cleanId);
      handleEventSaved(); // Refresh UI
    } catch (e) {
      console.error("Lỗi toggle task:", e);
    }
  };

  const handleGlobalEventUpdate = useCallback(async (item, newStartTime, newDurationMin) => {
    const itemType = item.event_type || 'event';
    
    // Sử dụng độ dài mới (từ resize) hoặc độ dài cũ (từ item) hoặc mặc định 1h
    const finalDurationMin = newDurationMin || item.duration_minutes || 60;
    const durationMs = finalDurationMin * 60 * 1000;
            
    const newEndTime = new Date(newStartTime.getTime() + durationMs);

    setEvents(prev => prev.map(ev => {
        if (ev.id === item.id) {
            const isTask = itemType === 'task';
            return {
                ...ev,
                start_time: newStartTime.toISOString(),
                end_time: newEndTime.toISOString(),
                deadline: isTask ? newEndTime.toISOString() : ev.deadline,
                duration_minutes: finalDurationMin,
                date: formatDateLocal(newStartTime),
                // Update display strings for forms if they exist
                time_display: newStartTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }),
                time_start_display: newStartTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }),
                time_end_display: newEndTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }),
                deadline_display: `${formatDateLocal(newEndTime)} ${newEndTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })}`,
                date_display: formatDateLocal(newStartTime),
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
        deadline: itemType === 'task' ? newEndTime.toISOString() : (prev.deadline),
        date: formatDateLocal(newStartTime),
        duration_minutes: finalDurationMin,
        // Update display strings for forms
        time_display: newStartTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }),
        time_start_display: newStartTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }),
        time_end_display: newEndTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }),
        deadline_display: `${formatDateLocal(newEndTime)} ${newEndTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })}`,
        date_display: formatDateLocal(newStartTime),
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
        payload.end_time = newEndTime.toISOString(); // Cập nhật block thời gian cho Task (giống Sự kiện)
        await updateTask(itemId, payload);
      }
      // KHÔNG gọi handleEventSaved() ở đây để tránh re-fetch ghi đè optimistic update.
      // Dữ liệu đã được cập nhật trên UI optimistically ở trên.
    } catch (e) {
      console.error("Lỗi cập nhật:", e);
      // Chỉ re-fetch khi có lỗi để khôi phục trạng thái đúng từ server
      handleEventSaved();
      alert("Không thể cập nhật sự kiện. Đang đồng bộ lại...");
    }
  }, [handleEventSaved]);

  // ── Notification Reminder Engine ──
  useEffect(() => {
    if (appSettings.notificationType === "off") return;

    const checkReminders = () => {
        const now = getVNTime();
        const reminderWindowMs = appSettings.notificationMinutes * 60 * 1000;
        
        const upcoming = events.filter(ev => {
            if (ev.is_completed || notifiedEventsRef.current.has(ev.id)) return false;
            const startTime = new Date(ev.start_time);
            const timeDiff = startTime - now;
            // Trả về true nếu sự kiện sắp diễn ra trong khoảng reminderWindow
            return timeDiff > 0 && timeDiff <= reminderWindowMs;
        });

        if (upcoming.length > 0) {
            const newNotifs = upcoming.map(ev => ({
                id: `remind-${ev.id}-${Date.now()}`,
                type: ev.event_type || "event",
                title: `${ev.title}`,
                desc: t('upcoming_start', appSettings.language, [appSettings.notificationMinutes]),
                read: false,
                timestamp: new Date()
            }));

            setNotifications(prev => [...newNotifs, ...prev]);
            upcoming.forEach(ev => notifiedEventsRef.current.add(ev.id));
        }
    };

    const interval = setInterval(checkReminders, 30000); // Check mỗi 30s
    return () => clearInterval(interval);
  }, [events, appSettings]);

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

  // Giữ editingItem luôn tươi mới nếu data background thay đổi (Move to after initialization)
  useEffect(() => {
    if (editingItem) {
      const fresh = events.find(ev => ev.id === editingItem.id);
      if (fresh && JSON.stringify(fresh.invitations) !== JSON.stringify(editingItem.invitations)) {
        setEditingItem(fresh);
      }
    }
  }, [events, editingItem]);
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

  // Filter events based on settings (Completed tasks, Categories, etc.)
  const filteredEventsForComponents = events.filter(ev => {
    // 1. Task completion filter
    if (ev.event_type === 'task' && ev.is_completed && !appSettings.showCompletedTasks) return false;

    // 2. Category visibility filter
    // If an event has a category, it must be in visibleCategories
    if (ev.category && !visibleCategories.includes(ev.category)) return false;

    // 3. (Optional) Holiday filters can be added here if holidays are represented as events
    
    return true;
  });

  return (
    <div className="flex h-screen bg-white text-slate-800 font-sans overflow-hidden">
      <aside className="w-80 flex-shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col relative shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            {t('app_name', appSettings.language)}
          </span>
        </div>

        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
          <div className="relative mb-8">
            <button onClick={() => setIsCreateMenuOpen(v => !v)} className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-sm active:scale-95">
              <Plus className="w-5 h-5 mr-2" /> {t('create', appSettings.language)}
            </button>
            {isCreateMenuOpen && (
              <div className="absolute top-14 left-0 w-full bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                <button onClick={() => openCreate("event")} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center text-sm text-slate-700">
                  <CalendarIcon className="w-4 h-4 mr-3 text-blue-500" /> {t('event', appSettings.language)}
                </button>
                <button onClick={() => openCreate("task")} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center text-sm text-slate-700">
                  <CheckSquare className="w-4 h-4 mr-3 text-emerald-500" /> {t('task', appSettings.language)}
                </button>
                <button onClick={() => openCreate("appointment")} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center text-sm text-slate-700">
                  <Clock className="w-4 h-4 mr-3 text-purple-500" /> {t('appointment', appSettings.language)}
                </button>
              </div>
            )}
          </div>

          <MiniCalendar 
            onDayClick={handleMiniDayClick} 
            viewDate={viewDate} 
            selectedDate={selectedDate} 
            events={filteredEventsForComponents}
            appSettings={appSettings}
          />
          <hr className="border-slate-200 my-6" />

          <div className="mt-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">{t('my_calendars_title', appSettings.language)}</h3>
            <div className="space-y-2">
              {/* Dynamic Categories */}
              {(appSettings.customCategories || []).map(catName => (
                <label key={catName} className="flex items-center space-x-3 cursor-pointer group px-1 py-1 rounded-md hover:bg-slate-100 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={visibleCategories.includes(catName)} 
                    onChange={() => setVisibleCategories(prev => prev.includes(catName) ? prev.filter(v => v !== catName) : [...prev, catName])} 
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" 
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                    {catName}
                  </span>
                </label>
              ))}

              <hr className="border-slate-100 my-2" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">{t('holidays_title', appSettings.language)}</h3>

              {/* Holiday Calendars (Conditional on Settings) */}
              <div className="space-y-2">
                {appSettings.vietnamHolidays && (
                  <label className="flex items-center space-x-3 cursor-pointer group px-1 py-1 rounded-md hover:bg-slate-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={visibleHolidays.includes("vietnam")} 
                      onChange={() => setVisibleHolidays(prev => prev.includes("vietnam") ? prev.filter(v => v !== "vietnam") : [...prev, "vietnam"])} 
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" 
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                      {t('fav_calendars.vn_holidays', appSettings.language)}
                    </span>
                  </label>
                )}

                {appSettings.worldHolidays && (
                  <label className="flex items-center space-x-3 cursor-pointer group px-1 py-1 rounded-md hover:bg-slate-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={visibleHolidays.includes("world")} 
                      onChange={() => setVisibleHolidays(prev => prev.includes("world") ? prev.filter(v => v !== "world") : [...prev, "world"])} 
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" 
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                      {t('fav_calendars.world_holidays', appSettings.language)}
                    </span>
                  </label>
                )}

                {appSettings.otherHolidays && (
                  <label className="flex items-center space-x-3 cursor-pointer group px-1 py-1 rounded-md hover:bg-slate-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={visibleHolidays.includes("other")} 
                      onChange={() => setVisibleHolidays(prev => prev.includes("other") ? prev.filter(v => v !== "other") : [...prev, "other"])} 
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" 
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                      {t('fav_calendars.other_holidays', appSettings.language)}
                    </span>
                  </label>
                )}

                {appSettings.customHolidays?.map(h => (
                  <label key={h.id} className="flex items-center space-x-3 cursor-pointer group px-1 py-1 rounded-md hover:bg-slate-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={visibleHolidays.includes(h.id)} 
                      onChange={() => setVisibleHolidays(prev => prev.includes(h.id) ? prev.filter(v => v !== h.id) : [...prev, h.id])} 
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" 
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                      {h.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-x-auto overflow-y-hidden bg-white relative">
        <Calendar
          view={view} setView={setView} viewDate={viewDate} setViewDate={setViewDate}
          selectedDate={selectedDate} setSelectedDate={setSelectedDate}
          onOpenCreate={openCreate} onGridClick={handleGridClick}
          previewEvent={previewEvent} setPreviewEvent={setPreviewEvent}
          setIsPreviewDragging={setIsPreviewDragging} 
          onInteractionUpdate={handleInteractionUpdate}
          onInteractionEnd={handleInteractionEnd}
          onYearDayClick={handleYearDayClick} events={filteredEvents} onEventUpdate={handleGlobalEventUpdate}
          onToggleTask={handleToggleTask}
          currentUser={currentUser} setCurrentUser={setCurrentUser} setAuthModal={setAuthModal}
          setIsSettingsModalOpen={setIsSettingsModalOpen} setIsTrashOpen={handleOpenTrash}
          deletedItems={deletedItems}
          notifications={notifications} setNotifications={setNotifications}
          appSettings={appSettings}
          setEventSavedTick={setEventSavedTick}
        />
      </main>

      <CreateModal
        isOpen={createModal.isOpen} initialTab={createModal.tab} editingItem={editingItem}
        position={clickPosition} initialDate={selectedDate} onClose={handleCloseModal}
        onSaved={handleEventSaved} onDelete={handleDelete}
        view={view} previewEvent={previewEvent} interactionState={interactionState}
        appSettings={appSettings}
        currentUser={currentUser}
      />

      <YearDayPopup
        key={yearDayPopup.date?.toDateString() || "none"}
        isOpen={yearDayPopup.isOpen} date={yearDayPopup.date} position={yearDayPopup.position}
        onClose={() => setYearDayPopup({ ...yearDayPopup, isOpen: false })}
        onNavigateToDay={handleNavigateFromYearPopup}
        appSettings={appSettings}
        events={events.filter(ev => formatDateLocal(new Date(ev.start_time)) === formatDateLocal(yearDayPopup.date))}
        onEventClick={(ev, e) => {
          const pos = e ? { x: e.clientX, y: e.clientY } : null;
          openCreate(ev.event_type || 'event', ev, pos);
        }}
      />

      {/* Global Modals (Relocated for proper backdrop blur and stacking) */}
      <AuthModal
        isOpen={authModal.isOpen}
        type={authModal.type}
        onClose={() => setAuthModal((p) => ({ ...p, isOpen: false }))}
        onSwitchType={(newType) => setAuthModal((p) => ({ ...p, type: newType }))}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setAuthModal({ isOpen: false, type: "login" });
        }}
      />

      <TrashModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        deletedItems={deletedItems}
        onRestore={handleRestore}
        onPermanentDelete={handlePermanentDelete}
        onClearAll={handleClearAllTrash}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={appSettings}
        onSave={handleSaveSettings}
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
