"use client";
import React from "react";

/**
 * Minimal & Clean Full-Screen Page Loader.
 * Full screen backdrop + simple circular spinner + "Đang tải..." text.
 */
export default function PageLoader({ isLoading, text = "Đang tải..." }) {
  const [shouldRender, setShouldRender] = React.useState(isLoading);

  React.useEffect(() => {
    if (isLoading) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-[#1f1f1f] transition-opacity duration-500 ease-in-out ${
        isLoading
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Simple Circular Spinner */}
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
        
        {/* Subtitle */}
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {text}
        </span>
      </div>
    </div>
  );
}
