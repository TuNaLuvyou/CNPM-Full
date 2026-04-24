"use client";
import React, { useState, useEffect, useRef } from "react";
import { Plus, X, Loader2, GripVertical } from "lucide-react";
import { t } from "@/lib/i18n";
import { SectionLabel, Card, Row, Toggle } from "./SharedUI";
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

export default function FavoriteCalendars({ lang }) {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [newHoliday, setNewHoliday] = useState("");
    const [adding, setAdding]         = useState(false);
    const [removing, setRemoving]     = useState(null);
    const [draggingId, setDraggingId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // Drag state
    const dragIdx = useRef(null);
    const dragOverIdx = useRef(null);

    useEffect(() => {
        setLoading(true);
        getFavoriteCalendars()
            .then(data => setFavorites(Array.isArray(data) ? data : []))
            .catch(() => setFavorites([]))
            .finally(() => setLoading(false));
    }, []);

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

    const togglePreset = async (key, label) => {
        try {
            const result = await addFavoriteCalendar({
                cal_type: "external",
                calendar_key: key,
                name: label,
            });
            setFavorites(prev => {
                const idx = prev.findIndex(f => f.calendar_key === key);
                if (idx >= 0) {
                    const updated = [...prev];
                    updated[idx] = result;
                    return updated;
                }
                return [...prev, result];
            });
        } catch (e) {
            console.error("Toggle preset error:", e);
        }
    };

    // ── Add custom ────────────────────────────────────────────────────────────
    const addCustom = async () => {
        const name = newHoliday.trim();
        if (!name || adding) return;
        setAdding(true);
        try {
            const maxOrder = customFavorites.reduce((m, f) => Math.max(m, f.sort_order ?? 0), 0);
            const result = await addFavoriteCalendar({
                cal_type: "external",
                calendar_key: `custom_${Date.now()}`,
                name,
                sort_order: maxOrder + 1,
            });
            setFavorites(prev => [...prev, result]);
            setNewHoliday("");
        } catch (e) {
            console.error("Add custom error:", e);
        } finally {
            setAdding(false);
        }
    };

    // ── Remove custom ─────────────────────────────────────────────────────────
    const removeCustom = async (id) => {
        setRemoving(id);
        try {
            await removeFavoriteCalendar(id);
            setFavorites(prev => prev.filter(f => f.id !== id));
        } catch (e) {
            console.error("Remove error:", e);
        } finally {
            setRemoving(null);
        }
    };

    // ── Drag & drop sort ──────────────────────────────────────────────────────
    const onDragStart = (e, idx, id) => {
        dragIdx.current = idx;
        dragOverIdx.current = idx;
        setDraggingId(id);
        setIsDragging(true);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(id));
    };
    const onDragEnter = (idx) => { dragOverIdx.current = idx; };
    const onDragEnd   = async () => {
        const from = dragIdx.current;
        const to   = dragOverIdx.current;
        
        // Always cleanup drag state first to avoid "stuck" drag visuals
        dragIdx.current     = null;
        dragOverIdx.current = null;
        setDraggingId(null);
        setIsDragging(false);

        if (from === null || to === null || from === to) return;

        const reordered = [...customFavorites];
        const [moved]   = reordered.splice(from, 1);
        reordered.splice(to, 0, moved);

        // Assign new sort_order values
        const updated = reordered.map((item, i) => ({ ...item, sort_order: i }));
        setFavorites(prev => {
            const presets = prev.filter(f => PRESET_CALENDARS.find(p => p.key === f.calendar_key));
            return [...presets, ...updated];
        });

        // Persist to backend
        await Promise.allSettled(
            updated.map(item => updateFavoriteCalendar(item.id, { sort_order: item.sort_order }))
        );
    };

    // ── Derived data ──────────────────────────────────────────────────────────
    const customFavorites = favorites
        .filter(f => !PRESET_CALENDARS.find(p => p.key === f.calendar_key))
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const activePresets = PRESET_CALENDARS.filter(p => isPresetActive(p.key));

    return (
        <div id="section-calendars" className="space-y-6 scroll-mt-6">
            <SectionLabel>{t('fav_calendars.title', lang)}</SectionLabel>

            {/* Active summary */}
            <Card className="bg-blue-50/30 border-blue-100">
                <div className="px-5 py-4">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">
                        {t('sections.active_calendars', lang)}
                    </p>
                    {loading ? (
                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải...
                        </div>
                    ) : activePresets.length === 0 && customFavorites.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                            {lang === 'en' ? 'No calendars selected' : 'Chưa có lịch nào được chọn'}
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {activePresets.map(p => (
                                <span key={p.key} className="px-2.5 py-1.5 bg-white border border-blue-100 rounded-lg text-xs font-semibold text-blue-700 shadow-sm">
                                    {t(p.labelKey, lang)}
                                </span>
                            ))}
                            {customFavorites.filter(f => f.is_active).map(h => (
                                <span key={h.id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-blue-100 rounded-lg text-xs font-semibold text-blue-700 shadow-sm">
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
                    <p className="text-sm font-semibold text-slate-700 mb-1">
                        {t('fav_calendars.custom_title', lang)}
                    </p>
                    <p className="text-xs text-slate-400 mb-4">
                        {t('fav_calendars.custom_desc', lang)}
                    </p>

                    {!isDragging && (
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newHoliday}
                                onChange={(e) => setNewHoliday(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addCustom()}
                                placeholder={t('fav_calendars.custom_placeholder', lang)}
                                className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700
                                    placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                            />
                            <button
                                type="button"
                                onClick={addCustom}
                                disabled={!newHoliday.trim() || adding}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400
                                    text-white text-sm font-semibold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                            >
                                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                {t('fav_calendars.add', lang)}
                            </button>
                        </div>
                    )}

                    {customFavorites.length > 0 ? (
                        <div className="space-y-1.5">
                            <p className="text-[10px] text-slate-400 mb-2 flex items-center gap-1.5">
                                <GripVertical className="w-3 h-3" />
                                {lang === 'en' ? 'Drag to reorder' : 'Kéo để sắp xếp'}
                            </p>
                            {customFavorites.map((h, idx) => (
                                <div
                                    key={h.id}
                                    draggable
                                    onMouseDown={() => setIsDragging(true)}
                                    onDragStart={(e) => onDragStart(e, idx, h.id)}
                                    onDragEnter={() => onDragEnter(idx)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        onDragEnd();
                                    }}
                                    onDragEnd={onDragEnd}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = "move";
                                    }}
                                    className="flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-100
                                        rounded-xl transition group cursor-grab active:cursor-grabbing border border-transparent
                                        hover:border-slate-200"
                                    style={{ opacity: draggingId === h.id ? 0.6 : 1 }}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-400 flex-shrink-0" />
                                        <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                                        <span className="text-sm text-slate-700 font-medium">{h.name}</span>
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
