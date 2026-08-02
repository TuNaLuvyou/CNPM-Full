"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
    X, Globe, Clock, Calendar, Bell, Eye, Heart,
    Check, Tag, Loader2, AlertCircle, RefreshCw,
} from "lucide-react";
import { t } from "@/lib/i18n";
import LanguageRegion from "./setting/LanguageRegion";
import Timezone from "./setting/Timezone";
import EventSettings from "./setting/EventSettings";
import Notification from "./setting/Notification";
import ViewOptions from "./setting/ViewOptions";
import FavoriteCalendars from "./setting/FavoriteCalendars";
import CategoryManagement from "./setting/CategoryManagement";

// ── Nav sections ──────────────────────────────────────────────────────────────
const SECTIONS = [
    { key: "language", labelKey: "sections.language", Icon: Globe },
    { key: "timezone", labelKey: "sections.timezone", Icon: Clock },
    { key: "events", labelKey: "sections.events", Icon: Calendar },
    { key: "notifications", labelKey: "sections.notifications", Icon: Bell },
    { key: "view", labelKey: "sections.view", Icon: Eye },
    { key: "calendars", labelKey: "sections.calendars", Icon: Heart },
    { key: "categories", labelKey: "sections.categories", Icon: Tag },
];

// ── Default settings ──────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
    language: "vi",
    region: "VN",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    firstDayOfWeek: 1,
    showSecondaryTimezone: false,
    primaryTimezone: "Asia/Ho_Chi_Minh",
    secondaryTimezone: null,
    defaultMeetLink: "",
    defaultLocation: "",
    notificationType: "both",
    notificationMinutes: 10,
    vietnamHolidays: true,
    worldHolidays: false,
    otherHolidays: false,
    customHolidays: [],
    theme: "light",
    showWeekends: true,
    showCompletedTasks: true,
    showWeekNumbers: false,
    showDeclinedEvents: false,
    showFriendsCalendars: false,
    dimPastEvents: true,
    weekStartDay: "monday",
    customCategories: ["M\u1eb7c \u0111\u1ecbnh", "C\u00f4ng vi\u1ec7c", "Gia \u0111\u00ecnh", "C\u00e1 nh\u00e2n"],
};

// ── Main export ───────────────────────────────────────────────────────────────
export default function SettingsModal({ isOpen, onClose, onSave, settings: initialSettings }) {
    const [activeSection, setActiveSection] = useState("language");
    const [settings, setSettings] = useState(initialSettings || DEFAULT_SETTINGS);
    const [saveState, setSaveState] = useState("idle"); // "idle" | "saving" | "saved" | "error"
    const scrollContainerRef = useRef(null);
    const settingsRef = useRef(settings);
    const saveTimerRef = useRef(null);

    // ── Optimistic UI: luôn giữ bản mới nhất để debounce auto-save đọc đúng state ──
    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    // Dọn timer khi unmount
    useEffect(() => {
        return () => clearTimeout(saveTimerRef.current);
    }, []);

    // Scroll Spy mechanism
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || !isOpen) return;

        const handleScroll = () => {
            const sectionElements = SECTIONS.map(s => document.getElementById(`section-${s.key}`));
            let current = activeSection;

            // Kiểm tra nếu đã cuộn xuống cuối cùng (cho mục cuối)
            const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;

            if (isAtBottom) {
                current = SECTIONS[SECTIONS.length - 1].key;
            } else {
                for (const el of sectionElements) {
                    if (!el) continue;
                    const rect = el.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    
                    // Ngưỡng kích hoạt linh hoạt hơn
                    if (rect.top <= containerRect.top + 80) {
                        current = el.id.replace('section-', '');
                    }
                }
            }

            if (current !== activeSection) {
                setActiveSection(current);
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [isOpen, activeSection]);

    // Chỉ đồng bộ lại settings từ props khi modal được mở lại.
    // (Không reset khi initialSettings đổi lúc đang mở — tránh xung đột với optimistic updates)
    const [prevOpen, setPrevOpen] = useState(isOpen);
    if (prevOpen !== isOpen) {
        setPrevOpen(isOpen);
        if (isOpen) {
            setSettings(initialSettings || DEFAULT_SETTINGS);
            settingsRef.current = initialSettings || DEFAULT_SETTINGS;
            setActiveSection("language");
            setSaveState("idle");
        }
    }

    // Reset scroll về đầu mỗi khi mở lại
    useEffect(() => {
        if (isOpen && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [isOpen]);

    // Live theme preview — khôi phục theme đã lưu khi đóng modal (không lưu preview)
    useEffect(() => {
        const root = document.documentElement;
        const applyTheme = (theme) => {
            if (theme === "dark") {
                root.classList.add("dark");
            } else if (theme === "light") {
                root.classList.remove("dark");
            } else {
                if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
                    root.classList.add("dark");
                } else {
                    root.classList.remove("dark");
                }
            }
        };

        if (!isOpen) {
            // Đóng modal → trả về theme đã lưu (đề phòng người dùng preview rồi huỷ)
            applyTheme(initialSettings?.theme || "light");
            return;
        }
        applyTheme(settings.theme);
    }, [settings.theme, isOpen, initialSettings]);

    // Cập nhật state nội bộ của SettingsModal (không tự động lưu / không áp dụng ngay vào app)
    const set = (key, value) => {
        const next = { ...settingsRef.current, [key]: value };
        settingsRef.current = next;
        setSettings(next);
    };

    const handleFavoriteCalendarsChange = useCallback((customHolidays) => {
        const curr = settingsRef.current;
        if (JSON.stringify(curr.customHolidays) === JSON.stringify(customHolidays)) return;
        const next = { ...curr, customHolidays };
        settingsRef.current = next;
        setSettings(next);
    }, []);

    const handleFavoritePresetChange = useCallback(({ vietnamHolidays, worldHolidays, otherHolidays }) => {
        const curr = settingsRef.current;
        if (
            curr.vietnamHolidays === vietnamHolidays &&
            curr.worldHolidays === worldHolidays &&
            curr.otherHolidays === otherHolidays
        ) return;
        const next = { ...curr, vietnamHolidays, worldHolidays, otherHolidays };
        settingsRef.current = next;
        setSettings(next);
    }, []);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (saveState === "saving") return;
        setSaveState("saving");

        const snapshot = settingsRef.current;
        const languageChanged = snapshot.language !== (initialSettings?.language || "vi");

        if (languageChanged) {
            // 1. Lưu cài đặt mới vào localStorage & sessionStorage trước khi reload
            if (typeof window !== 'undefined') {
                localStorage.setItem("appSettings", JSON.stringify(snapshot));
                sessionStorage.setItem("reopenSettingsModal", "true");
            }

            // 2. Đồng bộ lên backend ngầm
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (token) {
                try {
                    const { updateSettings } = await import('@/lib/api');
                    await updateSettings(snapshot);
                } catch (e) {
                    console.error("Lỗi đồng bộ cài đặt:", e);
                }
            }

            // 3. Reload ngay lập tức -> trình duyệt hiển thị màn hình Loading trước
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
            return;
        }

        // Không đổi ngôn ngữ -> Cập nhật bình thường và đóng modal
        onSave?.(snapshot);

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
            try {
                const { updateSettings } = await import('@/lib/api');
                await updateSettings(snapshot);
            } catch (e) {
                console.error("Lỗi đồng bộ cài đặt:", e);
            }
        }

        setSaveState("saved");
        setTimeout(() => {
            setSaveState("idle");
            onClose?.();
        }, 500);
    };

    const scrollToSection = (key) => {
        const el = document.getElementById(`section-${key}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveSection(key);
        }
    };

    const displayLang = initialSettings?.language || "vi";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-[3px]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl bg-slate-50 dark:bg-[#1f1f1f] rounded-3xl shadow-2xl shadow-black/20 flex flex-col overflow-hidden"
                style={{ maxHeight: "88vh" }}>

                {/* ── Top bar ── */}
                <div className="flex items-center justify-between px-8 py-5 bg-white dark:bg-[#2d2d2d] border-b border-slate-200 dark:border-[#3c3c3c] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{t('settings', displayLang)}</h2>
                            <p className="text-xs text-slate-400 dark:text-[#9e9e9e]">{t('settings_desc', displayLang)}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-[#353535] rounded-full transition text-slate-400 dark:text-[#9e9e9e] hover:text-slate-600 dark:hover:text-[#bdbdbd]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ── Body: sidebar + content ── */}
                <div className="flex flex-1 min-h-0 overflow-hidden">

                    {/* Sidebar nav */}
                    <nav className="w-52 bg-white dark:bg-[#2d2d2d] border-r border-slate-200 dark:border-[#3c3c3c] py-3 flex-shrink-0 overflow-y-auto min-h-0">
                        {SECTIONS.map(({ key, labelKey }) => {
                            const active = activeSection === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => scrollToSection(key)}
                                    className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all text-left border-r-[3px]
                                        ${active
                                            ? "text-blue-600 bg-blue-50 border-blue-600 dark:bg-[#484848] dark:text-white dark:border-blue-400"
                                            : "text-slate-600 dark:text-[#bdbdbd] hover:bg-slate-50 dark:hover:bg-[#2d2d2d] hover:text-slate-800 dark:hover:text-[#f5f5f5] border-transparent"
                                        }`}
                                >
                                    <span className="truncate">{t(labelKey, displayLang)}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Content area - Multi-section scrollable list */}
                    <div 
                        ref={scrollContainerRef}
                        className="flex-1 min-h-0 overflow-y-auto p-8 custom-scrollbar space-y-12 bg-slate-50 dark:bg-[#1f1f1f]"
                    >
                        <LanguageRegion s={settings} set={set} lang={displayLang} />
                        <hr className="border-slate-200 dark:border-[#484848]/60" />
                        <Timezone s={settings} set={set} lang={displayLang} />
                        <hr className="border-slate-200 dark:border-[#484848]/60" />
                        <EventSettings s={settings} set={set} lang={displayLang} />
                        <hr className="border-slate-200 dark:border-[#484848]/60" />
                        <Notification s={settings} set={set} lang={displayLang} />
                        <hr className="border-slate-200 dark:border-[#484848]/60" />
                        <ViewOptions s={settings} set={set} lang={displayLang} />
                        <hr className="border-slate-200 dark:border-[#484848]/60" />
                        <FavoriteCalendars
                            lang={displayLang}
                            onChange={handleFavoriteCalendarsChange}
                            onPresetChange={handleFavoritePresetChange}
                        />
                        <hr className="border-slate-200 dark:border-[#484848]/60" />
                        <CategoryManagement s={settings} set={set} lang={displayLang} />
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-between px-8 py-4 bg-white dark:bg-[#2d2d2d] border-t border-slate-200 dark:border-[#3c3c3c] flex-shrink-0">
                    <div className="min-w-0 flex-1">
                        {saveState === "saving" && (
                            <p className="text-xs text-slate-400 dark:text-[#9e9e9e] flex items-center gap-1.5">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                {t('saving', displayLang)}
                            </p>
                        )}
                        {saveState === "saved" && (
                            <p className="text-xs text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5" />
                                {t('settings_synced', displayLang)}
                            </p>
                        )}
                        {saveState === "error" && (
                            <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                {t('settings_sync_error', displayLang)}
                            </p>
                        )}
                        {saveState === "idle" && (
                            <p className="text-xs text-slate-400 dark:text-[#9e9e9e]">
                                {displayLang === 'en' ? 'Click "Save" to apply changes.' : 'Nhấn "Lưu" để áp dụng các thay đổi.'}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#353535] rounded-xl transition"
                        >
                            {t('cancel', displayLang)}
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saveState === "saving"}
                            className={`px-6 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed
                ${saveState === "saved"
                                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200 dark:shadow-none"
                                    : saveState === "error"
                                        ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200 dark:shadow-none"
                                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200 dark:shadow-none"
                                }`}
                        >
                            {saveState === "saving" && (
                                <><Loader2 className="w-4 h-4 animate-spin" /> {t('saving', displayLang)}</>
                            )}
                            {saveState === "saved" && (
                                <><Check className="w-4 h-4" /> {t('saved', displayLang)}</>
                            )}
                            {saveState === "error" && (
                                <><RefreshCw className="w-4 h-4" /> {t('retry', displayLang)}</>
                            )}
                            {saveState === "idle" && (
                                <><Check className="w-4 h-4" /> {t('save', displayLang)}</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}