import React from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { t } from "@/lib/i18n";

export function SectionLabel({ children }) {
    return (
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#9e9e9e] mb-3 px-1">
            {children}
        </p>
    );
}

export function Card({ children, className = "" }) {
    return (
        <div className={`bg-white dark:bg-[#2d2d2d] rounded-2xl border border-slate-100 dark:border-[#3c3c3c] shadow-sm overflow-hidden ${className}`}>
            {children}
        </div>
    );
}

export function Row({ label, desc, children, disabled }) {
    return (
        <div className={`flex items-center justify-between gap-6 px-5 py-4 border-b border-slate-50 dark:border-[#484848] last:border-0
      ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-700 dark:text-white leading-tight">{label}</p>
                {desc && <p className="text-xs text-slate-400 dark:text-[#9e9e9e] mt-0.5 leading-snug">{desc}</p>}
            </div>
            <div className="flex-shrink-0">{children}</div>
        </div>
    );
}

export function Toggle({ checked, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        ${checked ? "bg-blue-600" : "bg-slate-200 dark:bg-[#484848] hover:bg-slate-300 dark:hover:bg-[#616161]"}`}
            role="switch"
            aria-checked={checked}
        >
            <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-[#2d2d2d] rounded-full shadow-md transition-transform duration-200
          ${checked ? "translate-x-5" : "translate-x-0"}`}
            />
        </button>
    );
}

export function Select({ value, onChange, options, className = "" }) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`text-sm border border-slate-200 dark:border-[#484848] rounded-xl px-3 py-2 text-slate-700 dark:text-white bg-white dark:bg-[#1f1f1f]
        hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
        transition cursor-pointer min-w-[240px] sm:min-w-[300px] ${className}`}
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    );
}

export function Input({ value, onChange, placeholder, icon: Icon, className = "" }) {
    return (
        <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-slate-400 dark:text-[#9e9e9e] flex-shrink-0" />}
            <input
                type="text"
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`text-sm border border-slate-200 dark:border-[#484848] rounded-xl px-3 py-2 text-slate-700 dark:text-white placeholder-slate-300
          bg-white dark:bg-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition
          w-full max-w-[300px] ${className}`}
            />
        </div>
    );
}

/**
 * Inline sync status indicator used across settings sections.
 * state: "saving" | "saved" | "error" | null
 */
export function SyncIndicator({ state, lang = "vi", error, className = "" }) {
    if (state === "saving") {
        return (
            <span className={`inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-[#9e9e9e] animate-pulse ${className}`}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {t('saving', lang)}
            </span>
        );
    }
    if (state === "saved") {
        return (
            <span className={`inline-flex items-center gap-1.5 text-xs text-emerald-500 ${className}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('saved', lang)}
            </span>
        );
    }
    if (state === "error") {
        return (
            <span className={`inline-flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 ${className}`}>
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error || t('settings_sync_error', lang)}
            </span>
        );
    }
    return null;
}
