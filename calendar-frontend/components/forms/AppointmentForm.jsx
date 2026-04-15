"use client";
import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, AlignLeft, Paperclip, Tag, Palette, X } from 'lucide-react';
import { FieldRow, InputBase, TextareaBase, toDateInputVal, toTimeInputVal, DateTimeSelector, EVENT_COLORS, CALENDAR_CATEGORIES } from './FormHelpers';

export default function AppointmentForm({ now, duration, onSave, initialData = null }) {
    const oneHourLater = new Date(now.getTime() + (duration || 60) * 60 * 1000);

    const [form, setForm] = useState({
        title:    initialData?.title || '',
        date:     initialData?.date_display || toDateInputVal(now),
        timeStart: initialData?.time_start_display || toTimeInputVal(now),
        timeEnd:   initialData?.time_end_display || toTimeInputVal(oneHourLater),
        location: initialData?.location || '',
        note:     initialData?.description || initialData?.note || '',
        category: initialData?.category || 'Mặc định',
        color:    initialData?.color || 'blue',
    });

    const [submitted, setSubmitted] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        if (initialData) return;
        const end = new Date(now.getTime() + (duration || 60) * 60 * 1000);
        setForm(p => ({
            ...p,
            date: toDateInputVal(now),
            timeStart: toTimeInputVal(now),
            timeEnd: toTimeInputVal(end),
        }));
    }, [now, duration, initialData]);

    const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile({
                name: file.name,
                size: (file.size / 1024).toFixed(1) + ' KB',
            });
        }
    };

    const handleRemoveFile = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedFile(null);
    };

    const handleSave = () => {
        setSubmitted(true);
        if (!form.title.trim()) return;
        onSave?.({ type: 'appointment', ...form, file: selectedFile });
    };

    const isTitleEmpty = submitted && !form.title.trim();

    return (
        <div className="space-y-4 py-2">
            <FieldRow icon={CalendarIcon}>
                <div className="flex-1 min-w-0">
                    <InputBase type="text" placeholder="Tiêu đề lịch hẹn"
                        value={form.title} onChange={set('title')}
                        className={`font-medium text-base ${isTitleEmpty ? 'border-red-300 ring-1 ring-red-50' : ''}`} />
                    {isTitleEmpty && (
                        <p className="text-[10px] text-red-500 mt-1 ml-1 animate-pulse">Tiêu đề không được để trống</p>
                    )}
                </div>
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

            <FieldRow icon={Paperclip}>
                {!selectedFile ? (
                    <label className="flex items-center justify-between w-full px-3 py-2 text-sm border border-dashed border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group">
                        <input type="file" className="hidden" onChange={handleFileChange} />
                        <span className="text-slate-500 group-hover:text-blue-600 transition-colors">Đính kèm tệp</span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded group-hover:bg-blue-100 group-hover:text-blue-500 transition-all">Tải lên</span>
                    </label>
                ) : (
                    <div className="flex items-center justify-between w-full px-3 py-2 text-sm border border-blue-200 bg-blue-50/50 rounded-lg group animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Paperclip className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-slate-700 font-medium truncate text-[13px]">{selectedFile.name}</span>
                                <span className="text-slate-400 text-[10px]">{selectedFile.size}</span>
                            </div>
                        </div>
                        <button 
                            onClick={handleRemoveFile}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                            title="Gỡ bỏ"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </FieldRow>

            <FieldRow icon={Tag}>
                <select
                    value={form.category}
                    onChange={set('category')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-slate-50 cursor-pointer"
                >
                    {CALENDAR_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                </select>
            </FieldRow>

            <FieldRow icon={Palette}>
                <div className="flex gap-2 flex-wrap">
                    {EVENT_COLORS.map(c => (
                        <button key={c.value} title={c.label}
                            type="button"
                            onClick={() => setForm(p => ({ ...p, color: c.value }))}
                            className={`w-7 h-7 rounded-full ${c.cls} transition-transform hover:scale-110
                                ${form.color === c.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                        />
                    ))}
                </div>
            </FieldRow>

            <button id="__appointmentSave" className="hidden" onClick={handleSave} />
        </div>
    );
}