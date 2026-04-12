"use client";
import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, AlignLeft } from 'lucide-react';
import { FieldRow, InputBase, TextareaBase, toDateInputVal, toTimeInputVal, DateTimeSelector } from './FormHelpers';

export default function AppointmentForm({ now, onSave }) {
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const [form, setForm] = useState({
        title:    '',
        date:     toDateInputVal(now),
        timeStart: toTimeInputVal(now),
        timeEnd:   toTimeInputVal(oneHourLater),
        location: '',
        note:     '',
    });

    const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

    const handleSave = () => {
        if (!form.title.trim()) return alert('Vui lòng nhập tiêu đề lịch hẹn!');
        onSave?.({ type: 'appointment', ...form });
    };

    return (
        <div className="space-y-4 py-2">
            <FieldRow icon={CalendarIcon}>
                <InputBase type="text" placeholder="Tiêu đề lịch hẹn"
                    value={form.title} onChange={set('title')}
                    className="font-medium text-base" />
            </FieldRow>

            <FieldRow icon={Clock}>
                <DateTimeSelector date={form.date} timeStart={form.timeStart} timeEnd={form.timeEnd}>
                    <div className="flex flex-col gap-3">
                        <InputBase type="date" value={form.date} onChange={set('date')} />
                        <div className="flex items-center gap-2">
                            <InputBase type="time" value={form.timeStart} onChange={set('timeStart')} className="flex-1" />
                            <span className="text-slate-400 text-sm flex-shrink-0">đến</span>
                            <InputBase type="time" value={form.timeEnd}   onChange={set('timeEnd')}   className="flex-1" />
                        </div>
                    </div>
                </DateTimeSelector>
            </FieldRow>

            <FieldRow icon={MapPin}>
                <InputBase type="text" placeholder="Thêm vị trí"
                    value={form.location} onChange={set('location')} />
            </FieldRow>

            <FieldRow icon={AlignLeft}>
                <TextareaBase placeholder="Ghi chú thêm"
                    value={form.note} onChange={set('note')} />
            </FieldRow>

            <button id="__appointmentSave" className="hidden" onClick={handleSave} />
        </div>
    );
}