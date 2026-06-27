import React from "react";
import { t } from "@/lib/i18n";
import { SectionLabel, Card, Row } from "./SharedUI";

export default function Notification({ s, set, lang }) {
    const NOTIF_OPTS = [
        { value: "off", label: t('notif_settings.off', lang), desc: t('notif_settings.off_desc', lang) },
        { value: "app", label: t('notif_settings.app', lang), desc: t('notif_settings.app_desc', lang) },
        { value: "email", label: t('notif_settings.email', lang), desc: t('notif_settings.email_desc', lang) },
        { value: "both", label: t('notif_settings.both', lang), desc: t('notif_settings.both_desc', lang) },
    ];
    return (
        <div id="section-notifications" className="space-y-6 scroll-mt-6">
            <SectionLabel>{t('notif_settings.title', lang)}</SectionLabel>

            {/* Radio group */}
            <Card>
                <div className="px-5 py-4 border-b border-slate-50 dark:border-[#484848]">
                    <p className="text-sm font-semibold text-slate-700 dark:text-white mb-4">{t('notif_settings.type', lang)}</p>
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
                                        {active && <span className="w-2 h-2 bg-white dark:bg-[#2d2d2d] rounded-full block" />}
                                    </div>
                                    <div onClick={() => set("notificationType", opt.value)}>
                                        <p className="text-sm font-medium text-slate-700 dark:text-white">{opt.label}</p>
                                        <p className="text-xs text-slate-400 dark:text-white mt-0.5">{opt.desc}</p>
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
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") {
                                    set("notificationMinutes", "");
                                } else {
                                    const num = parseInt(val, 10);
                                    if (!isNaN(num)) {
                                        set("notificationMinutes", Math.min(120, num));
                                    }
                                }
                            }}
                            onBlur={() => {
                                if (s.notificationMinutes === "" || Number(s.notificationMinutes) < 1) {
                                    set("notificationMinutes", 1);
                                }
                            }}
                            className="w-16 text-sm text-center border border-slate-200 dark:border-[#484848] dark:bg-[#1f1f1f] rounded-xl px-2 py-2 text-slate-700 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                        />
                        <span className="text-sm text-slate-500 dark:text-white font-medium">{t('notif_settings.minutes', lang)}</span>
                    </div>
                </Row>
            </Card>
        </div>
    );
}
