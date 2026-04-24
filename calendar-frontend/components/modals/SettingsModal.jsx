"use client";
import { useState, useEffect } from "react";
import {
    X, Globe, Clock, Calendar, Bell, Eye, Heart,
    Plus, Video, MapPin, Check, Settings, Tag,
} from "lucide-react";
import { t } from "@/lib/i18n";

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

// ── Static data ───────────────────────────────────────────────────────────────
const LANGUAGES = [
    { value: "vi", label: "Tiếng Việt" },
    { value: "en", label: "English" },
    { value: "ja", label: "日本語" },
    { value: "zh", label: "中文" },
    { value: "ko", label: "한국어" },
    { value: "fr", label: "Français" },
    { value: "de", label: "Deutsch" },
];

const COUNTRIES = [
    { value: "VN", label: "Việt Nam" },
    { value: "US", label: "United States" },
    { value: "GB", label: "United Kingdom" },
    { value: "JP", label: "Japan" },
    { value: "KR", label: "South Korea" },
    { value: "FR", label: "France" },
    { value: "DE", label: "Germany" },
    { value: "AU", label: "Australia" },
];

const DATE_FORMATS = [
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY  →  31/12/2026" },
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY  →  12/31/2026" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD  →  2026-12-31" },
    { value: "D MMMM YYYY", label: "D MMMM YYYY  →  31 Tháng 12, 2026" },
];

const TIMEZONES = [
    { value: "Asia/Ho_Chi_Minh", label: "(GMT+7) Hồ Chí Minh" },
    { value: "Asia/Bangkok", label: "(GMT+7) Bangkok" },
    { value: "Asia/Singapore", label: "(GMT+8) Singapore" },
    { value: "Asia/Tokyo", label: "(GMT+9) Tokyo" },
    { value: "Asia/Seoul", label: "(GMT+9) Seoul" },
    { value: "Europe/London", label: "(GMT+0) London" },
    { value: "Europe/Paris", label: "(GMT+1) Paris" },
    { value: "America/New_York", label: "(GMT-5) New York" },
    { value: "America/Chicago", label: "(GMT-6) Chicago" },
    { value: "America/Los_Angeles", label: "(GMT-8) Los Angeles" },
    { value: "Australia/Sydney", label: "(GMT+11) Sydney" },
];

const WEEK_DAYS = [
    { value: "monday", label: "Thứ Hai" },
    { value: "tuesday", label: "Thứ Ba" },
    { value: "wednesday", label: "Thứ Tư" },
    { value: "thursday", label: "Thứ Năm" },
    { value: "friday", label: "Thứ Sáu" },
    { value: "saturday", label: "Thứ Bảy" },
    { value: "sunday", label: "Chủ Nhật" },
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
    notificationType: "screen",
    notificationMinutes: 10,
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

// ── Implemented Sections ────────────────────────────────────────────────────────
import LanguageRegion from "./setting/LanguageRegion";
import Timezone from "./setting/Timezone";
import EventSettings from "./setting/EventSettings";
import Notification from "./setting/Notification";
import ViewOptions from "./setting/ViewOptions";
import FavoriteCalendars from "./setting/FavoriteCalendars";
import CategoryManagement from "./setting/CategoryManagement";

import { useRef } from "react";

// ── Main export ───────────────────────────────────────────────────────────────
export default function SettingsModal({ isOpen, onClose, onSave, settings: initialSettings }) {
    const [activeSection, setActiveSection] = useState("language");
    const [settings, setSettings] = useState(initialSettings || DEFAULT_SETTINGS);
    const [saveState, setSaveState] = useState("idle"); // "idle" | "saved"
    const scrollContainerRef = useRef(null);

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

    useEffect(() => {
        if (isOpen && initialSettings) {
            setSettings(initialSettings);
            // Reset scroll to top when opening
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = 0;
                setActiveSection("language");
            }
        }
    }, [isOpen, initialSettings]);

    if (!isOpen) return null;

    const set = (key, value) =>
        setSettings((prev) => ({ ...prev, [key]: value }));

    const handleSave = () => {
        onSave?.(settings);
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2200);
    };

    const scrollToSection = (key) => {
        const el = document.getElementById(`section-${key}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveSection(key);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-[3px]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl bg-slate-50 rounded-3xl shadow-2xl shadow-black/20 flex flex-col overflow-hidden"
                style={{ maxHeight: "88vh" }}>

                {/* ── Top bar ── */}
                <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 leading-tight">{t('settings', settings.language)}</h2>
                            <p className="text-xs text-slate-400">{t('settings_desc', settings.language)}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ── Body: sidebar + content ── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Sidebar nav */}
                    <nav className="w-52 bg-white border-r border-slate-200 py-3 flex-shrink-0 overflow-y-auto">
                        {SECTIONS.map(({ key, labelKey }) => {
                            const active = activeSection === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => scrollToSection(key)}
                                    className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all text-left border-r-[3px]
                                        ${active
                                            ? "text-blue-600 bg-blue-50 border-blue-600"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-800 border-transparent"
                                        }`}
                                >
                                    <span className="truncate">{t(labelKey, settings.language)}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Content area - Multi-section scrollable list */}
                    <div 
                        ref={scrollContainerRef}
                        className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-12"
                    >
                        <LanguageRegion s={settings} set={set} lang={settings.language} />
                        <hr className="border-slate-200/60" />
                        <Timezone s={settings} set={set} lang={settings.language} />
                        <hr className="border-slate-200/60" />
                        <EventSettings s={settings} set={set} lang={settings.language} />
                        <hr className="border-slate-200/60" />
                        <Notification s={settings} set={set} lang={settings.language} />
                        <hr className="border-slate-200/60" />
                        <ViewOptions s={settings} set={set} lang={settings.language} />
                        <hr className="border-slate-200/60" />
                        <FavoriteCalendars lang={settings.language} />
                        <hr className="border-slate-200/60" />
                        <CategoryManagement s={settings} set={set} lang={settings.language} />
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-between px-8 py-4 bg-white border-t border-slate-200 flex-shrink-0">
                    <p className="text-xs text-slate-400">
                        {settings.language === 'en' ? 'Settings apply to the current session' : 'Cài đặt áp dụng cho phiên hiện tại'}
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                        >
                            {t('cancel', settings.language)}
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className={`px-6 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2
                ${saveState === "saved"
                                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
                                }`}
                        >
                            {saveState === "saved" ? (
                                <><Check className="w-4 h-4" /> {t('saved', settings.language)}</>
                            ) : (
                                t('save_settings', settings.language)
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}