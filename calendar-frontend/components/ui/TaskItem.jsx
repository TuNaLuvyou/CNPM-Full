import React from "react";
import { CheckCircle2, Circle, X } from "lucide-react";

export default function TaskItem({ task, onToggle, onDelete }) {
  return (
    <div
      className={`group flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 transition ${
        task.done ? "opacity-60" : "border-b border-slate-50 last:border-0"
      }`}
    >
      <button onClick={() => onToggle(task.id)} className="mt-0.5 flex-shrink-0">
        {task.done ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : (
          <Circle className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${task.done ? "text-slate-500 line-through" : "text-slate-700"}`}>
          {task.text}
        </p>
        {task.due && <p className="text-xs text-slate-400 mt-0.5">{task.due}</p>}
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 transition text-slate-300 hover:text-red-400 flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
