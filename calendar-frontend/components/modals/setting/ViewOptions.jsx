import React from "react";
import { t } from "@/lib/i18n";
import { SectionLabel, Card, Row, Toggle, Select } from "./SharedUI";

const WEEK_DAYS = [
    { value: "monday",    label: "Thứ Hai" },
    { value: "tuesday",   label: "Thứ Ba" },
    { value: "wednesday", label: "Thứ Tư" },
    { value: "thursday",  label: "Thứ Năm" },
    { value: "friday",    label: "Thứ Sáu" },
    { value: "saturday",  label: "Thứ Bảy" },
    { value: "sunday",    label: "Chủ Nhật" },
];

const THEME_ICONS = { light: "☀️", dark: "🌙", system: "💻" };

export default function ViewOptions({ s, set, lang }) {
    const THEME_OPTIONS = [
        { value: "light",  label: t('view_options.theme_light',  lang) },
        { value: "dark",   label: t('view_options.theme_dark',   lang) },
        { value: "system", label: t('view_options.theme_system', lang) },
    ];

    const TOGGLES = [
        { key: "showWeekends",       label: t('view_options.show_weekends', lang),   desc: t('view_options.show_weekends_desc', lang) },
        { key: "showCompletedTasks", label: t('view_options.show_completed', lang),  desc: t('view_options.show_completed_desc', lang) },
        { key: "showWeekNumbers",    label: t('view_options.show_week_num', lang),   desc: t('view_options.show_week_num_desc', lang) },
        { key: "showFriendsCalendars", label: t('view_options.show_friends_calendars', lang),   desc: t('view_options.show_friends_calendars_desc', lang) },
    ];

    return (
        <div id="section-view" className="space-y-6 scroll-mt-6">
            <SectionLabel>{t('view_options.title', lang)}</SectionLabel>

            {/* Theme selector */}
            <Card>
                <Row label={t('view_options.theme', lang)} desc={t('view_options.theme_desc', lang)}>
                    <div className="flex gap-2">
                        {THEME_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => set("theme", opt.value)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition cursor-pointer
                                    ${s.theme === opt.value
                                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                                    }`}
                            >
                                <span>{THEME_ICONS[opt.value]}</span>
                                <span>{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </Row>
            </Card>

            {/* Toggle group */}
            <Card>
                {TOGGLES.map((item) => (
                    <Row key={item.key} label={item.label} desc={item.desc}>
                        <Toggle checked={s[item.key]} onChange={(v) => set(item.key, v)} />
                    </Row>
                ))}
            </Card>

            {/* Week starts on */}
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
