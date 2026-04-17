import React, { useState, useEffect, useCallback } from "react";
import { Lightbulb, Plus, Loader2 } from "lucide-react";
import NoteCard from "@/components/ui/NoteCard";
import { getNotes, createNote, togglePinNote, deleteNote } from "@/lib/api";
import { t } from "@/lib/i18n";

export default function KeepPanel({ appSettings }) {
  const lang = appSettings?.language || "vi";
  const [notes, setNotes] = useState([]);
  const [addingNote, setAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Tải notes từ API ──
  const fetchNotes = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getNotes();
      setNotes(data);
      setError(null);
    } catch (e) {
      if (!e.isLocalGuard) {
        setError(t('keep_panel.loading_error', lang) || "Không thể tải ghi chú.");
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // ── Thêm note ──
  const addNote = async () => {
    if (!newNoteContent.trim() && !newNoteTitle.trim()) return;
    const payload = {
      title: newNoteTitle || t('keep_panel.default_title', lang),
      content: newNoteContent,
      color: "#fef9c3",
      is_pinned: false,
    };
    try {
      const saved = await createNote(payload);
      setNotes((prev) => [saved, ...prev]);
      setNewNoteTitle("");
      setNewNoteContent("");
      setAddingNote(false);
    } catch (e) {
      alert(t('keep_panel.save_error', lang) || "Không thể lưu ghi chú: " + e.message);
    }
  };

  // ── Xoá note ──
  const handleDelete = async (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNote(id);
    } catch (e) {
      fetchNotes();
    }
  };

  // ── Toggle ghim ──
  const handleTogglePin = async (id) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_pinned: !n.is_pinned } : n))
    );
    try {
      const updated = await togglePinNote(id);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (e) {
      fetchNotes();
    }
  };

  // Chuyển format API → NoteCard (dùng pinned thay vì is_pinned)
  const normalizeNote = (n) => ({ ...n, pinned: n.is_pinned });

  const pinned = notes.filter((n) => n.is_pinned).map(normalizeNote);
  const unpinned = notes.filter((n) => !n.is_pinned).map(normalizeNote);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-500" /> {t('sidebar_tools.keep', lang)}
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
            placeholder={t('keep_panel.title_placeholder', lang)}
            className="w-full px-3 py-2 text-sm font-semibold text-slate-700 placeholder-slate-400 outline-none border-b border-slate-100 bg-white"
          />
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder={t('keep_panel.content_placeholder', lang)}
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
              {t('cancel', lang)}
            </button>
            <button
              onClick={addNote}
              className="text-xs text-blue-600 hover:text-white hover:bg-blue-600 font-semibold px-3 py-1.5 rounded-lg transition"
            >
              {t('save', lang)}
            </button>
          </div>
        </div>
      )}

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32 gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">{t('loading', lang)}</span>
          </div>
        ) : !localStorage.getItem('token') ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2 px-6 text-center">
              <Lightbulb className="w-8 h-8 opacity-20" />
              <p className="text-xs font-bold text-slate-500">{t('user.login_required', lang)}</p>
              <p className="text-[10px] text-slate-400">Bạn cần đăng nhập để tạo và xem các ghi chú cá nhân.</p>
            </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 text-red-400 gap-2 px-4 text-center">
            <p className="text-xs">{error}</p>
            <button onClick={fetchNotes} className="text-xs text-blue-500 underline">{t('retry', lang)}</button>
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  {t('keep_panel.pinned', lang)}
                </p>
                <div className="grid gap-2">
                  {pinned.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onDelete={handleDelete}
                      onTogglePin={handleTogglePin}
                    />
                  ))}
                </div>
              </div>
            )}

            {unpinned.length > 0 && (
              <div className="space-y-2 pt-2">
                {pinned.length > 0 && (
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    {t('keep_panel.other', lang)}
                  </p>
                )}
                <div className="grid gap-2">
                  {unpinned.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onDelete={handleDelete}
                      onTogglePin={handleTogglePin}
                    />
                  ))}
                </div>
              </div>
            )}

            {notes.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                <Lightbulb className="w-10 h-10 text-slate-200" />
                <p className="text-xs font-medium">{t('keep_panel.no_notes', lang)}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
