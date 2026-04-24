import React from 'react';
import { Users, X, Plus, Search, Shield, ShieldCheck, ChevronDown, Check, Clock } from 'lucide-react';
import { FieldRow } from '../FormHelpers';
import { t } from '@/lib/i18n';

export default function AppointmentGuests({
    guests, showGuestPicker, setShowGuestPicker,
    guestSearch, setGuestSearch, filteredFriends,
    toggleGuest, togglePermission, isOwner, lang
}) {
    return (
        <FieldRow icon={Users}>
            <div className="flex flex-col w-full gap-2">
                <div className="flex items-center justify-between px-1">
                    <span className="text-sm font-semibold text-slate-700">{t('contacts_panel.guests', lang)}</span>
                    {isOwner && (
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
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
                                        const guestEntry = guests.find(g => (g.invitee_details?.id || g.invitee) === f.id);
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

                    {/* Guest List (Selected) */}
                    {!showGuestPicker && (
                        <div className="p-1 space-y-1.5 mt-0.5">
                            {guests.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-4 bg-white/40 border border-dashed border-slate-200 rounded-xl" onClick={() => setShowGuestPicker(true)}>
                                    <Users className="w-5 h-5 text-slate-300 mb-1" />
                                    <span className="text-[11px] text-slate-400 italic">{t('contacts_panel.no_invitations', lang)}</span>
                                </div>
                            ) : (
                                guests.map(g => (
                                    <div key={g.invitee_details?.id || g.invitee} className="flex items-center justify-between bg-white border border-slate-200/60 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all group active:scale-[0.99]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm transition-transform group-hover:rotate-3">
                                                {(g.invitee_details?.username?.[0] || '?').toUpperCase()}
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
                                                    {g.status === 'accepted' && (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold border border-emerald-100 flex items-center gap-1">
                                                            <Check className="w-2.5 h-2.5" />
                                                            {t('contacts_panel.status_accepted', lang)}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-400 leading-none">{g.invitee_details?.email}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="relative group/perm" onClick={(e) => e.stopPropagation()}>
                                                <select 
                                                    value={g.permission}
                                                    disabled={!isOwner}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        togglePermission(g.invitee_details?.id || g.invitee);
                                                    }}
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
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleGuest({id: g.invitee_details?.id || g.invitee});
                                                    }} 
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
    );
}
