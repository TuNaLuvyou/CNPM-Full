import React, { useState, useEffect, useCallback } from "react";
import { CheckSquare, Plus, CheckCircle2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import TaskItem from "@/components/ui/TaskItem";
import { getTasks, createTask, toggleTask, trashTask } from "@/lib/api";
import { t } from "@/lib/i18n";

export default function TasksPanel({ appSettings }) {
  const lang = appSettings?.language || "vi";
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [showDoneTasks, setShowDoneTasks] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Tải tasks từ API khi mount ──
  const fetchTasks = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getTasks();
      setTasks(data);
      setError(null);
    } catch (e) {
      if (!e.isLocalGuard) {
        setError(t('tasks_panel.loading_error', lang) || "Không thể tải danh sách công việc.");
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ── Thêm task mới ──
  const addTask = async () => {
    if (!newTask.trim()) return;
    const optimistic = {
      id: `tmp-${Date.now()}`,
      title: newTask.trim(),
      is_completed: false,
      _saving: true,
    };
    setTasks((prev) => [...prev, optimistic]);
    setNewTask("");
    try {
      const saved = await createTask({ title: optimistic.title });
      setTasks((prev) => prev.map((t) => (t.id === optimistic.id ? saved : t)));
    } catch (e) {
      setTasks((prev) => prev.filter((t) => t.id !== optimistic.id));
      alert(t('tasks_panel.add_error', lang) || "Không thể thêm công việc: " + e.message);
    }
  };

  // ── Toggle hoàn thành ──
  const handleToggle = async (id) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_completed: !t.is_completed } : t))
    );
    try {
      const updated = await toggleTask(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (e) {
      // Revert nếu lỗi
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_completed: !t.is_completed } : t))
      );
    }
  };

  // ── Xoá (đưa vào thùng rác) ──
  const handleDelete = async (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await trashTask(id);
    } catch (e) {
      // Reload nếu lỗi
      fetchTasks();
    }
  };

  // Chuyển đổi format API → TaskItem đang dùng
  const normalizeTask = (t) => ({
    id: t.id,
    text: t.title,
    done: t.is_completed,
    due: t.deadline_display || t.date_display || null,
    _saving: t._saving,
  });

  const pending = tasks.filter((t) => !t.is_completed).map(normalizeTask);
  const done = tasks.filter((t) => t.is_completed).map(normalizeTask);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3 border-b border-slate-100 sticky top-0 bg-white z-10">
        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-blue-600" /> {t('sidebar_tools.tasks', lang)}
        </h2>
      </div>

      {/* Add task */}
      <div className="px-3 py-2 border-b border-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-transparent focus-within:border-blue-300 transition-colors">
          <Plus className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder={t('tasks_panel.add_placeholder', lang)}
            className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder-slate-400"
          />
          {newTask && (
            <button
              onClick={addTask}
              className="text-blue-600 hover:text-blue-700 text-xs font-semibold"
            >
              {t('tasks_panel.add', lang) || "Thêm"}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-32 gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">{t('loading', lang)}</span>
          </div>
        ) : !localStorage.getItem('token') ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2 px-6 text-center">
              <CheckSquare className="w-8 h-8 opacity-20" />
              <p className="text-xs font-bold text-slate-500">{t('user.login_required', lang)}</p>
              <p className="text-[10px] text-slate-400">Bạn cần đăng nhập để quản lý công việc và đồng bộ hóa.</p>
            </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 text-red-400 gap-2 px-4 text-center">
            <p className="text-xs">{error}</p>
            <button onClick={fetchTasks} className="text-xs text-blue-500 underline">{t('retry', lang)}</button>
          </div>
        ) : pending.length === 0 && done.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2">
            <CheckCircle2 className="w-8 h-8 text-slate-200" />
            <p className="text-xs">{t('tasks_panel.no_tasks', lang)}</p>
          </div>
        ) : (
          <>
            {pending.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onDelete={handleDelete}
                appSettings={appSettings}
              />
            ))}

            {done.length > 0 && appSettings.showCompletedTasks !== false && (
              <>
                <button
                  onClick={() => setShowDoneTasks((v) => !v)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-500 font-semibold hover:bg-slate-50 border-t border-slate-100 transition sticky top-0 bg-white"
                >
                  {showDoneTasks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {t('tasks_panel.completed_count', lang, [done.length])}
                </button>
                {showDoneTasks &&
                  done.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      appSettings={appSettings}
                    />
                  ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
