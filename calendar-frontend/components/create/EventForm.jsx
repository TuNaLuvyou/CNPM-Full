"use client";
import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Link, MapPin, AlignLeft, Paperclip, Palette } from 'lucide-react';
import { FieldRow, InputBase, TextareaBase, EVENT_COLORS, toDateInputVal, toTimeInputVal, DateTimeSelector } from './FormHelpers';

export default function EventForm({ now, onSave }) {
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const [form, setForm] = useState({
        title:       '',
        date:        toDateInputVal(now),
        timeStart:   toTimeInputVal(now),
        timeEnd:     toTimeInputVal(oneHourLater),
        link:        '',
        location:    '',
        description: '',
        color:       'blue',
    });

    const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

    const handleSave = () => {
        if (!form.title.trim()) return alert('Vui lòng nhập tiêu đề!');
        onSave?.({
            type:      'event',
            ...form,
        });
    };

    return (
        <div className="space-y-4 py-2">
            <FieldRow icon={CalendarIcon}>
                <InputBase
                    type="text"
                    placeholder="Thêm tiêu đề"
                    value={form.title}
                    onChange={set('title')}
                    className="font-medium text-base"
                />
            </FieldRow>

            <FieldRow icon={Clock}>
                <DateTimeSelector date={form.date} timeStart={form.timeStart} timeEnd={form.timeEnd}>
                    <div className="flex flex-col gap-3">
                        <InputBase type="date" value={form.date} onChange={set('date')} />
                        <div className="flex items-center gap-2">
                            <InputBase type="time" value={form.timeStart} onChange={set('timeStart')} className="flex-1" />
                            <span className="text-slate-400 text-sm">→</span>
                            <InputBase type="time" value={form.timeEnd} onChange={set('timeEnd')} className="flex-1" />
                        </div>
                    </div>
                </DateTimeSelector>
            </FieldRow>

            <FieldRow icon={Link}>
                <InputBase type="url" placeholder="Link Google Classroom / Meet..."
                    value={form.link} onChange={set('link')} />
            </FieldRow>

            <FieldRow icon={MapPin}>
                <InputBase type="text" placeholder="Thêm vị trí"
                    value={form.location} onChange={set('location')} />
            </FieldRow>

            <FieldRow icon={AlignLeft}>
                <TextareaBase placeholder="Thêm mô tả"
                    value={form.description} onChange={set('description')} />
            </FieldRow>

            <FieldRow icon={Paperclip}>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-blue-600 hover:underline w-fit">
                    <input type="file" className="hidden" />
                    Đính kèm tệp
                </label>
            </FieldRow>

            <FieldRow icon={Palette}>
                <div className="flex gap-2 flex-wrap">
                    {EVENT_COLORS.map(c => (
                        <button key={c.value} title={c.label}
                            onClick={() => setForm(p => ({ ...p, color: c.value }))}
                            className={`w-7 h-7 rounded-full ${c.cls} transition-transform hover:scale-110
                                ${form.color === c.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                        />
                    ))}
                </div>
            </FieldRow>

            {/* Hidden trigger để CreateModal gọi */}
            <button id="__eventSave" className="hidden" onClick={handleSave} />
        </div>
    );
}