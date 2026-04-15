import { Users } from 'lucide-react';

export default function Event({ title, time, type = 'blue', top, height, location, onClick, onMouseDown, onResizeMouseDown }) {
    // Định nghĩa màu sắc theo loại sự kiện
    const themes = {
        blue: { bg: 'bg-blue-100', border: 'border-blue-500', title: 'text-blue-700', text: 'text-blue-600', handle: 'bg-blue-400' },
        purple: { bg: 'bg-purple-100', border: 'border-purple-500', title: 'text-purple-700', text: 'text-purple-600', handle: 'bg-purple-400' },
        emerald: { bg: 'bg-emerald-100', border: 'border-emerald-500', title: 'text-emerald-700', text: 'text-emerald-600', handle: 'bg-emerald-400' },
    };
    const theme = themes[type];

    return (
        <div
            onMouseDown={(e) => { e.stopPropagation(); onMouseDown?.(e); }}
            onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
            className={`absolute left-1 right-1 border-l-4 rounded-md p-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow z-40 pointer-events-auto ${theme.bg} ${theme.border}`}
            style={{ top: `${top}px`, height: `${height}px` }}
        >
            <p className={`text-xs font-semibold ${theme.title} truncate`}>{title}</p>
            <p className={`text-[10px] mt-0.5 ${theme.text}`}>{time}</p>
            {location && (
                <p className={`text-[10px] mt-1 flex items-center ${theme.text} truncate`}>
                    <Users className="w-3 h-3 mr-1" /> {location}
                </p>
            )}

            {/* Resize handle at the bottom */}
            <div 
                onMouseDown={(e) => {
                    e.stopPropagation();
                    onResizeMouseDown?.(e);
                }}
                className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center group`}
            >
                <div className={`w-6 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${theme.handle}`} />
            </div>
        </div>
    );
}