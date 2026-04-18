"use client";
import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Link, MapPin, AlignLeft, Paperclip, Palette, Tag, X, Users, Shield, ShieldCheck, Plus, Search, Check, ChevronDown } from 'lucide-react';
import { FieldRow, InputBase, TextareaBase, EVENT_COLORS, toDateInputVal, toTimeInputVal, DateTimeSelector, CALENDAR_CATEGORIES } from './FormHelpers';
import { getFriends } from '@/lib/api';
import { t } from '@/lib/i18n';

export default function EventForm({ now, duration, isInteracting, onSave, initialData = null, appSettings, currentUser }) {
    const lang = appSettings?.language || "vi";
    const oneHourLater = new Date(now.getTime() + (duration || 60) * 60 * 1000);

    const [form, setForm] = useState({
        title:       initialData?.title || '',
        date:        initialData?.date_display || toDateInputVal(now),
        timeStart:   initialData?.time_start_display || toTimeInputVal(now),
        timeEnd:     initialData?.time_end_display || toTimeInputVal(oneHourLater),
        link:        initialData?.link || (!initialData ? appSettings?.defaultMeetLink : '') || '',
        location:    initialData?.location || (!initialData ? appSettings?.defaultLocation : '') || '',
        description: initialData?.description || '',
        color:       initialData?.color || 'blue',
        category:    initialData?.category || 'Mặc định',
    });

    const [submitted, setSubmitted] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    // ── Guests State ──
    const [friends, setFriends] = useState([]);
    const [guests, setGuests] = useState(initialData?.invitations || []);
    const [showGuestPicker, setShowGuestPicker] = useState(false);
    const [guestSearch, setGuestSearch] = useState("");

    const filteredFriends = friends.map(conn => {
        const isSender = conn.sender === currentUser?.id;
        return {
            id: isSender ? conn.receiver : conn.sender,
            username: isSender ? conn.receiver_name : conn.sender_name,
            email: isSender ? conn.receiver_email : conn.sender_email,
            first_name: isSender ? conn.receiver_name : conn.sender_name, // Fallback to username for name
        };
    }).filter(f => {
        if (!guestSearch) return true;
        const s = guestSearch.toLowerCase();
        return (f.username?.toLowerCase().includes(s) || 
                f.first_name?.toLowerCase().includes(s) || 
                f.email?.toLowerCase().includes(s));
    });

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
            getFriends().then(setFriends).catch(console.error);
        }
    }, []);

    const toggleGuest = (friend) => {
        setGuests(prev => {
            const exists = prev.find(g => g.invitee === friend.id);
            if (exists) return prev.filter(g => g.invitee !== friend.id);
            return [...prev, { 
                invitee: friend.id, 
                invitee_details: { username: friend.username, name: friend.first_name || friend.username },
                permission: 'view',
                status: 'pending' 
            }];
        });
    };

    const togglePermission = (uid) => {
        setGuests(prev => prev.map(g => 
            g.invitee === uid 
                ? { ...g, permission: g.permission === 'view' ? 'edit' : 'view' } 
                : g
        ));
    };

    useEffect(() => {
        if (initialData && !isInteracting) return;
        const end = new Date(now.getTime() + (duration || 60) * 60 * 1000);
        setForm(p => ({
            ...p,
            date: toDateInputVal(now),
            timeStart: toTimeInputVal(now),
            timeEnd: toTimeInputVal(end),
        }));
    }, [now, duration, initialData, isInteracting]);

    useEffect(() => {
        if (initialData?.invitations) {
            setGuests(initialData.invitations.filter(inv => inv.status !== 'declined'));
        }
    }, [initialData?.invitations]);

    const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' });
        }
    };

    const handleRemoveFile = (e) => {
        e.preventDefault(); e.stopPropagation();
        setSelectedFile(null);
    };

    const handleSave = () => {
        setSubmitted(true);
        if (!form.title.trim()) return;
        onSave?.({ type: 'event', ...form, file: selectedFile, guests });
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
                            <span className="text-slate-400 text-sm">→</span>
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
                    <label className="flex items-center justify-between w-full px-3 py-2 text-sm border border-dashed border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group">
                        <input type="file" className="hidden" onChange={handleFileChange} />
                        <span className="text-slate-500 group-hover:text-blue-600 transition-colors">{t('create_modal.attach_file', lang)}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded group-hover:bg-blue-100 group-hover:text-blue-500 transition-all">{t('create_modal.upload', lang)}</span>
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
                        <button onClick={handleRemoveFile} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </FieldRow>

            <FieldRow icon={Tag}>
                <select value={form.category} onChange={set('category')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-slate-50 cursor-pointer">
                    {appSettings?.customCategories?.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
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

            {/* ── Guests Section ── */}
            <FieldRow icon={Users}>
                <div className="flex flex-col w-full gap-2">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-sm font-semibold text-slate-700">{t('contacts_panel.guests', lang)}</span>
                        {isOwner && (
                            <button 
                                onClick={() => {
                                    setShowGuestPicker(!showGuestPicker);
                                    setGuestSearch("");
                                }}
                                className="text-[11px] font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-full transition border border-transparent hover:border-blue-200 flex items-center gap-1.5"
                            >
                                {showGuestPicker ? (
                                    <><X className="w-3 h-3" /> {t('common.close', lang)}</>
                                ) : (
                                    <><Plus className="w-3 h-3" /> {t('contacts_panel.add_guest', lang)}</>
                                )}
                            </button>
                        )}
                    </div>
                    
                    <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-1.5 min-h-[50px] flex flex-col gap-1.5 transition-all">
                        {/* Guest Picker (Dropdown) */}
                        {showGuestPicker && isOwner && (
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10 mx-0.5 mt-0.5">
                                <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <input 
                                            type="text"
                                            autoFocus
                                            value={guestSearch}
                                            onChange={(e) => setGuestSearch(e.target.value)}
                                            placeholder={t('contacts_panel.search_placeholder', lang)}
                                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                
                                <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                                    {filteredFriends.length === 0 ? (
                                        <div className="py-6 text-center">
                                            <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                            <p className="text-[10px] text-slate-400 italic px-4">{t('contacts_panel.no_results', lang)}</p>
                                        </div>
                                    ) : (
                                        filteredFriends.map(f => {
                                            const guestEntry = guests.find(g => g.invitee === f.id);
                                            const isAdded = !!guestEntry;
                                            const name = f.first_name || f.username || f.email || "User";
                                            const initial = (name ? name[0] : "?").toUpperCase();
                                            return (
                                                <div key={f.id} 
                                                    onClick={() => toggleGuest(f)}
                                                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all group mb-0.5 cursor-pointer
                                                        ${isAdded ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600 active:scale-[0.98]'}`}>
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110
                                                        ${isAdded ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-blue-600 shadow-sm'}`}>
                                                        {initial}
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <p className="text-xs font-bold truncate">{name}</p>
                                                        <p className="text-[10px] text-slate-400 truncate leading-tight">{f.email}</p>
                                                    </div>
                                                    
                                                    {isAdded && (
                                                        <div className="relative group/perm" onClick={(e) => e.stopPropagation()}>
                                                            <select 
                                                                value={guestEntry.permission}
                                                                disabled={!isOwner}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    togglePermission(f.id);
                                                                }}
                                                                className="appearance-none bg-white text-slate-600 text-[9px] font-bold px-7 py-1 rounded-lg border border-slate-200 hover:border-blue-300 transition-all cursor-pointer outline-none focus:ring-1 focus:ring-blue-500"
                                                            >
                                                                <option value="view">{t('contacts_panel.view_only', lang)}</option>
                                                                <option value="edit">{t('contacts_panel.can_edit', lang)}</option>
                                                            </select>
                                                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                {guestEntry.permission === 'edit' ? <ShieldCheck className="w-2.5 h-2.5 text-purple-500" /> : <Shield className="w-2.5 h-2.5 text-slate-400" />}
                                                            </div>
                                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-400 pointer-events-none" />
                                                        </div>
                                                    )}

                                                    {isAdded ? (
                                                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                                                            <Check className="w-3 h-3 text-white" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Plus className="w-3 h-3 text-slate-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Guest List (Selected) - Hide when picker is open to avoid duplicates, as picker now manages them */}
                        {!showGuestPicker && (
                            <div className="p-1 space-y-1.5 mt-0.5">
                                {guests.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-4 bg-white/40 border border-dashed border-slate-200 rounded-xl">
                                        <Users className="w-5 h-5 text-slate-300 mb-1" />
                                        <span className="text-[11px] text-slate-400 italic">{t('contacts_panel.no_invitations', lang)}</span>
                                    </div>
                                ) : (
                                    guests.map(g => (
                                        <div key={g.invitee} className="flex items-center justify-between bg-white border border-slate-200/60 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all group active:scale-[0.99]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm transition-transform group-hover:rotate-3">
                                                    {g.invitee_details?.username?.[0].toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-slate-700 tracking-tight">{g.invitee_details?.name || g.invitee_details?.username}</span>
                                                        {(!g.status || g.status === 'pending') && (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-bold border border-amber-100 flex items-center gap-1">
                                                                <Clock className="w-2.5 h-2.5" />
                                                                {t('contacts_panel.status_pending', lang)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 leading-none">{g.invitee_details?.email}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="relative group/perm">
                                                    <select 
                                                        value={g.permission}
                                                        disabled={!isOwner}
                                                        onChange={(e) => togglePermission(g.invitee)}
                                                        className="appearance-none bg-slate-50 text-slate-600 text-[10px] font-bold px-7 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 transition-all cursor-pointer outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        <option value="view">{t('contacts_panel.view_only', lang)}</option>
                                                        <option value="edit">{t('contacts_panel.can_edit', lang)}</option>
                                                    </select>
                                                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                                        {g.permission === 'edit' ? <ShieldCheck className="w-3 h-3 text-purple-500" /> : <Shield className="w-3 h-3 text-slate-400" />}
                                                    </div>
                                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                                                </div>

                                                {isOwner && (
                                                    <button 
                                                        onClick={() => toggleGuest({id: g.invitee})} 
                                                        title="Gở bỏ" 
                                                        className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </FieldRow>

            <button id="__eventSave" className="hidden" onClick={handleSave} />
        </div>
    );
}