"use client";
import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Link, MapPin, AlignLeft, Paperclip, Palette, Tag, X, Repeat, Layers } from 'lucide-react';
import { FieldRow, InputBase, TextareaBase, EVENT_COLORS, toDateInputVal, toTimeInputVal, DateTimeSelector } from './FormHelpers';
import { t } from '@/lib/i18n';

// ── Extracted Components ──
import { useEventGuests } from './event/useEventGuests';
import EventGuests from './event/EventGuests';
import RecurrenceSelector from './event/RecurrenceSelector';

export default function EventForm({ now, duration, isInteracting, onSave, initialData = null, appSettings, currentUser }) {
    const lang = appSettings?.language || "vi";
    const oneHourLater = new Date(now.getTime() + (duration || 60) * 60 * 1000);

    const [form, setForm] = useState({
        title:           initialData?.title || '',
        date:            initialData?.date_display || toDateInputVal(now),
        timeStart:       initialData?.time_start_display || toTimeInputVal(now),
        timeEnd:         initialData?.time_end_display || toTimeInputVal(oneHourLater),
        link:            initialData?.link || (!initialData ? appSettings?.defaultMeetLink : '') || '',
        location:        initialData?.location || (!initialData ? appSettings?.defaultLocation : '') || '',
        description:     initialData?.description || '',
        color:           initialData?.color || 'blue',
        category:        initialData?.category || 'Mặc định',
        recurrence_rule: initialData?.recurrence_rule || '',
        calendar_group:  initialData?.calendar_group || '',
    });

    const [submitted, setSubmitted] = useState(false);
    const [selectedFile, setSelectedFile] = useState(() => {
        if (initialData?.attachment) {
            const fileName = initialData.attachment.split('/').pop();
            return { name: fileName, url: initialData.attachment, isExisting: true };
        }
        return null;
    });

    // ── Guests Hook ──
    const {
        guests, showGuestPicker, setShowGuestPicker,
        guestSearch, setGuestSearch, filteredFriends,
        toggleGuest, togglePermission
    } = useEventGuests({ initialData, currentUser });

    // Đồng bộ ngày/giờ theo vị trí thả khi tạo mới hoặc đang kéo (giữ nguyên khi người dùng tự sửa)
    const [timeSyncKey, setTimeSyncKey] = useState(null);
    const syncKey = (initialData && !isInteracting)
        ? 'stable'
        : `${toDateInputVal(now)}|${toTimeInputVal(now)}|${duration || 60}`;
    if (syncKey !== timeSyncKey) {
        setTimeSyncKey(syncKey);
        const end = new Date(now.getTime() + (duration || 60) * 60 * 1000);
        setForm(p => ({
            ...p,
            date: toDateInputVal(now),
            timeStart: toTimeInputVal(now),
            timeEnd: toTimeInputVal(end),
        }));
    }

    const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleRemoveFile = (e) => {
        e.preventDefault(); e.stopPropagation();
        setSelectedFile(null);
    };

    const handleSave = () => {
        setSubmitted(true);
        if (!form.title.trim()) return;

        let finalTimeEnd = form.timeEnd;
        const startDateTime = new Date(`${form.date}T${form.timeStart}`);
        const endDateTime = new Date(`${form.date}T${form.timeEnd}`);
        
        if (startDateTime >= endDateTime) {
            // Tự động điều chỉnh timeEnd = timeStart + 1 giờ (hoặc ít nhất lớn hơn timeStart)
            const correctedEnd = new Date(startDateTime.getTime() + 60 * 60 * 1000);
            finalTimeEnd = toTimeInputVal(correctedEnd);
        }

        onSave?.({
            type: 'event',
            ...form,
            timeEnd: finalTimeEnd,
            recurrence_rule: form.recurrence_rule || null,
            calendar_group: form.calendar_group || null,
            file: selectedFile,
            guests
        });
    };

    const isTitleEmpty = submitted && !form.title.trim();
    const canEdit = !initialData || initialData.is_owner || initialData.my_permission === 'edit';
    const isOwner = !initialData || initialData.is_owner;

    return (
        <div className="space-y-4 py-2">
            <FieldRow icon={CalendarIcon}>
                <div className="flex-1 min-w-0">
                    <InputBase type="text" placeholder={t('create_modal.title_placeholder', lang)}
                        value={form.title} onChange={set('title')}
                        className={`font-medium text-base ${isTitleEmpty ? 'border-red-300 ring-1 ring-red-50' : ''}`} />
                    {isTitleEmpty && (
                        <p className="text-[10px] text-red-500 mt-1 ml-1 animate-pulse">{t('create_modal.title_required', lang)}</p>
                    )}
                </div>
            </FieldRow>

            <FieldRow icon={Clock}>
                <DateTimeSelector 
                    date={form.date} 
                    timeStart={form.timeStart} 
                    timeEnd={form.timeEnd}
                    timeFormat={appSettings?.timeFormat}
                    lang={lang}
                >
                    <div className="flex flex-col gap-3">
                        <InputBase type="date" value={form.date} onChange={set('date')} />
                        <div className="flex items-center gap-2">
                            <InputBase type="time" value={form.timeStart} onChange={set('timeStart')} className="flex-1" />
                            <span className="text-slate-400 dark:text-[#9e9e9e] text-sm">→</span>
                            <InputBase type="time" value={form.timeEnd} onChange={set('timeEnd')} className="flex-1" />
                        </div>
                    </div>
                </DateTimeSelector>
            </FieldRow>

            <FieldRow icon={Link}>
                <InputBase type="url" placeholder={t('event_settings.meet_link_desc', lang)}
                    value={form.link} onChange={set('link')} />
            </FieldRow>

            <FieldRow icon={MapPin}>
                <InputBase type="text" placeholder={t('create_modal.location_placeholder', lang)}
                    value={form.location} onChange={set('location')} />
            </FieldRow>

            <FieldRow icon={AlignLeft}>
                <TextareaBase placeholder={t('create_modal.description_placeholder', lang)}
                    value={form.description} onChange={set('description')} />
            </FieldRow>

            <FieldRow icon={Paperclip}>
                {!selectedFile ? (
                    <label className="flex items-center justify-between w-full px-3 py-2 text-sm border border-dashed border-slate-300 dark:border-[#484848] rounded-lg hover:border-blue-400 hover:bg-blue-50/30 dark:hover:border-[#bdbdbd] dark:hover:bg-[#353535] transition-all cursor-pointer group">
                        <input type="file" className="hidden" onChange={handleFileChange} />
                        <span className="text-slate-500 dark:text-[#9e9e9e] group-hover:text-blue-600 dark:group-hover:text-[#e3e3e3] transition-colors">{t('create_modal.attach_file', lang)}</span>
                        <span className="text-[10px] text-slate-400 dark:text-[#9e9e9e] bg-slate-100 dark:bg-[#353535] px-1.5 py-0.5 rounded group-hover:bg-blue-100 group-hover:text-blue-500 dark:group-hover:bg-[#484848] dark:group-hover:text-[#e3e3e3] transition-all">{t('create_modal.upload', lang)}</span>
                    </label>
                ) : (
                    <div className="flex items-center justify-between w-full px-3 py-2 text-sm border border-blue-200 bg-blue-50/50 dark:border-[#484848] dark:bg-[#353535] rounded-lg group animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded bg-blue-100 dark:bg-[#484848] flex items-center justify-center flex-shrink-0">
                                <Paperclip className="w-4 h-4 text-blue-600 dark:text-[#e3e3e3]" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                {selectedFile.isExisting ? (
                                    <a href={selectedFile.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-medium truncate text-[13px] hover:underline">
                                        {selectedFile.name}
                                    </a>
                                ) : (
                                    <span className="text-slate-700 dark:text-[#e3e3e3] font-medium truncate text-[13px]">{selectedFile.name}</span>
                                )}
                                <span className="text-slate-400 dark:text-[#9e9e9e] text-[10px]">
                                    {!selectedFile.isExisting && selectedFile.size ? (selectedFile.size / 1024).toFixed(1) + ' KB' : 'Đính kèm'}
                                </span>
                            </div>
                        </div>
                        <button type="button" onClick={handleRemoveFile} className="p-1.5 text-slate-400 dark:text-[#9e9e9e] hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </FieldRow>

            <FieldRow icon={Tag}>
                {isOwner ? (
                    <select value={form.category} onChange={set('category')}
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-[#484848] rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-slate-50 dark:bg-[#1f1f1f] text-slate-800 dark:text-[#e3e3e3] cursor-pointer">
                        {appSettings?.customCategories?.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                ) : (
                    <div className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-[#484848] rounded-lg bg-slate-100 dark:bg-[#2a2a2a] text-slate-500 dark:text-[#9e9e9e] cursor-not-allowed">
                        {initialData?.owner_email}
                    </div>
                )}
            </FieldRow>

            <FieldRow icon={Repeat}>
                <RecurrenceSelector
                    value={form.recurrence_rule}
                    onChange={v => setForm(p => ({ ...p, recurrence_rule: v }))}
                    lang={lang}
                />
            </FieldRow>

            <FieldRow icon={Palette}>
                <div className="flex gap-2 flex-wrap">
                    {EVENT_COLORS.map(c => (
                        <button key={c.value} title={c.label}
                            type="button"
                            onClick={() => setForm(p => ({ ...p, color: c.value }))}
                            className={`w-7 h-7 rounded-full ${c.cls} transition-transform hover:scale-110
                                ${form.color === c.value ? 'ring-2 ring-offset-2 dark:ring-offset-[#2d2d2d] ring-slate-400 dark:ring-[#484848] scale-110' : ''}`}
                        />
                    ))}
                </div>
            </FieldRow>

            <EventGuests
                guests={guests}
                showGuestPicker={showGuestPicker}
                setShowGuestPicker={setShowGuestPicker}
                guestSearch={guestSearch}
                setGuestSearch={setGuestSearch}
                filteredFriends={filteredFriends}
                toggleGuest={toggleGuest}
                togglePermission={togglePermission}
                isOwner={isOwner}
                lang={lang}
            />

            <button id="__eventSave" className="hidden" onClick={handleSave} />
        </div>
    );
}