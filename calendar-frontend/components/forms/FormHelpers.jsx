import { useState, useMemo } from 'react';
import { t } from '../../lib/i18n';
import { DAY_NAMES, MONTH_NAMES } from '../../lib/CalendarHelper';

export const EVENT_COLORS = [
    { label: 'Xanh dương', value: 'blue',    cls: 'bg-blue-500'    },
    { label: 'Tím',        value: 'purple',  cls: 'bg-purple-500'  },
    { label: 'Xanh lá',   value: 'emerald', cls: 'bg-emerald-500' },
    { label: 'Đỏ',        value: 'red',     cls: 'bg-red-500'     },
    { label: 'Vàng',      value: 'yellow',  cls: 'bg-yellow-500'  },
    { label: 'Hồng',      value: 'pink',    cls: 'bg-pink-500'    },
];

export function toDateInputVal(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function toTimeInputVal(d) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatLocaleDate(dateStr, lang = 'vi') {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (lang === 'en') {
        const dayName = DAY_NAMES.en[d.getDay()];
        const monthName = MONTH_NAMES.en[d.getMonth()];
        return `${dayName}, ${monthName} ${d.getDate()}`;
    }
    const dayName = DAY_NAMES.vi[d.getDay()];
    return `${dayName}, ${d.getDate()} tháng ${d.getMonth() + 1}`;
}

function formatAMPM(timeStr) {
    if (!timeStr) return '';
    let [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

export function FieldRow({ icon: Icon, children }) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="w-5 h-5 text-slate-400 dark:text-[#9e9e9e] mt-[10px] flex-shrink-0" />
            <div className="flex-1">{children}</div>
        </div>
    );
}

export function DateTimeSelector({ date, timeStart, timeEnd, timeFormat = '24h', lang = 'vi', children }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const summary = useMemo(() => {
        let text = formatLocaleDate(date, lang);
        const format = (t) => {
            if (!t) return '';
            return timeFormat === '12h' ? formatAMPM(t) : t;
        };

        if (timeStart) {
            text += ` · ${format(timeStart)}`;
            if (timeEnd) text += ` – ${format(timeEnd)}`;
        }
        return text;
    }, [date, timeStart, timeEnd, timeFormat]);

    return (
        <div className="space-y-2">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-600 dark:text-[#bdbdbd] hover:bg-slate-100 dark:hover:bg-[#353535] rounded-lg transition-colors flex items-center justify-between group"
            >
                <span className="group-hover:text-blue-600 dark:group-hover:text-[#e3e3e3] transition-colors text-[14px]">
                    {summary}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-[#9e9e9e] font-normal">
                    {isExpanded ? t('create_modal.collapse', lang) : t('create_modal.change_datetime', lang)}
                </span>
            </button>
            
            {isExpanded && (
                <div className="p-3 bg-slate-50 dark:bg-[#1f1f1f] border border-slate-100 dark:border-[#484848] rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
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
            className={`w-full px-3 py-2 text-sm border border-slate-200 dark:border-[#484848] rounded-lg outline-none
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-slate-50 dark:bg-[#1f1f1f] text-slate-800 dark:text-[#e3e3e3] placeholder:text-slate-400 dark:placeholder:text-[#757575] ${className}`}
        />
    );
}

export function TextareaBase({ ...props }) {
    return (
        <textarea
            rows={3}
            {...props}
            className={`w-full px-3 py-2 text-sm border border-slate-200 dark:border-[#484848] rounded-lg outline-none
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-slate-50 dark:bg-[#1f1f1f] text-slate-800 dark:text-[#e3e3e3] placeholder:text-slate-400 dark:placeholder:text-[#757575] resize-none ${props.className || ''}`}
        />
    );
}