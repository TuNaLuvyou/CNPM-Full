"use client";

export const RECURRENCE_OPTIONS = [
    { value: '',           label: 'Không lặp lại',     labelEn: 'Does not repeat'   },
    { value: 'DAILY',      label: 'Hàng ngày',          labelEn: 'Every day'         },
    { value: 'WEEKLY',     label: 'Hàng tuần',          labelEn: 'Every week'        },
    { value: 'MONTHLY',    label: 'Hàng tháng',         labelEn: 'Every month'       },
    { value: 'YEARLY',     label: 'Hàng năm',           labelEn: 'Every year'        },
];

export default function RecurrenceSelector({ value = '', onChange, lang = 'vi' }) {
    return (
        <div className="relative w-full">
            <select
                value={value}
                onChange={e => onChange?.(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-[#484848] rounded-lg outline-none
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-slate-50 dark:bg-[#1f1f1f] text-slate-800 dark:text-[#e3e3e3]
                    cursor-pointer appearance-none pr-8"
            >
                {RECURRENCE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        {lang === 'en' ? opt.labelEn : opt.label}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#9e9e9e]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    );
}
