import React from "react";
import { t } from "@/lib/i18n";
import { SectionLabel, Card, Row } from "./SharedUI";

export default function Notification({ s, set, lang }) {
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
