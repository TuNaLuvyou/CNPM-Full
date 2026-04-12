import { buildMonthCells, VI_MONTH_NAMES } from '../lib/CalendarHelper';

export default function MonthCard({ year, month, onDayClick }) {
    const cells = buildMonthCells(year, month);
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 min-w-[196px]">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 text-center">
                {VI_MONTH_NAMES[month]} {year}
            </h3>
            <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium text-slate-400 mb-1">
                {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-[11px]">
                {cells.map((cell, idx) => (
                    <div
                        key={idx}
                        onClick={(e) => cell.isCurrentMonth && onDayClick(cell.fullDate, e)}
                        className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full
                            ${!cell.isCurrentMonth
                                ? 'text-slate-300 cursor-default'
                                : 'cursor-pointer text-slate-700 hover:bg-slate-100'}
                            ${cell.isToday ? '!bg-blue-600 !text-white font-bold' : ''}`}
                    >
                        {cell.num}
                    </div>
                ))}
            </div>
        </div>
    );
}