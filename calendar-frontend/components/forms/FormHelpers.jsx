import React from 'react';
// ─── Constants ────────────────────────────────────────────────────────────────
export const EVENT_COLORS = [
    { label: 'Xanh dương', value: 'blue',    cls: 'bg-blue-500'    },
    { label: 'Tím',        value: 'purple',  cls: 'bg-purple-500'  },
    { label: 'Xanh lá',   value: 'emerald', cls: 'bg-emerald-500' },
    { label: 'Đỏ',        value: 'red',     cls: 'bg-red-500'     },
    { label: 'Vàng',      value: 'yellow',  cls: 'bg-yellow-500'  },
    { label: 'Hồng',      value: 'pink',    cls: 'bg-pink-500'    },
];

export const TABS = [
    { key: 'event',       label: 'Sự kiện',      icon: 'CalendarIcon' },
    { key: 'task',        label: 'Việc cần làm', icon: 'CheckSquare'  },
    { key: 'appointment', label: 'Lên lịch hẹn', icon: 'Clock'        },
];

// ─── Date helpers ─────────────────────────────────────────────────────────────
export function toDateInputVal(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function toTimeInputVal(d) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export const VI_FULL_DAY_NAMES = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export function formatVNDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const dayName = VI_FULL_DAY_NAMES[d.getDay()];
    return `${dayName}, ${d.getDate()} tháng ${d.getMonth() + 1}`;
}

export function formatAMPM(timeStr) {
    if (!timeStr) return '';
    let [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────
export function FieldRow({ icon: Icon, children }) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="w-5 h-5 text-slate-400 mt-[10px] flex-shrink-0" />
            <div className="flex-1">{children}</div>
        </div>
    );
}

export function DateTimeSelector({ date, timeStart, timeEnd, children }) {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const summary = React.useMemo(() => {
        let text = formatVNDate(date);
        if (timeStart) {
            text += ` · ${formatAMPM(timeStart)}`;
            if (timeEnd) text += ` – ${formatAMPM(timeEnd)}`;
        }
        return text;
    }, [date, timeStart, timeEnd]);

    return (
        <div className="space-y-2">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-between group"
            >
                <span className="group-hover:text-blue-600 transition-colors text-[14px]">
                    {summary}
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                    {isExpanded ? 'Thu gọn' : 'Đổi ngày/giờ'}
                </span>
            </button>
            
            {isExpanded && (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
}

export function InputBase({ className = '', ...props }) {
    return (
        <input
            {...props}
            className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-slate-50 ${className}`}
        />
    );
}

export function TextareaBase({ ...props }) {
    return (
        <textarea
            rows={3}
            {...props}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-slate-50 resize-none"
        />
    );
}