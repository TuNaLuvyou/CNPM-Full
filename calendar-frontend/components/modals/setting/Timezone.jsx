import React from "react";
import { t } from "@/lib/i18n";
import { SectionLabel, Card, Row, Toggle, Select } from "./SharedUI";

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

export default function Timezone({ s, set, lang }) {
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
