"use client";
import { useState } from 'react';
import { CheckSquare, Clock, Calendar as CalendarIcon, AlignLeft } from 'lucide-react';
import { FieldRow, InputBase, TextareaBase, toDateInputVal, toTimeInputVal, DateTimeSelector } from './FormHelpers';

export default function TaskForm({ now, onSave }) {
    const [form, setForm] = useState({
        title:       '',
        date:        toDateInputVal(now),
        time:        toTimeInputVal(now),
        deadlineDate: toDateInputVal(now),
        deadlineTime: toTimeInputVal(now),
        description: '',
    });

    const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

    const handleSave = () => {
        if (!form.title.trim()) return alert('Vui lòng nhập tên việc cần làm!');
        onSave?.({ type: 'task', ...form });
    };

    return (
        <div className="space-y-4 py-2">
            <FieldRow icon={CheckSquare}>
                <InputBase type="text" placeholder="Tên việc cần làm"
                    value={form.title} onChange={set('title')}
                    className="font-medium text-base" />
            </FieldRow>

            <FieldRow icon={Clock}>
                <DateTimeSelector date={form.date} timeStart={form.time}>
                    <div className="flex flex-col gap-3">
                        <InputBase type="date" value={form.date} onChange={set('date')} />
                        <InputBase type="time" value={form.time} onChange={set('time')} />
                    </div>
                </DateTimeSelector>
            </FieldRow>

            <FieldRow icon={CalendarIcon}>
                <DateTimeSelector date={form.deadlineDate} timeStart={form.deadlineTime}>
                    <div className="flex flex-col gap-3">
                        <label className="text-xs text-slate-500 font-medium">Thời hạn</label>
                        <InputBase type="date" value={form.deadlineDate} onChange={set('deadlineDate')} />
                        <InputBase type="time" value={form.deadlineTime} onChange={set('deadlineTime')} />
                    </div>
                </DateTimeSelector>
            </FieldRow>

            <FieldRow icon={AlignLeft}>
                <TextareaBase placeholder="Nội dung mô tả"
                    value={form.description} onChange={set('description')} />
            </FieldRow>

            <button id="__taskSave" className="hidden" onClick={handleSave} />
        </div>
    );
}