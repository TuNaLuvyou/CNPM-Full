import React, { useState } from "react";
import { CheckSquare, Plus, CheckCircle2, ChevronUp, ChevronDown } from "lucide-react";
import TaskItem from "@/components/ui/TaskItem";

const MOCK_TASKS = [
  { id: 1, text: "Hoàn thành báo cáo Q2", done: false, due: "Hôm nay" },
  { id: 2, text: "Review PR của team", done: false, due: "Ngày mai" },
  { id: 3, text: "Họp với khách hàng ABC", done: false, due: "16/04" },
  { id: 4, text: "Cập nhật tài liệu API", done: true, due: null },
  { id: 5, text: "Gửi email xác nhận", done: true, due: null },
];

export default function TasksPanel() {
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [newTask, setNewTask] = useState("");
  const [showDoneTasks, setShowDoneTasks] = useState(false);

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: Date.now(), text: newTask.trim(), done: false, due: null },
    ]);
    setNewTask("");
  };

  const toggleTask = (id) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );

  const deleteTask = (id) =>
    setTasks((prev) => prev.filter((t) => t.id !== id));

  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3 border-b border-slate-100 sticky top-0 bg-white z-10">
        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-blue-600" /> Google Tasks
        </h2>
      </div>
      
      {/* Add task header */}
      <div className="px-3 py-2 border-b border-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-transparent focus-within:border-blue-300 transition-colors">
          <Plus className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Thêm công việc..."
            className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder-slate-400"
          />
          {newTask && (
            <button
              onClick={addTask}
              className="text-blue-600 hover:text-blue-700 text-xs font-semibold"
            >
              Thêm
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {pending.length === 0 && done.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2">
            <CheckCircle2 className="w-8 h-8 text-slate-200" />
            <p className="text-xs">Không có công việc nào</p>
          </div>
        ) : (
          <>
            {pending.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
              />
            ))}
            
            {done.length > 0 && (
              <>
                <button
                  onClick={() => setShowDoneTasks((v) => !v)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-500 font-semibold hover:bg-slate-50 border-t border-slate-100 transition sticky top-0 bg-white"
                >
                  {showDoneTasks ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                  Đã hoàn thành ({done.length})
                </button>
                {showDoneTasks &&
                  done.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
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
