export const DAY_NAMES = {
    vi: ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
};

export const MONTH_NAMES = {
    vi: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
};

export const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** Lấy các key ngày (sun, mon...) theo thứ tự bắt đầu tuần */
export function getOrderedDayKeys(startDay = "monday") {
    const keys = [...DAY_KEYS];
    const startIndex = keys.indexOf(startDay);
    if (startIndex === -1) return keys; // Fallback
    
    // Cắt mảng và ghép lại để ngày bắt đầu lên đầu
    return [...keys.slice(startIndex), ...keys.slice(0, startIndex)];
}

/** Lấy các nhãn ngày (Thứ 2, Mon...) theo thứ tự bắt đầu tuần */
export function getOrderedDayLabels(lang = "vi", startDay = "monday") {
    const names = [...(DAY_NAMES[lang] || DAY_NAMES.vi)];
    const startIndex = DAY_KEYS.indexOf(startDay);
    if (startIndex === -1) return names; // Fallback
    
    return [...names.slice(startIndex), ...names.slice(0, startIndex)];
}

export const HOUR_HEIGHT = 64;

/** Lấy offset của một múi giờ so với UTC (phút) */
export function getTimezoneOffsetMinutes(timezone) {
    try {
        const d = new Date();
        const tzString = d.toLocaleString('en-US', { timeZone: timezone, hour12: false });
        const parts = tzString.match(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/);
        if (!parts) return 0;
        
        const year = parseInt(parts[3]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        const hour = parseInt(parts[4]);
        const min = parseInt(parts[5]);
        const sec = parseInt(parts[6]);
        
        const tzDate = Date.UTC(year, month, day, hour, min, sec);
        const utcDate = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
        
        return Math.round((utcDate - tzDate) / 60000);
    } catch (e) {
        return -420; // Fallback to GMT+7 if error
    }
}

/** Lấy thời gian chuẩn theo múi giờ chỉ định */
export function getLocalizedTime(timezone = "Asia/Ho_Chi_Minh", baseDate = new Date()) {
    const localOffset = baseDate.getTimezoneOffset() * 60000;
    const targetOffset = getTimezoneOffsetMinutes(timezone) * 60000;
    return new Date(baseDate.getTime() + (localOffset - targetOffset));
}

/** Lấy nhãn offset (vd: GMT+7) */
export function formatTimezoneOffset(timezone) {
    try {
        const d = new Date();
        const options = { timeZone: timezone, timeZoneName: 'shortOffset' };
        const parts = Intl.DateTimeFormat('en-US', options).formatToParts(d);
        const offsetPart = parts.find(p => p.type === 'timeZoneName');
        return offsetPart ? offsetPart.value : "GMT";
    } catch (e) {
        return "GMT+7";
    }
}

/** Lấy thời gian chuẩn Việt Nam (GMT+7) - Giữ để backward compatibility */
export function getVNTime() {
    return getLocalizedTime("Asia/Ho_Chi_Minh");
}

/** Tính vị trí và chiều cao của event trên lưới giờ */
export function getEventStyle(event) {
    if (!event) return { top: 0, height: HOUR_HEIGHT };
    
    const start = new Date(event.start_time);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const top = (startMinutes / 60) * HOUR_HEIGHT;

    let height;
    if (event.duration_minutes !== undefined) {
        // Ưu tiên dùng duration_minutes nếu có (mới refactor)
        height = (event.duration_minutes / 60) * HOUR_HEIGHT;
    } else {
        // Fallback dùng end_time/deadline như cũ
        let end = new Date(event.end_time || event.deadline);
        if (isNaN(end.getTime())) {
            end = new Date(start.getTime() + 60 * 60 * 1000);
        }
        const endMinutes = end.getHours() * 60 + end.getMinutes();
        height = ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;
    }

    return { top, height: Math.max(height, 30) };
}

/** Format Date thành YYYY-MM-DD theo giờ địa phương */
export function formatDateLocal(date) {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Trả về ngày bắt đầu của tuần chứa ngày d */
export function getWeekStart(d, startDay = "monday") {
    const date = new Date(d);
    const currentDay = date.getDay(); // 0-6
    const targetDay = DAY_KEYS.indexOf(startDay); // 0-6
    
    const diff = (currentDay - targetDay + 7) % 7;
    
    date.setDate(date.getDate() - diff);
    date.setHours(0, 0, 0, 0);
    return date;
}

/** Lấy số thứ tự tuần trong năm (1-52) */
export function getWeekNumber(d) {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    const week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                        - 3 + (week1.getDay() + 6) % 7) / 7);
}

/** Tạo mảng 7 ngày trong tuần bắt đầu từ ngày được chỉ định */
export function buildWeekDays(baseDate, startDay = "monday", lang = "vi") {
    const firstDayOfWeek = getWeekStart(baseDate, startDay);
    const today = getVNTime();
    const names = DAY_NAMES[lang] || DAY_NAMES.vi;

    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(firstDayOfWeek);
        d.setDate(firstDayOfWeek.getDate() + i);
        return {
            day: names[d.getDay()],
            date: String(d.getDate()),
            isToday:
                d.getDate() === today.getDate() &&
                d.getMonth() === today.getMonth() &&
                d.getFullYear() === today.getFullYear(),
            fullDate: d,
        };
    });
}

/** Tạo mảng tối đa 42 ô lịch tháng */
export function buildMonthCells(year, month, startDay = "monday") {
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = getVNTime();

    const targetDayIndex = DAY_KEYS.indexOf(startDay);
    const jsFirstDay = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
    
    // Số ô trống (ngày tháng trước) cần điền
    const startOffset = (jsFirstDay - targetDayIndex + 7) % 7;

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
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear(),
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