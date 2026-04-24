import React from "react";
import { t } from "@/lib/i18n";
import { SectionLabel, Card, Row, Input } from "./SharedUI";

export default function EventSettings({ s, set, lang }) {
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
