import { Users, Calendar as CalendarIcon, CheckCircle, Circle, Clock } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function Event({ 
    title, time, color = 'blue', type, top, height, location, description,
    event_type, is_completed, onToggleComplete, is_clamped, isPast,
    onClick, onMouseDown, onResizeMouseDown, lang = 'vi',
    my_permission = 'edit', owner_name, owner_email, is_owner = true
}) {
    const canEdit = my_permission === 'edit';

    // Định nghĩa màu sắc theo loại sự kiện
    const themes = {
        blue: { bg: 'bg-blue-100', border: 'border-blue-500', title: 'text-blue-700', text: 'text-blue-600', handle: 'bg-blue-400' },
        purple: { bg: 'bg-purple-100', border: 'border-purple-500', title: 'text-purple-700', text: 'text-purple-600', handle: 'bg-purple-400' },
        emerald: { bg: 'bg-emerald-100', border: 'border-emerald-500', title: 'text-emerald-700', text: 'text-emerald-600', handle: 'bg-emerald-400' },
        red: { bg: 'bg-red-100', border: 'border-red-500', title: 'text-red-700', text: 'text-red-600', handle: 'bg-red-400' },
        yellow: { bg: 'bg-yellow-100', border: 'border-yellow-500', title: 'text-yellow-700', text: 'text-yellow-600', handle: 'bg-yellow-400' },
        pink: { bg: 'bg-pink-100', border: 'border-pink-500', title: 'text-pink-700', text: 'text-pink-600', handle: 'bg-pink-400' },
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
    const showTime = height > 35;
    const showTitle = height > 22;

    return (
    <div
        onMouseDown={(e) => { 
            e.stopPropagation(); 
            onMouseDown?.(e); 
        }}
        onClick={(e) => { 
            e.stopPropagation(); 
            // onClick?.(e); // Handled in TimeGrid's handleMouseUp for better stability in Edit mode
        }}
        className={`absolute left-1 right-1 border-l-4 rounded-md p-1.5 shadow-sm z-40 pointer-events-auto flex flex-col ${finalTheme.bg} ${finalTheme.border} group cursor-pointer hover:shadow-md
            ${is_clamped ? 'z-50' : ''} ${isPast ? 'opacity-50 grayscale-[0.3]' : ''} ${!showTime ? 'justify-center' : ''}`}
        style={{ top: `${top}px`, height: `${height}px`, overflow: 'hidden' }}
    >
        <div className="flex items-start gap-1.5 min-w-0">
            {/* ICON / COMPLETION TOGGLE */}
            {showTime && (
                isTask ? (
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
                    <CalendarIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${finalTheme.text}`} />
                )
            )}

            <div className="flex-1 min-w-0">
                {showTitle && (
                    <p className={`text-[11px] font-bold ${finalTheme.title} truncate leading-tight`}>
                        {title}
                    </p>
                )}
                {showTime && (
                    <p className={`text-[9px] font-medium ${finalTheme.text} leading-none mt-0.5`}>{time}</p>
                )}
            </div>

            {!is_owner && owner_name && (
                <div className="absolute bottom-1 right-2">
                    <span className={`text-[8px] font-bold opacity-60 ${finalTheme.text} truncate max-w-[80px]`}>
                        @{owner_name}
                    </span>
                </div>
            )}
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