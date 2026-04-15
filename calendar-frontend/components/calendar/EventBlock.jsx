import { Users } from 'lucide-react';

export default function Event({ title, time, type = 'blue', top, height, location }) {
    // Định nghĩa màu sắc theo loại sự kiện
    const themes = {
        blue: { bg: 'bg-blue-100', border: 'border-blue-500', title: 'text-blue-700', text: 'text-blue-600' },
        purple: { bg: 'bg-purple-100', border: 'border-purple-500', title: 'text-purple-700', text: 'text-purple-600' },
        emerald: { bg: 'bg-emerald-100', border: 'border-emerald-500', title: 'text-emerald-700', text: 'text-emerald-600' },
    };
    const theme = themes[type];

    return (
        <div
            className={`absolute left-1 right-1 border-l-4 rounded-md p-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${theme.bg} ${theme.border}`}
            style={{ top: `${top}px`, height: `${height}px` }}
        >
            <p className={`text-xs font-semibold ${theme.title}`}>{title}</p>
            <p className={`text-[10px] mt-0.5 ${theme.text}`}>{time}</p>
            {location && (
                <p className={`text-[10px] mt-1 flex items-center ${theme.text}`}>
                    <Users className="w-3 h-3 mr-1" /> {location}
                </p>
            )}
        </div>
    );
}