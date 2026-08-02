"use client";
import React, { useState, useEffect, useRef } from "react";
import { Plus, X, Loader2, GripVertical } from "lucide-react";
import { t } from "@/lib/i18n";
import { SectionLabel, Card, Row, Toggle, SyncIndicator } from "./SharedUI";
import {
    getFavoriteCalendars,
    addFavoriteCalendar,
    updateFavoriteCalendar,
    removeFavoriteCalendar,
} from "@/lib/api";

// Preset calendars được lưu theo calendar_key
const PRESET_CALENDARS = [
    { key: "vn_holidays",    labelKey: "fav_calendars.vn_holidays",    descKey: "fav_calendars.vn_holidays_desc"    },
    { key: "world_holidays", labelKey: "fav_calendars.world_holidays", descKey: "fav_calendars.world_holidays_desc" },
    { key: "other_holidays", labelKey: "fav_calendars.other_holidays", descKey: "fav_calendars.other_holidays_desc" },
];

export default function FavoriteCalendars({ lang, onChange, onPresetChange }) {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [newHoliday, setNewHoliday] = useState("");
    const [adding, setAdding]         = useState(false);
    const [removing, setRemoving]     = useState(null);
    const [draggingId, setDraggingId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [syncStatus, setSyncStatus] = useState(null); // null | "saving" | "saved" | "error"

    // Drag state
    const dragIdx = useRef(null);
    const dragOverIdx = useRef(null);
    const dragSnapshotRef = useRef(null);

    // Chống toggle trùng lặp khi request trước chưa xong (tránh race condition)
    const pendingPresetsRef = useRef(new Set());

    // Tự ẩn trạng thái tạm sau vài giây
    const flashStatus = (state, ms) => {
        setSyncStatus(state);
        setTimeout(() => setSyncStatus((st) => (st === state ? null : st)), ms);
    };

    useEffect(() => {
        setLoading(true);
        getFavoriteCalendars()
            .then(data => setFavorites(Array.isArray(data) ? data : []))
            .catch(() => setFavorites([]))
            .finally(() => setLoading(false));
    }, []);

    const onChangeRef = useRef(onChange);
    const onPresetChangeRef = useRef(onPresetChange);
    useEffect(() => {
        onChangeRef.current = onChange;
        onPresetChangeRef.current = onPresetChange;
    });

    useEffect(() => {
        const customCalendars = favorites
            .filter(f => !PRESET_CALENDARS.find(p => p.key === f.calendar_key))
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

        onChangeRef.current?.(customCalendars);
        onPresetChangeRef.current?.({
            vietnamHolidays: isPresetActive("vn_holidays"),
            worldHolidays: isPresetActive("world_holidays"),
            otherHolidays: isPresetActive("other_holidays"),
        });
    }, [favorites]);

    useEffect(() => {
        const cleanupDrag = () => {
            dragIdx.current = null;
            dragOverIdx.current = null;
            setDraggingId(null);
            setIsDragging(false);
        };

        window.addEventListener("dragend", cleanupDrag, true);
        window.addEventListener("drop", cleanupDrag, true);
        window.addEventListener("mouseup", cleanupDrag, true);

        return () => {
            window.removeEventListener("dragend", cleanupDrag, true);
            window.removeEventListener("drop", cleanupDrag, true);
            window.removeEventListener("mouseup", cleanupDrag, true);
        };
    }, []);

    // ── Preset toggle ─────────────────────────────────────────────────────────
    const isPresetActive = (key) =>
        !!favorites.find(f => f.calendar_key === key && f.is_active);

    const getCustomCalendars = (source = favorites) =>
        source
            .filter(f => !PRESET_CALENDARS.find(p => p.key === f.calendar_key))
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const applyCustomOrder = (fromIndex, toIndex) => {
        if (fromIndex === null || toIndex === null || fromIndex === toIndex) return;

        setFavorites(prev => {
            const presets = prev.filter(f => PRESET_CALENDARS.find(p => p.key === f.calendar_key));
            const customs = getCustomCalendars(prev);
            const next = [...customs];
            const [moved] = next.splice(fromIndex, 1);
            if (!moved) return prev;
            next.splice(toIndex, 0, moved);

            const updated = next.map((item, i) => ({ ...item, sort_order: i }));
            dragIdx.current = toIndex;
            dragOverIdx.current = toIndex;
            return [...presets, ...updated];
        });
    };

    const togglePreset = async (key, label) => {
        if (pendingPresetsRef.current.has(key)) return;
        pendingPresetsRef.current.add(key);
        const prev = favorites; // snapshot để rollback
        const existing = prev.find(f => f.calendar_key === key);
        const targetActive = existing ? !existing.is_active : true;

        // Optimistic: flip ngay lập tức trên UI
        setFavorites(fs => {
            if (existing) {
                return fs.map(f => f.calendar_key === key ? { ...f, is_active: targetActive } : f);
            }
            return [...fs, {
                id: `temp-${key}`,
                calendar_key: key,
                name: label,
                cal_type: "external",
                is_active: true,
                sort_order: 0,
            }];
        });

        setSyncStatus("saving");
        try {
            const result = await addFavoriteCalendar({
                cal_type: "external",
                calendar_key: key,
                name: label,
            });
            // Thay temp/old bằng kết quả server
            setFavorites(fs => {
                const idx = fs.findIndex(f => f.calendar_key === key);
                if (idx >= 0) {
                    const updated = [...fs];
                    updated[idx] = result;
                    return updated;
                }
                return [...fs, result];
            });
            flashStatus("saved", 2000);
        } catch (e) {
            console.error("Toggle preset error:", e);
            // Rollback có chủ đích: chỉ hoàn tác đúng preset này, không làm ảnh hưởng thao tác khác
            if (existing) {
                setFavorites(fs => fs.map(f => f.calendar_key === key ? { ...f, is_active: existing.is_active } : f));
            } else {
                setFavorites(fs => fs.filter(f => !(f.calendar_key === key && String(f.id).startsWith("temp-"))));
            }
            flashStatus("error", 4000);
        } finally {
            pendingPresetsRef.current.delete(key);
        }
    };

    // ── Add custom ────────────────────────────────────────────────────────────
    const addCustom = async () => {
        const name = newHoliday.trim();
        if (!name || adding) return;
        const tempId = `temp-${Date.now()}`;
        const maxOrder = customFavorites.reduce((m, f) => Math.max(m, f.sort_order ?? 0), 0);

        // Optimistic: thêm item tạm ngay lập tức
        setFavorites(fs => [...fs, {
            id: tempId,
            calendar_key: `custom_${Date.now()}`,
            name,
            cal_type: "external",
            is_active: true,
            sort_order: maxOrder + 1,
        }]);
        setNewHoliday("");
        setAdding(true);
        setSyncStatus("saving");
        try {
            const result = await addFavoriteCalendar({
                cal_type: "external",
                calendar_key: `custom_${Date.now()}`,
                name,
                sort_order: maxOrder + 1,
            });
            // Thay item tạm bằng item thật từ server
            setFavorites(fs => fs.map(f => f.id === tempId ? result : f));
            flashStatus("saved", 2000);
        } catch (e) {
            console.error("Add custom error:", e);
            // Rollback: gỡ item tạm
            setFavorites(fs => fs.filter(f => f.id !== tempId));
            flashStatus("error", 4000);
        } finally {
            setAdding(false);
        }
    };

    // ── Remove custom ─────────────────────────────────────────────────────────
    const removeCustom = async (id) => {
        const removedItem = favorites.find(f => f.id === id);
        const removedIdx = favorites.findIndex(f => f.id === id);
        setRemoving(id);
        // Optimistic: gỡ ngay khỏi UI
        setFavorites(fs => fs.filter(f => f.id !== id));
        setSyncStatus("saving");
        try {
            await removeFavoriteCalendar(id);
            setRemoving(null);
            flashStatus("saved", 2000);
        } catch (e) {
            console.error("Remove error:", e);
            // Rollback có chủ đích: chỉ chèn lại đúng item vừa gỡ (không ghi đè thao tác khác)
            setFavorites(fs => {
                if (!removedItem) return fs;
                const next = [...fs];
                next.splice(Math.min(removedIdx, next.length), 0, removedItem);
                return next;
            });
            setRemoving(null);
            flashStatus("error", 4000);
        }
    };

    // ── Drag & drop sort ──────────────────────────────────────────────────────
    const onDragStart = (e, idx, id) => {
        dragIdx.current = idx;
        dragOverIdx.current = idx;
        dragSnapshotRef.current = favorites; // snapshot để rollback nếu lưu thất bại
        setDraggingId(id);
        setIsDragging(true);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(id));
    };
    const onDragEnter = (idx) => {
        const from = dragIdx.current;
        dragOverIdx.current = idx;
        applyCustomOrder(from, idx);
    };
    const onDragEnd   = async () => {
        const from = dragIdx.current;
        const to   = dragOverIdx.current;
        
        // Always cleanup drag state first to avoid "stuck" drag visuals
        dragIdx.current     = null;
        dragOverIdx.current = null;
        setDraggingId(null);
        setIsDragging(false);

        if (from === null || to === null || from === to) return;

        const reordered = getCustomCalendars();
        const [moved] = reordered.splice(from, 1);
        if (!moved) return;
        reordered.splice(to, 0, moved);

        const updated = reordered.map((item, i) => ({ ...item, sort_order: i }));
        setFavorites(prev => {
            const presets = prev.filter(f => PRESET_CALENDARS.find(p => p.key === f.calendar_key));
            return [...presets, ...updated];
        });

        // Persist to backend (optimistic — UI đã cập nhật thứ tự từ trước)
        const results = await Promise.allSettled(
            updated.map(item => updateFavoriteCalendar(item.id, { sort_order: item.sort_order }))
        );
        if (results.some(r => r.status === "rejected")) {
            console.error("Reorder error:", results.filter(r => r.status === "rejected"));
            // Rollback về thứ tự cũ nếu lưu thất bại
            if (dragSnapshotRef.current) setFavorites(dragSnapshotRef.current);
            flashStatus("error", 4000);
        } else {
            flashStatus("saved", 2000);
        }
    };

    // ── Derived data ──────────────────────────────────────────────────────────
    const customFavorites = getCustomCalendars();

    const activePresets = PRESET_CALENDARS.filter(p => isPresetActive(p.key));

    return (
        <div id="section-calendars" className="space-y-6 scroll-mt-6">
            <SectionLabel>{t('fav_calendars.title', lang)}</SectionLabel>

            {/* Active summary */}
            <Card className="bg-blue-50/30 dark:bg-transparent border-blue-100 dark:border-[#484848]">
                <div className="px-5 py-4">
                    <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-3">
                        {t('sections.active_calendars', lang)}
                    </p>
                    {loading ? (
                        <div className="flex items-center gap-2 text-slate-400 dark:text-[#9e9e9e] text-xs">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('loading', lang)}
                        </div>
                    ) : activePresets.length === 0 && customFavorites.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-[#9e9e9e] italic">
                            {lang === 'en' ? 'No calendars selected' : 'Chưa có lịch nào được chọn'}
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {activePresets.map(p => (
                                <span key={p.key} className="px-2.5 py-1.5 bg-white dark:bg-[#2d2d2d] border border-blue-100 dark:border-[#484848] rounded-lg text-xs font-semibold text-blue-700 dark:text-white shadow-sm">
                                    {t(p.labelKey, lang)}
                                </span>
                            ))}
                            {customFavorites.filter(f => f.is_active).map(h => (
                                <span key={h.id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-[#2d2d2d] border border-blue-100 dark:border-[#484848] rounded-lg text-xs font-semibold text-blue-700 dark:text-white shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    {h.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Preset toggles */}
            <Card>
                {PRESET_CALENDARS.map(p => (
                    <Row key={p.key} label={t(p.labelKey, lang)} desc={t(p.descKey, lang)}>
                        <Toggle
                            checked={isPresetActive(p.key)}
                            onChange={() => togglePreset(p.key, t(p.labelKey, lang))}
                        />
                    </Row>
                ))}
            </Card>

            {/* Custom calendars với drag & drop sort */}
            <Card>
                <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-700 dark:text-white mb-1">
                                {t('fav_calendars.custom_title', lang)}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-[#9e9e9e]">
                                {t('fav_calendars.custom_desc', lang)}
                            </p>
                        </div>
                        <SyncIndicator state={syncStatus} lang={lang} className="mt-0.5 flex-shrink-0" />
                    </div>

                    <div className={`flex gap-2 mb-4 transition ${isDragging ? "opacity-60" : ""}`}>
                        <input
                            type="text"
                            value={newHoliday}
                            onChange={(e) => setNewHoliday(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addCustom()}
                            placeholder={t('fav_calendars.custom_placeholder', lang)}
                            disabled={isDragging}
                            className="flex-1 text-sm border border-slate-200 dark:border-[#484848] rounded-xl px-4 py-2.5 text-slate-700 dark:text-white
                                placeholder-slate-300 dark:placeholder-[#757575] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition disabled:bg-slate-50 dark:bg-[#1f1f1f] disabled:text-slate-400 dark:disabled:text-[#757575]"
                        />
                        <button
                            type="button"
                            onClick={addCustom}
                            disabled={!newHoliday.trim() || adding || isDragging}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400
                                text-white text-sm font-semibold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                        >
                            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {t('fav_calendars.add', lang)}
                        </button>
                    </div>

                    {customFavorites.length > 0 ? (
                        <div className="space-y-1.5">
                            <p className="text-[10px] text-slate-400 dark:text-[#9e9e9e] mb-2 flex items-center gap-1.5">
                                <GripVertical className="w-3 h-3" />
                                {lang === 'en' ? 'Drag to reorder' : 'Kéo để sắp xếp'}
                            </p>
                            {customFavorites.map((h, idx) => (
                                <div
                                    key={h.id}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, idx, h.id)}
                                    onDragEnter={() => onDragEnter(idx)}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = "move";
                                        if (dragIdx.current !== idx) {
                                            onDragEnter(idx);
                                        }
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        onDragEnd();
                                    }}
                                    onDragEnd={onDragEnd}
                                    className="flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-[#1f1f1f] hover:bg-slate-100 dark:hover:bg-[#353535]
                                        rounded-xl transition group cursor-grab active:cursor-grabbing border border-transparent
                                        hover:border-slate-200 dark:border-[#484848]"
                                    style={{ opacity: draggingId === h.id ? 0.6 : 1, minHeight: 52 }}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-400 dark:text-[#757575] dark:group-hover:text-[#9e9e9e] flex-shrink-0" />
                                        <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                                        <span className="text-sm text-slate-700 dark:text-white font-medium">{h.name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={() => removeCustom(h.id)}
                                        disabled={removing === h.id}
                                        className="text-slate-300 hover:text-red-500 transition p-1.5 cursor-pointer"
                                    >
                                        {removing === h.id
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <X className="w-4 h-4" />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-slate-300">
                            <p className="text-xs">{t('fav_calendars.no_custom', lang)}</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
