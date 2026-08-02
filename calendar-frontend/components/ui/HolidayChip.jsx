/**
 * HolidayChip — Chip hiển thị ngày lễ tinh gọn.
 *
 * - variant="cell": dùng trong ô ngày (MonthView), kích thước nhỏ gọn.
 * - variant="pill": dùng trong banner ngày lễ (CalendarHeader).
 *
 * Thiết kế: nền màu nhạt mờ, không viền, kèm chấm tròn nhỏ thay cho emoji
 * để không "cạnh tranh" với sự kiện thường trong lịch.
 */
const COLOR_STYLES = {
  red: "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20",
  amber: "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20",
  purple: "bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20",
  pink: "bg-pink-50 text-pink-600 hover:bg-pink-100 dark:bg-pink-500/10 dark:text-pink-400 dark:hover:bg-pink-500/20",
  green: "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20",
  orange: "bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20",
  teal: "bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20",
};

const VARIANTS = {
  cell: "rounded-[5px] px-1 py-[1px] text-[9px] font-medium",
  pill: "rounded-full px-2 py-0.5 text-[9px] font-semibold",
};

export default function HolidayChip({ ev, variant = "cell", title }) {
  const colorClass = COLOR_STYLES[ev?.color] || COLOR_STYLES.red;
  return (
    <span
      title={title || ev?.title}
      className={`inline-flex items-center gap-1 max-w-full truncate transition-colors ${VARIANTS[variant]} ${colorClass}`}
    >
      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-current" />
      <span className="truncate">{ev?.title}</span>
    </span>
  );
}
