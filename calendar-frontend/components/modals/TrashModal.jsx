"use client";
import { useState } from "react";
import {
    X,
    Trash2,
    RotateCcw,
    Calendar,
    CheckSquare,
    Clock,
    AlertTriangle,
} from "lucide-react";

const TYPE_CONFIG = {
    event: {
        label: "Sự kiện",
        Icon: Calendar,
        color: "text-blue-500",
        bg: "bg-blue-50",
    },
    task: {
        label: "Việc cần làm",
        Icon: CheckSquare,
        color: "text-emerald-500",
        bg: "bg-emerald-50",
    },
    appointment: {
        label: "Lịch hẹn",
        Icon: Clock,
        color: "text-purple-500",
        bg: "bg-purple-50",
    },
};

const FILTER_TABS = [
    { key: "all", label: "Tất cả" },
    { key: "event", label: "Sự kiện" },
    { key: "task", label: "Việc làm" },
    { key: "appointment", label: "Lịch hẹn" },
];

export default function TrashModal({
    isOpen,
    onClose,
    deletedItems = [],
    onRestore,
    onPermanentDelete,
    onClearAll,
}) {
    const [filter, setFilter] = useState("all");
    const [confirmClear, setConfirmClear] = useState(false);

    if (!isOpen) return null;

    const filtered =
        filter === "all"
            ? deletedItems
            : deletedItems.filter((item) => item.type === filter);

    const counts = {
        all: deletedItems.length,
        event: deletedItems.filter((i) => i.type === "event").length,
        task: deletedItems.filter((i) => i.type === "task").length,
        appointment: deletedItems.filter((i) => i.type === "appointment").length,
    };

    const handleClearAll = () => {
        if (confirmClear) {
            onClearAll?.();
            setConfirmClear(false);
        } else {
            setConfirmClear(true);
            setTimeout(() => setConfirmClear(false), 3000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* Slide-in panel từ phải */}
            <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                            <Trash2 className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-800">Thùng rác</h2>
                            <p className="text-xs text-slate-400">
                                {deletedItems.length} mục đã xóa
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ── Filter tabs ── */}
                <div className="flex gap-1.5 px-6 py-3 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
                    {FILTER_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all
                ${filter === tab.key
                                    ? "bg-slate-800 text-white shadow-sm"
                                    : "text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                                }`}
                        >
                            {tab.label}
                            {counts[tab.key] > 0 && (
                                <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                  ${filter === tab.key
                                            ? "bg-white/20 text-white"
                                            : "bg-slate-200 text-slate-600"
                                        }`}
                                >
                                    {counts[tab.key]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Danh sách mục ── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filtered.length === 0 ? (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center h-full gap-4 pb-16 px-6">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
                                <Trash2 className="w-9 h-9 text-slate-200" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-slate-500">
                                    Thùng rác trống
                                </p>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                    Khi bạn xóa sự kiện, việc làm hoặc lịch hẹn,
                                    <br />
                                    chúng sẽ xuất hiện ở đây
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="px-4 py-3 space-y-1.5">
                            {filtered.map((item) => {
                                const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.event;
                                const { Icon } = cfg;
                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-start gap-3 p-3.5 rounded-xl hover:bg-slate-50 transition group border border-transparent hover:border-slate-100"
                                    >
                                        {/* Icon loại */}
                                        <div
                                            className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}
                                        >
                                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                                        </div>

                                        {/* Nội dung */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-700 truncate">
                                                {item.title || "Không có tiêu đề"}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span
                                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}
                                                >
                                                    {cfg.label}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    Xóa{" "}
                                                    {item.deletedAt
                                                        ? new Date(item.deletedAt).toLocaleDateString(
                                                            "vi-VN"
                                                        )
                                                        : "gần đây"}
                                                </span>
                                            </div>
                                            {item.date && (
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    📅 {item.date}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions (hiện khi hover) */}
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pt-0.5">
                                            <button
                                                onClick={() => onRestore?.(item.id)}
                                                title="Khôi phục"
                                                className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-300 hover:text-emerald-600 transition"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onPermanentDelete?.(item.id)}
                                                title="Xóa vĩnh viễn"
                                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                {deletedItems.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                        <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                            Các mục trong thùng rác sẽ bị xóa vĩnh viễn sau 30 ngày
                        </p>
                        <button
                            onClick={handleClearAll}
                            className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-all duration-200
                ${confirmClear
                                    ? "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-100"
                                    : "bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
                                }`}
                        >
                            {confirmClear
                                ? "⚠ Nhấn lần nữa để xác nhận xóa tất cả"
                                : "Xóa vĩnh viễn tất cả"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}