"use client";
import { useState } from "react";
import {
    X, Globe, Clock, Calendar, Bell, Eye, Heart,
    Plus, Video, MapPin, Check, Settings,
} from "lucide-react";

// ── Nav sections ──────────────────────────────────────────────────────────────
const SECTIONS = [
    { key: "language", label: "Ngôn ngữ & Khu vực", Icon: Globe },
    { key: "timezone", label: "Múi giờ", Icon: Clock },
    { key: "events", label: "Cài đặt sự kiện", Icon: Calendar },
    { key: "notifications", label: "Thông báo", Icon: Bell },
    { key: "view", label: "Tuỳ chọn xem", Icon: Eye },
    { key: "calendars", label: "Lịch yêu thích", Icon: Heart },
];

// ── Static data ───────────────────────────────────────────────────────────────
const LANGUAGES = [
    { value: "vi", label: "🇻🇳  Tiếng Việt" },
    { value: "en", label: "🇬🇧  English" },
    { value: "ja", label: "🇯🇵  日本語" },
    { value: "zh", label: "🇨🇳  中文" },
    { value: "ko", label: "🇰🇷  한국어" },
    { value: "fr", label: "🇫🇷  Français" },
    { value: "de", label: "🇩🇪  Deutsch" },
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
        transition cursor-pointer ${className}`}
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
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 placeholder-slate-300
          bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition
          w-64 ${className}`}
            />
        </div>
    );
}

// ── Section: Ngôn ngữ & Khu vực ───────────────────────────────────────────────
function LanguageSection({ s, set }) {
    return (
        <div className="space-y-6">
            <SectionLabel>Ngôn ngữ và Khu vực</SectionLabel>
            <Card>
                <Row label="Ngôn ngữ" desc="Ngôn ngữ hiển thị của ứng dụng">
                    <Select value={s.language} onChange={(v) => set("language", v)} options={LANGUAGES} className="min-w-[180px]" />
                </Row>
                <Row label="Quốc gia" desc="Quốc gia hoặc vùng lãnh thổ của bạn">
                    <Select value={s.country} onChange={(v) => set("country", v)} options={COUNTRIES} className="min-w-[180px]" />
                </Row>
                <Row label="Định dạng ngày" desc="Cách hiển thị ngày, tháng, năm">
                    <Select value={s.dateFormat} onChange={(v) => set("dateFormat", v)} options={DATE_FORMATS} className="min-w-[240px]" />
                </Row>
                <Row label="Định dạng giờ" desc="Hiển thị theo kiểu 12 giờ hoặc 24 giờ">
                    <div className="flex rounded-xl overflow-hidden border border-slate-200">
                        {[
                            { v: "12h", label: "12 giờ" },
                            { v: "24h", label: "24 giờ" },
                        ].map(({ v, label }) => (
                            <button
                                key={v}
                                type="button"
                                onClick={() => set("timeFormat", v)}
                                className={`px-5 py-2 text-sm font-semibold transition
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
function TimezoneSection({ s, set }) {
    return (
        <div className="space-y-6">
            <SectionLabel>Múi giờ</SectionLabel>
            <Card>
                <Row
                    label="Hiển thị múi giờ phụ"
                    desc="Thêm một cột múi giờ thứ hai trên lưới lịch"
                >
                    <Toggle checked={s.showSecondaryTimezone} onChange={(v) => set("showSecondaryTimezone", v)} />
                </Row>
                <Row label="Múi giờ chính" desc="Múi giờ mặc định của bạn">
                    <Select value={s.primaryTimezone} onChange={(v) => set("primaryTimezone", v)} options={TIMEZONES} className="min-w-[220px]" />
                </Row>
                <Row
                    label="Múi giờ phụ"
                    desc={s.showSecondaryTimezone ? "Múi giờ thứ hai hiển thị bên cạnh" : "Bật tuỳ chọn phía trên để dùng tính năng này"}
                    disabled={!s.showSecondaryTimezone}
                >
                    <Select value={s.secondaryTimezone} onChange={(v) => set("secondaryTimezone", v)} options={TIMEZONES} className="min-w-[220px]" />
                </Row>
            </Card>
        </div>
    );
}

// ── Section: Cài đặt sự kiện ──────────────────────────────────────────────────
function EventsSection({ s, set }) {
    return (
        <div className="space-y-6">
            <SectionLabel>Cài đặt sự kiện</SectionLabel>
            <Card>
                <Row label="Link Meet mặc định" desc="Tự động điền vào mỗi sự kiện mới tạo">
                    <Input
                        value={s.defaultMeetLink}
                        onChange={(v) => set("defaultMeetLink", v)}
                        placeholder="https://meet.google.com/..."
                        icon={Video}
                    />
                </Row>
                <Row label="Vị trí mặc định" desc="Địa điểm được điền sẵn khi tạo sự kiện">
                    <Input
                        value={s.defaultLocation}
                        onChange={(v) => set("defaultLocation", v)}
                        placeholder="Nhập địa điểm..."
                        icon={MapPin}
                    />
                </Row>
            </Card>
        </div>
    );
}

// ── Section: Thông báo ────────────────────────────────────────────────────────
function NotificationsSection({ s, set }) {
    const NOTIF_OPTS = [
        { value: "off", label: "Tắt", desc: "Không nhận bất kỳ thông báo nào" },
        { value: "screen", label: "Thông báo trên màn hình", desc: "Hiện popup bên trong ứng dụng" },
        { value: "push", label: "Thông báo đẩy", desc: "Thông báo từ trình duyệt / hệ thống" },
    ];
    return (
        <div className="space-y-6">
            <SectionLabel>Cài đặt thông báo</SectionLabel>

            {/* Radio group */}
            <Card>
                <div className="px-5 py-4 border-b border-slate-50">
                    <p className="text-sm font-semibold text-slate-700 mb-4">Loại thông báo</p>
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
                    label="Nhắc nhở trước"
                    desc="Hiển thị thông báo bao nhiêu phút trước khi sự kiện bắt đầu"
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
                        <span className="text-sm text-slate-500 font-medium">phút</span>
                    </div>
                </Row>
            </Card>
        </div>
    );
}

// ── Section: Tuỳ chọn xem ─────────────────────────────────────────────────────
function ViewSection({ s, set }) {
    const TOGGLES = [
        { key: "showWeekends", label: "Hiển thị các ngày cuối tuần", desc: "Hiện Thứ Bảy và Chủ Nhật trên lưới lịch" },
        { key: "showCompletedTasks", label: "Hiển thị việc cần làm đã hoàn tất", desc: "Các task đã đánh dấu xong vẫn hiện trên lịch" },
        { key: "showWeekNumbers", label: "Hiện số tuần", desc: "Số thứ tự tuần trong năm (1–52)" },
        { key: "dimPastEvents", label: "Giảm độ sáng sự kiện trước đây", desc: "Làm mờ nhẹ sự kiện đã qua để dễ phân biệt" },
    ];
    return (
        <div className="space-y-6">
            <SectionLabel>Tuỳ chọn xem</SectionLabel>
            <Card>
                {TOGGLES.map((item) => (
                    <Row key={item.key} label={item.label} desc={item.desc}>
                        <Toggle checked={s[item.key]} onChange={(v) => set(item.key, v)} />
                    </Row>
                ))}
            </Card>
            <Card>
                <Row label="Bắt đầu tuần vào" desc="Ngày đầu tiên hiển thị trong mỗi hàng tuần">
                    <Select value={s.weekStartDay} onChange={(v) => set("weekStartDay", v)} options={WEEK_DAYS} className="min-w-[160px]" />
                </Row>
            </Card>
        </div>
    );
}

// ── Section: Lịch yêu thích ───────────────────────────────────────────────────
function CalendarsSection({ s, set }) {
    const [newHoliday, setNewHoliday] = useState("");
    const [customHolidays, setCustomHolidays] = useState(s.customHolidays || []);

    const addHoliday = () => {
        const name = newHoliday.trim();
        if (!name) return;
        const updated = [...customHolidays, { id: Date.now(), name }];
        setCustomHolidays(updated);
        set("customHolidays", updated);
        setNewHoliday("");
    };

    const removeHoliday = (id) => {
        const updated = customHolidays.filter((h) => h.id !== id);
        setCustomHolidays(updated);
        set("customHolidays", updated);
    };

    return (
        <div className="space-y-6">
            <SectionLabel>Duyệt qua lịch yêu thích</SectionLabel>

            {/* Preset holidays */}
            <Card>
                <Row label="🇻🇳  Ngày lễ ở Việt Nam" desc="Tết Nguyên Đán, 30/4, 2/9 và các ngày lễ quốc gia">
                    <Toggle checked={s.vietnamHolidays} onChange={(v) => set("vietnamHolidays", v)} />
                </Row>
                <Row label="🌍  Ngày lễ thế giới" desc="Giáng sinh, Tết Dương Lịch, Halloween...">
                    <Toggle checked={s.worldHolidays} onChange={(v) => set("worldHolidays", v)} />
                </Row>
                <Row label="🗓  Ngày lễ khác" desc="Ngày lễ của các tôn giáo và văn hóa khác">
                    <Toggle checked={s.otherHolidays} onChange={(v) => set("otherHolidays", v)} />
                </Row>
            </Card>

            {/* Custom holidays */}
            <Card>
                <div className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-700 mb-1">Thêm các ngày lễ tuỳ chỉnh</p>
                    <p className="text-xs text-slate-400 mb-4">Thêm ngày lễ riêng của bạn để hiển thị trên lịch</p>

                    {/* Input row */}
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newHoliday}
                            onChange={(e) => setNewHoliday(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addHoliday()}
                            placeholder="VD: Ngày thành lập công ty..."
                            className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700
                placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                        />
                        <button
                            type="button"
                            onClick={addHoliday}
                            disabled={!newHoliday.trim()}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400
                text-white text-sm font-semibold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> Thêm
                        </button>
                    </div>

                    {/* Custom list */}
                    {customHolidays.length > 0 ? (
                        <div className="space-y-1.5">
                            {customHolidays.map((h) => (
                                <div
                                    key={h.id}
                                    className="flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition group"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                                        <span className="text-sm text-slate-700 font-medium">{h.name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeHoliday(h.id)}
                                        className="text-slate-300 hover:text-red-500 transition p-1 opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-slate-300">
                            <p className="text-xs">Chưa có ngày lễ tuỳ chỉnh nào</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function SettingsModal({ isOpen, onClose, onSave }) {
    const [activeSection, setActiveSection] = useState("language");
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [saveState, setSaveState] = useState("idle"); // "idle" | "saved"

    if (!isOpen) return null;

    const set = (key, value) =>
        setSettings((prev) => ({ ...prev, [key]: value }));

    const handleSave = () => {
        onSave?.(settings);
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2200);
    };

    const SECTION_CONTENT = {
        language: <LanguageSection s={settings} set={set} />,
        timezone: <TimezoneSection s={settings} set={set} />,
        events: <EventsSection s={settings} set={set} />,
        notifications: <NotificationsSection s={settings} set={set} />,
        view: <ViewSection s={settings} set={set} />,
        calendars: <CalendarsSection s={settings} set={set} />,
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
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                            <Settings className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 leading-tight">Cài đặt</h2>
                            <p className="text-xs text-slate-400">Tuỳ chỉnh lịch của bạn</p>
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
                        {SECTIONS.map(({ key, label, Icon }) => {
                            const active = activeSection === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setActiveSection(key)}
                                    className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all text-left
                    ${active
                                            ? "text-blue-600 bg-blue-50 border-r-[3px] border-blue-600"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-blue-600" : "text-slate-400"}`} />
                                    <span className="truncate">{label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Content area */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {SECTION_CONTENT[activeSection]}
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-between px-8 py-4 bg-white border-t border-slate-200 flex-shrink-0">
                    <p className="text-xs text-slate-400">
                        Cài đặt áp dụng cho phiên hiện tại
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                        >
                            Huỷ
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
                                <><Check className="w-4 h-4" /> Đã lưu!</>
                            ) : (
                                "Lưu cài đặt"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}