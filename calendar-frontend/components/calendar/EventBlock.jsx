import { Users, Calendar as CalendarIcon, CheckCircle, Circle, Clock } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function Event({ 
    title, time, color = 'blue', type, top, height, location, description,
    event_type, is_completed, onToggleComplete, is_clamped, isPast,
    onClick, onMouseDown, onResizeMouseDown, lang = 'vi',
    my_permission = 'edit'
}) {
    const canEdit = my_permission === 'edit';

    // Định nghĩa màu sắc theo loại sự kiện
    const themes = {
        blue: { bg: 'bg-blue-100', border: 'border-blue-500', title: 'text-blue-700', text: 'text-blue-600', handle: 'bg-blue-400' },
        purple: { bg: 'bg-purple-100', border: 'border-purple-500', title: 'text-purple-700', text: 'text-purple-600', handle: 'bg-purple-400' },
        emerald: { bg: 'bg-emerald-100', border: 'border-emerald-500', title: 'text-emerald-700', text: 'text-emerald-600', handle: 'bg-emerald-400' },
    };
    
    // Nếu hoàn thành thì dùng tone xám mờ
    const finalTheme = is_completed 
    ? { bg: 'bg-slate-50', border: 'border-slate-300', title: 'text-slate-400 line-through', text: 'text-slate-300', handle: 'bg-slate-300' }
    : themes[color || type] || themes.blue;

    const isTask = event_type === 'task';
    const isAppointment = event_type === 'appointment';

    // Quyết định xem có hiện thêm thông tin không
    const showDetails = height > 60;
    const showDescription = height > 90 && description;

    return (
    <div
        onMouseDown={(e) => { 
            if (!canEdit) return;
            e.stopPropagation(); 
            onMouseDown?.(e); 
        }}
        onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
        className={`absolute left-1 right-1 border-l-4 rounded-md p-1.5 shadow-sm z-40 pointer-events-auto flex flex-col ${finalTheme.bg} ${finalTheme.border} group
            ${is_clamped ? 'z-50' : ''} ${isPast ? 'opacity-50 grayscale-[0.3]' : ''}
            ${canEdit ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
        style={{ top: `${top}px`, height: `${height}px`, overflow: 'hidden' }}
    >
        <div className="flex items-start gap-1.5 min-w-0">
            {/* ICON / COMPLETION TOGGLE */}
            {isTask ? (
                <button 
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { 
                        if (!canEdit) return;
                        e.stopPropagation(); 
                        onToggleComplete?.(); 
                    }}
                    className={`flex-shrink-0 mt-0.5 transition-transform ${canEdit ? 'hover:scale-110 active:scale-95 cursor-pointer' : 'cursor-default'} ${is_completed ? 'text-emerald-500' : 'text-slate-400'}`}
                >
                    {is_completed ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                </button>
            ) : isAppointment ? (
                <CalendarIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${finalTheme.text}`} />
            ) : (
                <Clock className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${finalTheme.text}`} />
            )}

            <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-bold ${finalTheme.title} truncate leading-tight`}>{title}</p>
                <p className={`text-[9px] font-medium ${finalTheme.text} leading-none mt-0.5`}>{time}</p>
            </div>
        </div>

        {showDetails && (
            <div className="mt-1.5 space-y-1">
                {location && (
                    <p className={`text-[9px] flex items-center ${finalTheme.text} truncate`}>
                        <Users className="w-2.5 h-2.5 mr-1" /> {location}
                    </p>
                )}
                {showDescription && (
                    <p className={`text-[9px] line-clamp-2 italic ${finalTheme.text} opacity-80 leading-tight`}>
                        {description}
                    </p>
                )}
            </div>
        )}

        {is_clamped && (
            <div className="mt-auto pt-1 flex justify-end">
                <span className="text-[8px] font-bold text-red-600 bg-red-50 px-1 rounded uppercase tracking-tighter">
                    {t('deadline_hit', lang)}
                </span>
            </div>
        )}

        {/* Resize handle at the bottom - only show if canEdit */}
        {canEdit && (
            <div 
                onMouseDown={(e) => {
                    e.stopPropagation();
                    onResizeMouseDown?.(e);
                }}
                className={`absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize flex items-center justify-center group/handle z-50`}
            >
                <div className={`w-6 h-0.5 rounded-full opacity-0 group-hover/handle:opacity-100 transition-opacity ${finalTheme.handle}`} />
            </div>
        )}
    </div>
    );
}