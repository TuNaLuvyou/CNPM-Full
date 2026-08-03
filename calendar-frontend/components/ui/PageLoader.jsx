"use client";
import React from "react";
import { t } from "@/lib/i18n";

/**
 * Minimal & Clean Full-Screen Page Loader with zero-flicker i18n support.
 */
export default function PageLoader({ isLoading, text }) {
  const [mounted, setMounted] = React.useState(false);
  const [lang, setLang] = React.useState("vi");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("appSettings");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.language) setLang(parsed.language);
        }
      } catch {}
    }
    setMounted(true);
  }, []);

  if (!isLoading) return null;

  const displayText = text && text !== "Đang tải..." && text !== "Loading..." ? text : t("loading", lang);

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-[#1f1f1f] text-slate-800 dark:text-white">
      <div className="flex flex-col items-center gap-4">
        {/* Simple Circular Spinner */}
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
        
        {/* Subtitle - Chỉ hiển thị khi đã xác định chính xác ngôn ngữ client */}
        {mounted && (
          <span suppressHydrationWarning className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {displayText}
          </span>
        )}
      </div>
    </div>
  );
}
