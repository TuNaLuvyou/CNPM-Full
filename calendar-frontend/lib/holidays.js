/**
 * holidays.js — Dữ liệu ngày lễ Việt Nam và Thế giới
 *
 * Cung cấp các hàm để lấy danh sách ngày lễ theo năm và phạm vi ngày,
 * kết quả trả về theo định dạng event giả để render trên lịch.
 */

// ─── Thuật toán chuyển đổi Âm-Dương lịch ─────────────────────────────────────
// Dựa trên thuật toán của Ho Ngoc Duc (2004)

function INT(n) {
  return Math.floor(n);
}

function jdFromDate(dd, mm, yy) {
  const a = INT((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd =
    dd +
    INT((153 * m + 2) / 5) +
    365 * y +
    INT(y / 4) -
    INT(y / 100) +
    INT(y / 400) -
    32045;
  if (jd < 2299161) {
    jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  }
  return jd;
}

function jdToDate(jd) {
  let a, b, c;
  if (jd > 2299160) {
    a = jd + 32044;
    b = INT((4 * a + 3) / 146097);
    c = a - INT((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = INT((4 * c + 3) / 1461);
  const e = c - INT((1461 * d) / 4);
  const m = INT((5 * e + 2) / 153);
  const day = e - INT((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * INT(m / 10);
  const year = b * 100 + d - 4800 + INT(m / 10);
  return [day, month, year];
}

function getNewMoonDay(k, timeZone) {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let Jd1 =
    2415020.75933 +
    29.53058868 * k +
    0.0001178 * T2 -
    0.000000155 * T3;
  Jd1 +=
    0.00033 *
    Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr =
    306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 =
    (0.1734 - 0.000393 * T) * Math.sin(M * dr) +
    0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 =
    C1 +
    0.0104 * Math.sin(dr * 2 * F) -
    0.0051 * Math.sin(dr * (M + Mpr));
  C1 =
    C1 -
    0.0074 * Math.sin(dr * (M - Mpr)) +
    0.0004 * Math.sin(dr * (2 * F + M));
  C1 =
    C1 -
    0.0004 * Math.sin(dr * (2 * F - M)) -
    0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 =
    C1 +
    0.001 * Math.sin(dr * (2 * F - Mpr)) +
    0.0005 * Math.sin(dr * (M + 2 * Mpr));
  let deltat;
  if (T < -11) {
    deltat =
      0.001 +
      0.000839 * T +
      0.0002261 * T2 -
      0.00000845 * T3 -
      0.000000081 * T * T3;
  } else {
    deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
  }
  const JdNew = Jd1 + C1 - deltat;
  return INT(JdNew + 0.5 + timeZone / 24);
}

function getSunLongitude(jdn, timeZone) {
  const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M =
    357.5291 +
    35999.0503 * T -
    0.0001559 * T2 -
    0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL =
    (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL +=
    (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) +
    0.00029 * Math.sin(dr * 3 * M);
  let L = L0 + DL;
  L = L * dr;
  L = L - Math.PI * 2 * (INT(L / (Math.PI * 2)));
  return INT((L / Math.PI) * 6);
}

function getLunarMonth11(yy, timeZone) {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = INT(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
}

function getLeapMonthOffset(a11, timeZone) {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

/**
 * Chuyển ngày âm lịch (dd/mm/yy âm) sang dương lịch
 * @returns Date object (dương lịch)
 */
function lunarToSolar(lunarDay, lunarMonth, lunarYear, lunarLeap = false) {
  const timeZone = 7; // GMT+7
  const k = INT(
    (jdFromDate(1, 1, lunarYear) - 2415021.076998695) / 29.530588853
  );
  let monthStart = getNewMoonDay(k + lunarMonth - 1, timeZone);
  let a11 = getLunarMonth11(lunarYear, timeZone);
  let b11 = a11;
  if (a11 >= monthStart) {
    a11 = getLunarMonth11(lunarYear - 1, timeZone);
  } else {
    b11 = getLunarMonth11(lunarYear + 1, timeZone);
  }
  const off = monthStart - a11;
  const leapOff = getLeapMonthOffset(a11, timeZone);
  let leapMonth = leapOff - 1;
  if (leapOff < lunarMonth) {
    monthStart = getNewMoonDay(k + lunarMonth, timeZone);
  }
  if (lunarLeap && lunarMonth !== leapMonth) {
    monthStart = getNewMoonDay(k + lunarMonth, timeZone);
  }
  const jd = monthStart + lunarDay - 1;
  const [d, m, y] = jdToDate(jd);
  return new Date(y, m - 1, d);
}

// ─── Dữ liệu ngày lễ ─────────────────────────────────────────────────────────

/**
 * Ngày lễ Việt Nam theo dương lịch (cố định mỗi năm)
 */
function getSolarVNHolidays(year) {
  return [
    {
      key: "tet_duong_lich",
      title: "Tết Dương Lịch",
      titleEn: "New Year's Day",
      date: new Date(year, 0, 1),  // 1/1
      color: "red",
      holidayType: "vietnam",
    },
    {
      key: "giai_phong_mb_30_4",
      title: "Giải phóng miền Nam (30/4)",
      titleEn: "Reunification Day",
      date: new Date(year, 3, 30), // 30/4
      color: "red",
      holidayType: "vietnam",
    },
    {
      key: "quoc_te_lao_dong",
      title: "Quốc tế Lao động (1/5)",
      titleEn: "International Labour Day",
      date: new Date(year, 4, 1),  // 1/5
      color: "red",
      holidayType: "vietnam",
    },
    {
      key: "quoc_khanh",
      title: "Quốc khánh Việt Nam (2/9)",
      titleEn: "National Day of Vietnam",
      date: new Date(year, 8, 2),  // 2/9
      color: "red",
      holidayType: "vietnam",
    },
  ];
}

/**
 * Ngày lễ Việt Nam theo âm lịch (tính động mỗi năm)
 */
function getLunarVNHolidays(year) {
  const holidays = [];

  // Tết Nguyên Đán: 1/1 âm lịch (5 ngày nghỉ: 29/12 âm đến 3/1 âm+1)
  const tetStart = lunarToSolar(1, 1, year);
  const tetNames = [
    "Giao thừa Tết Nguyên Đán",
    "Mùng 1 Tết Nguyên Đán",
    "Mùng 2 Tết Nguyên Đán",
    "Mùng 3 Tết Nguyên Đán",
    "Mùng 4 Tết Nguyên Đán",
    "Mùng 5 Tết Nguyên Đán",
  ];
  const tetNamesEn = [
    "Lunar New Year's Eve",
    "Lunar New Year Day 1",
    "Lunar New Year Day 2",
    "Lunar New Year Day 3",
    "Lunar New Year Day 4",
    "Lunar New Year Day 5",
  ];

  // 29/12 âm năm trước = giao thừa
  const giaothua = lunarToSolar(29, 12, year - 1);
  holidays.push({
    key: `giao_thua_${year}`,
    title: tetNames[0],
    titleEn: tetNamesEn[0],
    date: giaothua,
    color: "red",
    holidayType: "vietnam",
  });

  for (let i = 0; i < 5; i++) {
    const d = new Date(tetStart);
    d.setDate(d.getDate() + i);
    holidays.push({
      key: `tet_mung_${i + 1}_${year}`,
      title: tetNames[i + 1],
      titleEn: tetNamesEn[i + 1],
      date: d,
      color: "red",
      holidayType: "vietnam",
    });
  }

  // Giỗ Tổ Hùng Vương: 10/3 âm lịch
  const gioTo = lunarToSolar(10, 3, year);
  holidays.push({
    key: `gio_to_hung_vuong_${year}`,
    title: "Giỗ Tổ Hùng Vương (10/3 âm lịch)",
    titleEn: "Hung Kings' Festival",
    date: gioTo,
    color: "amber",
    holidayType: "vietnam",
  });

  // Rằm tháng Giêng: 15/1 âm lịch
  const ramThangGieng = lunarToSolar(15, 1, year);
  holidays.push({
    key: `ram_thang_gieng_${year}`,
    title: "Rằm tháng Giêng",
    titleEn: "First Full Moon Festival",
    date: ramThangGieng,
    color: "amber",
    holidayType: "vietnam",
  });

  // Tết Trung Thu: 15/8 âm lịch
  const trungThu = lunarToSolar(15, 8, year);
  holidays.push({
    key: `tet_trung_thu_${year}`,
    title: "Tết Trung Thu",
    titleEn: "Mid-Autumn Festival",
    date: trungThu,
    color: "amber",
    holidayType: "vietnam",
  });

  // Tết Đoan Ngọ: 5/5 âm lịch
  const doanNgo = lunarToSolar(5, 5, year);
  holidays.push({
    key: `tet_doan_ngo_${year}`,
    title: "Tết Đoan Ngọ",
    titleEn: "Double Fifth Festival",
    date: doanNgo,
    color: "amber",
    holidayType: "vietnam",
  });

  return holidays;
}

/**
 * Lấy toàn bộ ngày lễ Việt Nam
 */
function getVNHolidays(year) {
  return [
    ...getSolarVNHolidays(year),
    ...getLunarVNHolidays(year),
  ];
}

// ─── Thuật toán Easter (Ngày Phục sinh) ─────────────────────────────────────
function getEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/**
 * Ngày lễ Thế giới (phổ biến)
 */
function getWorldHolidays(year) {
  const easter = getEasterDate(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);

  return [
    {
      key: "new_year_world",
      title: "Năm mới Dương lịch",
      titleEn: "New Year's Day",
      date: new Date(year, 0, 1),
      color: "purple",
      holidayType: "world",
    },
    {
      key: "valentine",
      title: "Valentine's Day",
      titleEn: "Valentine's Day",
      date: new Date(year, 1, 14),
      color: "pink",
      holidayType: "world",
    },
    {
      key: "good_friday",
      title: "Thứ Sáu Tuần Thánh",
      titleEn: "Good Friday",
      date: goodFriday,
      color: "purple",
      holidayType: "world",
    },
    {
      key: "easter",
      title: "Lễ Phục Sinh",
      titleEn: "Easter Sunday",
      date: easter,
      color: "purple",
      holidayType: "world",
    },
    {
      key: "easter_monday",
      title: "Thứ Hai Phục Sinh",
      titleEn: "Easter Monday",
      date: easterMonday,
      color: "purple",
      holidayType: "world",
    },
    {
      key: "international_womens_day",
      title: "Ngày Phụ nữ Quốc tế (8/3)",
      titleEn: "International Women's Day",
      date: new Date(year, 2, 8),
      color: "pink",
      holidayType: "world",
    },
    {
      key: "international_childrens_day",
      title: "Ngày Thiếu nhi Quốc tế (1/6)",
      titleEn: "International Children's Day",
      date: new Date(year, 5, 1),
      color: "teal",
      holidayType: "world",
    },
    {
      key: "halloween",
      title: "Halloween (31/10)",
      titleEn: "Halloween",
      date: new Date(year, 9, 31),
      color: "orange",
      holidayType: "world",
    },
    {
      key: "christmas_eve",
      title: "Giáng sinh (24/12)",
      titleEn: "Christmas Eve",
      date: new Date(year, 11, 24),
      color: "green",
      holidayType: "world",
    },
    {
      key: "christmas",
      title: "Giáng sinh (25/12)",
      titleEn: "Christmas Day",
      date: new Date(year, 11, 25),
      color: "green",
      holidayType: "world",
    },
    {
      key: "new_year_eve",
      title: "Giao thừa Dương lịch (31/12)",
      titleEn: "New Year's Eve",
      date: new Date(year, 11, 31),
      color: "purple",
      holidayType: "world",
    },
  ];
}

// ─── Màu sắc ngày lễ ─────────────────────────────────────────────────────────
const COLOR_MAP = {
  red: {
    bg: "#fee2e2",
    text: "#b91c1c",
    border: "#fca5a5",
    darkBg: "#7f1d1d",
    darkText: "#fecaca",
  },
  amber: {
    bg: "#fef3c7",
    text: "#b45309",
    border: "#fcd34d",
    darkBg: "#78350f",
    darkText: "#fde68a",
  },
  purple: {
    bg: "#ede9fe",
    text: "#7c3aed",
    border: "#c4b5fd",
    darkBg: "#4c1d95",
    darkText: "#ddd6fe",
  },
  pink: {
    bg: "#fce7f3",
    text: "#be185d",
    border: "#f9a8d4",
    darkBg: "#831843",
    darkText: "#fbcfe8",
  },
  green: {
    bg: "#dcfce7",
    text: "#15803d",
    border: "#86efac",
    darkBg: "#14532d",
    darkText: "#bbf7d0",
  },
  orange: {
    bg: "#ffedd5",
    text: "#c2410c",
    border: "#fdba74",
    darkBg: "#7c2d12",
    darkText: "#fed7aa",
  },
  teal: {
    bg: "#ccfbf1",
    text: "#0f766e",
    border: "#5eead4",
    darkBg: "#134e4a",
    darkText: "#99f6e4",
  },
};

// ─── Hàm chính ───────────────────────────────────────────────────────────────

/**
 * Chuyển một holiday thành event giả theo định dạng chuẩn của app
 */
function holidayToEvent(holiday, lang = "vi") {
  const date = holiday.date;
  if (!date || isNaN(date.getTime())) return null;

  // All-day event: set giờ 0:00 → 23:59
  const startTime = new Date(date);
  startTime.setHours(0, 0, 0, 0);
  const endTime = new Date(date);
  endTime.setHours(23, 59, 0, 0);

  const colorKey = holiday.color || "red";

  return {
    id: `holiday_${holiday.key}`,
    title: lang === "en" ? holiday.titleEn : holiday.title,
    event_type: "holiday",
    holiday_type: holiday.holidayType,
    holiday_key: holiday.key,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    duration_minutes: 1439,
    is_all_day: true,
    color: colorKey,
    _colorMeta: COLOR_MAP[colorKey] || COLOR_MAP.red,
    // Không có user, không có category → không bị filter
    category: null,
    user: null,
    is_holiday: true,
    // Readonly
    is_owner: false,
    my_permission: "view",
  };
}

/**
 * Lấy tất cả holiday events cho một khoảng ngày, dựa theo settings
 *
 * @param {string} dateFrom  - 'YYYY-MM-DD'
 * @param {string} dateTo    - 'YYYY-MM-DD'
 * @param {object} settings  - appSettings { vietnamHolidays, worldHolidays, otherHolidays, language }
 * @param {string[]} visibleHolidays - ['vietnam', 'world', 'other', ...]
 * @returns {object[]} Mảng events giả
 */
export function getHolidayEventsForRange(
  dateFrom,
  dateTo,
  settings = {},
  visibleHolidays = []
) {
  if (!dateFrom || !dateTo) return [];

  const from = new Date(dateFrom + "T00:00:00");
  const to = new Date(dateTo + "T23:59:59");

  if (isNaN(from.getTime()) || isNaN(to.getTime())) return [];

  const yearFrom = from.getFullYear();
  const yearTo = to.getFullYear();

  const lang = settings.language || "vi";

  let allHolidays = [];

  // Gom ngày lễ cho tất cả các năm trong range
  for (let y = yearFrom; y <= yearTo; y++) {
    if (settings.vietnamHolidays && visibleHolidays.includes("vietnam")) {
      allHolidays = allHolidays.concat(getVNHolidays(y));
    }
    if (settings.worldHolidays && visibleHolidays.includes("world")) {
      allHolidays = allHolidays.concat(getWorldHolidays(y));
    }
    // otherHolidays — để trống, có thể mở rộng sau
  }

  // Lọc theo khoảng ngày và chuyển thành event
  return allHolidays
    .filter((h) => {
      if (!h.date || isNaN(h.date.getTime())) return false;
      return h.date >= from && h.date <= to;
    })
    .map((h) => holidayToEvent(h, lang))
    .filter(Boolean);
}

/**
 * Lấy tên ngày lễ cho một ngày cụ thể (để hiển thị badge)
 * @param {Date} date
 * @param {string} lang
 * @returns {string|null}
 */
export function getHolidayNameForDate(date, lang = "vi") {
  if (!date) return null;
  const year = date.getFullYear();
  const allHolidays = [
    ...getVNHolidays(year),
    ...getWorldHolidays(year),
  ];

  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const found = allHolidays.find((h) => {
    if (!h.date || isNaN(h.date.getTime())) return false;
    const hStr = `${h.date.getFullYear()}-${String(h.date.getMonth() + 1).padStart(2, "0")}-${String(h.date.getDate()).padStart(2, "0")}`;
    return hStr === dateStr;
  });

  if (!found) return null;
  return lang === "en" ? found.titleEn : found.title;
}

/**
 * Kiểm tra một ngày có phải ngày lễ VN không
 */
export function isVNHoliday(date) {
  if (!date) return false;
  const year = date.getFullYear();
  const allVN = getVNHolidays(year);
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return allVN.some((h) => {
    if (!h.date || isNaN(h.date.getTime())) return false;
    const hStr = `${h.date.getFullYear()}-${String(h.date.getMonth() + 1).padStart(2, "0")}-${String(h.date.getDate()).padStart(2, "0")}`;
    return hStr === dateStr;
  });
}
