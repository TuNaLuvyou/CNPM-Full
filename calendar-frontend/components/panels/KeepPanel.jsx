import React, { useState } from "react";
import { Lightbulb, Plus } from "lucide-react";
import NoteCard from "@/components/ui/NoteCard";

const MOCK_NOTES = [
  {
    id: 1,
    title: "Ý tưởng dự án",
    content: "Tích hợp AI vào workflow để tự động hóa lịch họp...",
    color: "#fef08a",
    pinned: true,
  },
  {
    id: 2,
    title: "Danh sách mua sắm",
    content: "Sữa, bánh mì, trứng, rau củ, nước suối",
    color: "#bbf7d0",
    pinned: false,
  },
  {
    id: 3,
    title: "Meeting notes",
    content: "Sprint planning: tập trung vào auth flow và dashboard",
    color: "#bfdbfe",
    pinned: false,
  },
];

export default function KeepPanel() {
  const [notes, setNotes] = useState(MOCK_NOTES);
  const [addingNote, setAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  const addNote = () => {
    if (!newNoteContent.trim() && !newNoteTitle.trim()) return;
    setNotes((prev) => [
      {
        id: Date.now(),
        title: newNoteTitle || "Ghi chú mới",
        content: newNoteContent,
        color: "#fef9c3",
        pinned: false,
      },
      ...prev,
    ]);
    setNewNoteTitle("");
    setNewNoteContent("");
    setAddingNote(false);
  };

  const deleteNote = (id) => setNotes((prev) => prev.filter((n) => n.id !== id));
  
  const togglePinNote = (id) =>
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
    );

  const pinned = notes.filter((n) => n.pinned);
  const unpinned = notes.filter((n) => !n.pinned);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-500" /> Google Keep
        </h2>
        <button
          onClick={() => setAddingNote((v) => !v)}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      {/* Add note form */}
      {addingNote && (
        <div className="mx-3 my-2 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <input
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder="Tiêu đề"
            className="w-full px-3 py-2 text-sm font-semibold text-slate-700 placeholder-slate-400 outline-none border-b border-slate-100 bg-white"
          />
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Nhập ghi chú..."
            rows={3}
            className="w-full px-3 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none resize-none bg-white"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2 px-3 py-1.5 bg-slate-50 border-t border-slate-100">
            <button
              onClick={() => {
                setAddingNote(false);
                setNewNoteTitle("");
                setNewNoteContent("");
              }}
              className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg transition font-medium"
            >
              Hủy
            </button>
            <button
              onClick={addNote}
              className="text-xs text-blue-600 hover:text-white hover:bg-blue-600 font-semibold px-3 py-1.5 rounded-lg transition"
            >
              Lưu
            </button>
          </div>
        </div>
      )}
      
      {/* Notes list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-3">
        {pinned.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Đã ghim
            </p>
            <div className="grid gap-2">
              {pinned.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onDelete={deleteNote}
                  onTogglePin={togglePinNote}
                />
              ))}
            </div>
          </div>
        )}
        
        {unpinned.length > 0 && (
          <div className="space-y-2 pt-2">
            {pinned.length > 0 && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Khác
              </p>
            )}
            <div className="grid gap-2">
              {unpinned.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onDelete={deleteNote}
                  onTogglePin={togglePinNote}
                />
              ))}
            </div>
          </div>
        )}
        
        {notes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
            <Lightbulb className="w-10 h-10 text-slate-200" />
            <p className="text-xs font-medium">Chưa có ghi chú nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
