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
    country: "VN",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    showSecondaryTimezone: false,
    primaryTimezone: "Asia/Ho_Chi_Minh",
    secondaryTimezone: "America/New_York",
    defaultMeetLink: "",
    defaultLocation: "",
    notificationType: "screen",
    notificationMinutes: 10,
    showWeekends: true,
    showCompletedTasks: true,
    showWeekNumbers: false,
    dimPastEvents: true,
    weekStartDay: "monday",
    vietnamHolidays: true,
    worldHolidays: false,
    otherHolidays: false,
    customHolidays: [],
    customCategories: ["Mặc định", "Công việc", "Gia đình", "Cá nhân"],
};

// ── Shared tiny components ────────────────────────────────────────────────────
function SectionLabel({ children }) {
    return (
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">
            {children}
        </p>
    );
}

function Card({ children, className = "" }) {
    return (
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
            {children}
        </div>
    );
}

function Row({ label, desc, children, disabled }) {
    return (
        <div className={`flex items-center justify-between gap-6 px-5 py-4 border-b border-slate-50 last:border-0
      ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-700 leading-tight">{label}</p>
                {desc && <p className="text-xs text-slate-400 mt-0.5 leading-snug">{desc}</p>}
            </div>
            <div className="flex-shrink-0">{children}</div>
        </div>
    );
}

function Toggle({ checked, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        ${checked ? "bg-blue-600" : "bg-slate-200 hover:bg-slate-300"}`}
            role="switch"
            aria-checked={checked}
        >
            <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200
          ${checked ? "translate-x-5" : "translate-x-0"}`}
            />
        </button>
    );
}

function Select({ value, onChange, options, className = "" }) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 bg-white
        hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
        transition cursor-pointer min-w-[240px] sm:min-w-[300px] ${className}`}
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    );
}

function Input({ value, onChange, placeholder, icon: Icon, className = "" }) {
    return (
        <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />}
            <input
                type="text"
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 placeholder-slate-300
          bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition
          w-full max-w-[300px] ${className}`}
            />
        </div>
    );
}

// ── Section: Ngôn ngữ & Khu vực ───────────────────────────────────────────────
function LanguageSection({ s, set, lang }) {
    return (
        <div id="section-language" className="space-y-6 scroll-mt-6">
            <SectionLabel>{t('lang_region.title', lang)}</SectionLabel>
            <Card>
                <Row label={t('lang_region.language', lang)} desc={t('lang_region.language_desc', lang)}>
                    <Select value={s.language} onChange={(v) => set("language", v)} options={LANGUAGES} />
                </Row>
                <Row label={t('lang_region.country', lang)} desc={t('lang_region.country_desc', lang)}>
                    <Select value={s.country} onChange={(v) => set("country", v)} options={COUNTRIES} />
                </Row>
                <Row label={t('lang_region.date_format', lang)} desc={t('lang_region.date_format_desc', lang)}>
                    <Select value={s.dateFormat} onChange={(v) => set("dateFormat", v)} options={DATE_FORMATS} className="min-w-0" />
                </Row>
                <Row label={t('lang_region.time_format', lang)} desc={t('lang_region.time_format_desc', lang)}>
                    <div className="flex rounded-xl overflow-hidden border border-slate-200 min-w-[240px] sm:min-w-[300px]">
                        {[
                            { v: "12h", label: t('lang_region.hour_12', lang) },
                            { v: "24h", label: t('lang_region.hour_24', lang) },
                        ].map(({ v, label }) => (
                            <button
                                key={v}
                                type="button"
                                onClick={() => set("timeFormat", v)}
                                className={`flex-1 py-2 text-sm font-semibold transition
                  ${s.timeFormat === v ? "bg-blue-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </Row>
            </Card>
        </div>
    );
}

// ── Section: Múi giờ ──────────────────────────────────────────────────────────
function TimezoneSection({ s, set, lang }) {
    return (
        <div id="section-timezone" className="space-y-6 scroll-mt-6">
            <SectionLabel>{t('timezone.title', lang)}</SectionLabel>
            <Card>
                <Row
                    label={t('timezone.show_secondary', lang)}
                    desc={t('timezone.show_secondary_desc', lang)}
                >
                    <Toggle checked={s.showSecondaryTimezone} onChange={(v) => set("showSecondaryTimezone", v)} />
                </Row>
                <Row label={t('timezone.primary', lang)} desc={t('timezone.primary_desc', lang)}>
                    <Select value={s.primaryTimezone} onChange={(v) => set("primaryTimezone", v)} options={TIMEZONES} />
                </Row>
                <Row
                    label={t('timezone.secondary', lang)}
                    desc={s.showSecondaryTimezone ? t('timezone.secondary_desc', lang) : t('timezone.secondary_disabled', lang)}
                    disabled={!s.showSecondaryTimezone}
                >
                    <Select value={s.secondaryTimezone} onChange={(v) => set("secondaryTimezone", v)} options={TIMEZONES} />
                </Row>
            </Card>
        </div>
    );
}

// ── Section: Cài đặt sự kiện ──────────────────────────────────────────────────
function EventsSection({ s, set, lang }) {
    return (
        <div id="section-events" className="space-y-6 scroll-mt-6">
            <SectionLabel>{t('event_settings.title', lang)}</SectionLabel>
            <Card>
                <Row label={t('event_settings.meet_link', lang)} desc={t('event_settings.meet_link_desc', lang)}>
                    <Input
                        value={s.defaultMeetLink}
                        onChange={(v) => set("defaultMeetLink", v)}
                        placeholder="https://meet.google.com/..."
                    />
                </Row>
                <Row label={t('event_settings.location', lang)} desc={t('event_settings.location_desc', lang)}>
                    <Input
                        value={s.defaultLocation}
                        onChange={(v) => set("defaultLocation", v)}
                        placeholder={t('event_settings.location_placeholder', lang)}
                    />
                </Row>
            </Card>
        </div>
    );
}

// ── Section: Thông báo ────────────────────────────────────────────────────────
function NotificationsSection({ s, set, lang }) {
    const NOTIF_OPTS = [
        { value: "off", label: t('notif_settings.off', lang), desc: t('notif_settings.off_desc', lang) },
        { value: "screen", label: t('notif_settings.screen', lang), desc: t('notif_settings.screen_desc', lang) },
        { value: "push", label: t('notif_settings.push', lang), desc: t('notif_settings.push_desc', lang) },
    ];
    return (
        <div id="section-notifications" className="space-y-6 scroll-mt-6">
            <SectionLabel>{t('notif_settings.title', lang)}</SectionLabel>

            {/* Radio group */}
            <Card>
                <div className="px-5 py-4 border-b border-slate-50">
                    <p className="text-sm font-semibold text-slate-700 mb-4">{t('notif_settings.type', lang)}</p>
                    <div className="space-y-3">
                        {NOTIF_OPTS.map((opt) => {
                            const active = s.notificationType === opt.value;
                            return (
                                <label key={opt.value} className="flex items-start gap-3 cursor-pointer group">
                                    <div
                                        onClick={() => set("notificationType", opt.value)}
                                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition
                      ${active ? "border-blue-600 bg-blue-600" : "border-slate-300 group-hover:border-blue-400"}`}
                                    >
                                        {active && <span className="w-2 h-2 bg-white rounded-full block" />}
                                    </div>
                                    <div onClick={() => set("notificationType", opt.value)}>
                                        <p className="text-sm font-medium text-slate-700">{opt.label}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>
                <Row
                    label={t('notif_settings.reminder', lang)}
                    desc={t('notif_settings.reminder_desc', lang)}
                    disabled={s.notificationType === "off"}
                >
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min={1}
                            max={120}
                            value={s.notificationMinutes}
                            onChange={(e) => set("notificationMinutes", Math.max(1, Math.min(120, Number(e.target.value))))}
                            className="w-16 text-sm text-center border border-slate-200 rounded-xl px-2 py-2 text-slate-700
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                        />
                        <span className="text-sm text-slate-500 font-medium">{t('notif_settings.minutes', lang)}</span>
                    </div>
                </Row>
            </Card>
        </div>
    );
}

// ── Section: Tuỳ chọn xem ─────────────────────────────────────────────────────
function ViewSection({ s, set, lang }) {
    const TOGGLES = [
        { key: "showWeekends", label: t('view_options.show_weekends', lang), desc: t('view_options.show_weekends_desc', lang) },
        { key: "showCompletedTasks", label: t('view_options.show_completed', lang), desc: t('view_options.show_completed_desc', lang) },
        { key: "showWeekNumbers", label: t('view_options.show_week_num', lang), desc: t('view_options.show_week_num_desc', lang) },
        { key: "dimPastEvents", label: t('view_options.dim_past', lang), desc: t('view_options.dim_past_desc', lang) },
    ];
    return (
        <div id="section-view" className="space-y-6 scroll-mt-6">
            <SectionLabel>{t('view_options.title', lang)}</SectionLabel>
            <Card>
                {TOGGLES.map((item) => (
                    <Row key={item.key} label={item.label} desc={item.desc}>
                        <Toggle checked={s[item.key]} onChange={(v) => set(item.key, v)} />
                    </Row>
                ))}
            </Card>
            <Card>
                <Row label={t('view_options.week_start', lang)} desc={t('view_options.week_start_desc', lang)}>
                    <Select 
                        value={s.weekStartDay} 
                        onChange={(v) => set("weekStartDay", v)} 
                        options={WEEK_DAYS} 
                        className="min-w-[160px]" 
                    />
                </Row>
            </Card>
        </div>
    );
}

// ── Section: Lịch yêu thích ───────────────────────────────────────────────────
function CalendarsSection({ s, set, lang }) {
    const [newHoliday, setNewHoliday] = useState("");
    const customHolidays = s.customHolidays || [];

    const addHoliday = () => {
        const name = newHoliday.trim();
        if (!name) return;
        const updated = [...customHolidays, { id: Date.now(), name }];
        set("customHolidays", updated);
        setNewHoliday("");
    };

    const removeHoliday = (id) => {
        const updated = customHolidays.filter((h) => h.id !== id);
        set("customHolidays", updated);
    };

    // Tạo danh sách lịch đang kích hoạt để hiển thị tóm tắt
    const activePresets = [
        { key: "vietnamHolidays", label: t('fav_calendars.vn_holidays', lang) },
        { key: "worldHolidays", label: t('fav_calendars.world_holidays', lang) },
        { key: "otherHolidays", label: t('fav_calendars.other_holidays', lang) },
    ].filter(p => s[p.key]);

    return (
        <div id="section-calendars" className="space-y-6 scroll-mt-6">
            <SectionLabel>{t('fav_calendars.title', lang)}</SectionLabel>

            {/* Active Summary */}
            <Card className="bg-blue-50/30 border-blue-100">
                <div className="px-5 py-4">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">{t('sections.active_calendars', lang)}</p>
                    {activePresets.length === 0 && customHolidays.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                            {lang === 'en' ? 'No calendars selected' : 'Chưa có lịch nào được chọn'}
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {activePresets.map(p => (
                                <div key={p.key} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-blue-100 rounded-lg text-xs font-semibold text-blue-700 shadow-sm">
                                    <span>{p.label}</span>
                                </div>
                            ))}
                            {customHolidays.map(h => (
                                <div key={h.id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-blue-100 rounded-lg text-xs font-semibold text-blue-700 shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    <span>{h.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Preset holidays */}
            <Card>
                <Row label={t('fav_calendars.vn_holidays', lang)} desc={t('fav_calendars.vn_holidays_desc', lang)}>
                    <Toggle checked={s.vietnamHolidays} onChange={(v) => set("vietnamHolidays", v)} />
                </Row>
                <Row label={t('fav_calendars.world_holidays', lang)} desc={t('fav_calendars.world_holidays_desc', lang)}>
                    <Toggle checked={s.worldHolidays} onChange={(v) => set("worldHolidays", v)} />
                </Row>
                <Row label={t('fav_calendars.other_holidays', lang)} desc={t('fav_calendars.other_holidays_desc', lang)}>
                    <Toggle checked={s.otherHolidays} onChange={(v) => set("otherHolidays", v)} />
                </Row>
            </Card>

            {/* Custom holidays */}
            <Card>
                <div className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-700 mb-1">{t('fav_calendars.custom_title', lang)}</p>
                    <p className="text-xs text-slate-400 mb-4">{t('fav_calendars.custom_desc', lang)}</p>

                    {/* Input row */}
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newHoliday}
                            onChange={(e) => setNewHoliday(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addHoliday()}
                            placeholder={t('fav_calendars.custom_placeholder', lang)}
                            className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700
                placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                        />
                        <button
                            type="button"
                            onClick={addHoliday}
                            disabled={!newHoliday.trim()}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400
                text-white text-sm font-semibold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                        >
                            <Plus className="w-4 h-4" /> {t('fav_calendars.add', lang)}
                        </button>
                    </div>

                    {/* Custom list */}
                    {customHolidays.length > 0 ? (
                        <div className="space-y-1.5">
                            {customHolidays.map((h) => (
                                <div
                                    key={h.id}
                                    className="flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition group"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                                        <span className="text-sm text-slate-700 font-medium">{h.name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeHoliday(h.id)}
                                        className="text-slate-300 hover:text-red-500 transition p-1.5 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
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


// ── Section: Danh mục ────────────────────────────────────────────────────────
function CategoriesSection({ s, set, lang }) {
    const [newCat, setNewCat] = useState("");
    const categories = s.customCategories || [];

    const addCategory = () => {
        const name = newCat.trim();
        if (!name || categories.includes(name)) return;
        const updated = [...categories, name];
        set("customCategories", updated);
        setNewCat("");
    };

    const removeCategory = (name) => {
        const updated = categories.filter((c) => c !== name);
        set("customCategories", updated);
    };

    return (
        <div id="section-categories" className="space-y-6 scroll-mt-6 pb-20">
            <SectionLabel>{t('categories_settings.title', lang)}</SectionLabel>

            <Card>
                <div className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-700 mb-1">{t('categories_settings.add_title', lang)}</p>
                    <p className="text-xs text-slate-400 mb-4">{t('categories_settings.add_desc', lang)}</p>

                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newCat}
                            onChange={(e) => setNewCat(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addCategory()}
                            placeholder={t('categories_settings.placeholder', lang)}
                            className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700
                                placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                        />
                        <button
                            type="button"
                            onClick={addCategory}
                            disabled={!newCat.trim() || categories.includes(newCat.trim())}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400
                                text-white text-sm font-semibold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                        >
                            <Plus className="w-4 h-4" /> {t('fav_calendars.add', lang)}
                        </button>
                    </div>

                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t('sections.category_list', lang)} ({categories.length})</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categories.map((cat) => (
                            <div
                                key={cat}
                                className="flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-sm text-slate-700 font-medium">{cat}</span>
                                </div>
                                {cat !== "Mặc định" && (
                                    <button
                                        type="button"
                                        onClick={() => removeCategory(cat)}
                                        className="text-slate-300 hover:text-red-500 transition p-1 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
}

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

            for (const el of sectionElements) {
                if (!el) continue;
                const rect = el.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                // If section top is near the top of container view
                if (rect.top <= containerRect.top + 100) {
                    current = el.id.replace('section-', '');
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
                        <LanguageSection s={settings} set={set} lang={settings.language} />
                        <hr className="border-slate-200/60" />
                        <TimezoneSection s={settings} set={set} lang={settings.language} />
                        <hr className="border-slate-200/60" />
                        <EventsSection s={settings} set={set} lang={settings.language} />
                        <hr className="border-slate-200/60" />
                        <NotificationsSection s={settings} set={set} lang={settings.language} />
                        <hr className="border-slate-200/60" />
                        <ViewSection s={settings} set={set} lang={settings.language} />
                        <hr className="border-slate-200/60" />
                        <CalendarsSection s={settings} set={set} lang={settings.language} />
                        <hr className="border-slate-200/60" />
                        <CategoriesSection s={settings} set={set} lang={settings.language} />
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