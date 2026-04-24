import React from "react";
import { t } from "@/lib/i18n";
import { SectionLabel, Card, Row, Select } from "./SharedUI";

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

export default function LanguageRegion({ s, set, lang }) {
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
