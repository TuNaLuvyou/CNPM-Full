import React, { useState } from "react";
import { Store, ExternalLink } from "lucide-react";

const MOCK_ADDONS = [
  {
    id: 1,
    name: "Zoom",
    desc: "Tích hợp họp video trực tiếp vào lịch",
    icon: "🎥",
    installed: true,
  },
  {
    id: 2,
    name: "Trello",
    desc: "Đồng bộ task Trello với lịch của bạn",
    icon: "📋",
    installed: false,
  },
  {
    id: 3,
    name: "Slack",
    desc: "Nhận thông báo sự kiện qua Slack",
    icon: "💬",
    installed: false,
  },
  {
    id: 4,
    name: "Notion",
    desc: "Liên kết ghi chú Notion với sự kiện",
    icon: "📝",
    installed: false,
  },
  {
    id: 5,
    name: "GitHub",
    desc: "Theo dõi deadline PR và release",
    icon: "🐙",
    installed: false,
  },
];

export default function AddonsPanel() {
  const [addons, setAddons] = useState(MOCK_ADDONS);

  const toggleAddon = (id) =>
    setAddons((prev) =>
      prev.map((a) => (a.id === id ? { ...a, installed: !a.installed } : a)),
    );

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3 border-b border-slate-100 sticky top-0 bg-white z-10">
        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Store className="w-4 h-4 text-slate-600" /> Tiện ích bổ sung
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Google Workspace Marketplace
        </p>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-2">
        {addons.map((addon) => (
          <div
            key={addon.id}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm transition"
          >
            <span className="text-2xl flex-shrink-0">{addon.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700">
                {addon.name}
              </p>
              <p className="text-xs text-slate-400 leading-tight mt-0.5 line-clamp-2">
                {addon.desc}
              </p>
            </div>
            <button
              onClick={() => toggleAddon(addon.id)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                addon.installed
                  ? "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-100"
              }`}
            >
              {addon.installed ? "Gỡ" : "Cài đặt"}
            </button>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
        <a
          href="https://workspace.google.com/marketplace"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-bold transition py-1.5 bg-white border border-slate-200 rounded-lg hover:border-blue-300 shadow-sm"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Khám phá thêm Add-ons
        </a>
      </div>
    </div>
  );
}
