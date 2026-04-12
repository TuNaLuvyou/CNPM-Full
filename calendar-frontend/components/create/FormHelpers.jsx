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

// ─── Shared UI primitives ─────────────────────────────────────────────────────
export function FieldRow({ icon: Icon, children }) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="w-5 h-5 text-slate-400 mt-2.5 flex-shrink-0" />
            <div className="flex-1">{children}</div>
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