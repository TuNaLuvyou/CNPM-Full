export const VI_DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export const VI_MONTH_NAMES = [
    'Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
    'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12',
];

/** Lấy thời gian chuẩn Việt Nam (GMT+7) */
export function getVNTime() {
    // Cách này giúp lấy được giờ Việt Nam chuẩn bất kể múi giờ hệ thống bằng cách dịch chuyển absolute time
    const d = new Date();
    const localOffset = d.getTimezoneOffset() * 60000; // ms
    const targetOffset = -420 * 60000; // GMT+7 là -420 phút
    
    // Dịch chuyển date để khi gọi .getHours(), .getMinutes() sẽ ra giờ VN
    return new Date(d.getTime() + (localOffset - targetOffset));
}

/** Trả về ngày Thứ 2 của tuần chứa ngày d */
export function getMonday(d) {
    const date = new Date(d);
    const jsDay = date.getDay();
    const diff = jsDay === 0 ? -6 : 1 - jsDay;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
}

/** Tạo mảng 7 ngày trong tuần bắt đầu từ Thứ 2 */
export function buildWeekDays(baseDate) {
    const monday = getMonday(baseDate);
    const today  = getVNTime(); // Dùng giờ VN
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return {
            day: VI_DAY_NAMES[d.getDay()],
            date: String(d.getDate()),
            isToday:
                d.getDate()     === today.getDate()     &&
                d.getMonth()    === today.getMonth()    &&
                d.getFullYear() === today.getFullYear(),
            fullDate: d,
        };
    });
}

/** Tạo mảng tối đa 42 ô lịch tháng */
export function buildMonthCells(year, month) {
    const firstDay    = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today       = getVNTime(); // Dùng giờ VN
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const cells = [];

    // Ngày tháng trước
    for (let i = startOffset - 1; i >= 0; i--) {
        const d = new Date(year, month, -i);
        cells.push({ num: d.getDate(), isCurrentMonth: false, fullDate: d });
    }

    // Ngày tháng này
    for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        cells.push({
            num: day,
            isCurrentMonth: true,
            fullDate: d,
            isToday:
                day   === today.getDate()     &&
                month === today.getMonth()    &&
                year  === today.getFullYear(),
        });
    }

    // Ngày tháng sau 
    const target = cells.length + daysInMonth > 35 ? 42 : 35;
    let next = 1;
    while (cells.length < target) {
        const d = new Date(year, month + 1, next++);
        cells.push({ num: d.getDate(), isCurrentMonth: false, fullDate: d });
    }

    return cells;
}