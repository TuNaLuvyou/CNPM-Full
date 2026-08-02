import React from "react";
import { Pin, Trash2 } from "lucide-react";

export default function NoteCard({ note, onDelete, onTogglePin }) {
  return (
    <div
      style={{ backgroundColor: note.color }}
      className="group relative p-3 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden border border-transparent hover:border-black/5"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-sm font-bold text-slate-800 dark:text-[#f5f5f5] line-clamp-1">{note.title}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(note.id);
          }}
          className={`shrink-0 p-1 rounded-lg transition ${
            note.pinned
              ? "text-slate-800 dark:text-[#f5f5f5] opacity-100 bg-black/5"
              : "text-slate-500 dark:text-[#9e9e9e] opacity-0 group-hover:opacity-100 hover:bg-black/5 hover:text-slate-800 dark:hover:text-[#f5f5f5]"
          }`}
        >
          <Pin className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-xs text-slate-700 dark:text-[#e3e3e3] whitespace-pre-wrap leading-relaxed line-clamp-4">
        {note.content}
      </p>

      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 backdrop-blur-sm rounded-lg p-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="p-1.5 text-slate-600 dark:text-[#bdbdbd] hover:text-red-600 rounded-md hover:bg-white dark:hover:bg-[#353535] dark:bg-[#2d2d2d] transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
