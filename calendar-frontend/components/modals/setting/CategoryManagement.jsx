import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { t } from "@/lib/i18n";
import { SectionLabel, Card, SyncIndicator } from "./SharedUI";
import { saveCustomCategories } from "@/lib/api";

export default function CategoryManagement({ s, set, lang }) {
    const [newCat, setNewCat] = useState("");
    const [catStatus, setCatStatus] = useState(null); // null | "saving" | "saved" | "error"
    const categories = s.customCategories || [];

    const persist = async (updated, rollbackValue) => {
        setCatStatus("saving");
        try {
            await saveCustomCategories(updated);
            setCatStatus("saved");
            setTimeout(() => setCatStatus((st) => (st === "saved" ? null : st)), 2000);
        } catch (e) {
            console.error("Lỗi lưu danh mục:", e);
            // Optimistic rollback: trả lại state cũ nếu lưu thất bại
            set("customCategories", rollbackValue);
            setCatStatus("error");
            setTimeout(() => setCatStatus((st) => (st === "error" ? null : st)), 4000);
        }
    };

    const addCategory = async () => {
        const name = newCat.trim();
        if (!name || categories.includes(name)) return;
        const prev = categories;
        const updated = [...prev, name];
        // Optimistic: UI + app cập nhật ngay, lưu server ở phía sau
        set("customCategories", updated);
        setNewCat("");
        await persist(updated, prev);
    };

    const removeCategory = async (name) => {
        const prev = categories;
        const updated = prev.filter((c) => c !== name);
        set("customCategories", updated);
        await persist(updated, prev);
    };


    return (
        <div id="section-categories" className="space-y-6 scroll-mt-6 pb-20">
            <SectionLabel>{t('categories_settings.title', lang)}</SectionLabel>

            <Card>
                <div className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-700 dark:text-white mb-1">{t('categories_settings.add_title', lang)}</p>
                    <p className="text-xs text-slate-400 dark:text-[#9e9e9e] mb-4">{t('categories_settings.add_desc', lang)}</p>

                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newCat}
                            onChange={(e) => setNewCat(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addCategory()}
                            placeholder={t('categories_settings.placeholder', lang)}
                            className="flex-1 text-sm border border-slate-200 dark:border-[#484848] dark:bg-[#1f1f1f] rounded-xl px-4 py-2.5 text-slate-700 dark:text-white
                                placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                        />
                        <button
                            type="button"
                            onClick={addCategory}
                            disabled={!newCat.trim() || categories.includes(newCat.trim())}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400
                                text-white text-sm font-semibold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                        >
                            <Plus className="w-4 h-4" /> {t('fav_calendars.add', lang)}
                        </button>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-[#9e9e9e] uppercase tracking-widest">{t('sections.category_list', lang)} ({categories.length})</p>
                        <SyncIndicator state={catStatus} lang={lang} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categories.map((cat) => (
                            <div
                                key={cat}
                                className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-[#1f1f1f] hover:bg-slate-100 dark:hover:bg-[#353535] rounded-xl transition group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-sm text-slate-700 dark:text-white font-medium">{cat}</span>
                                </div>
                                {cat !== "Mặc định" && (
                                    <button
                                        type="button"
                                        onClick={() => removeCategory(cat)}
                                        className="text-slate-300 hover:text-red-500 transition p-1 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
}
