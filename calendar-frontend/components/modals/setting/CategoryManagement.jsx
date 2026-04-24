import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { t } from "@/lib/i18n";
import { SectionLabel, Card } from "./SharedUI";

export default function CategoryManagement({ s, set, lang }) {
    const [newCat, setNewCat] = useState("");
    const categories = s.customCategories || [];

    const addCategory = () => {
        const name = newCat.trim();
        if (!name || categories.includes(name)) return;
        const updated = [...categories, name];
        set("customCategories", updated);
        setNewCat("");
    };

    const removeCategory = (name) => {
        const updated = categories.filter((c) => c !== name);
        set("customCategories", updated);
    };

    return (
        <div id="section-categories" className="space-y-6 scroll-mt-6 pb-20">
            <SectionLabel>{t('categories_settings.title', lang)}</SectionLabel>

            <Card>
                <div className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-700 mb-1">{t('categories_settings.add_title', lang)}</p>
                    <p className="text-xs text-slate-400 mb-4">{t('categories_settings.add_desc', lang)}</p>

                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newCat}
                            onChange={(e) => setNewCat(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addCategory()}
                            placeholder={t('categories_settings.placeholder', lang)}
                            className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700
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

                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t('sections.category_list', lang)} ({categories.length})</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categories.map((cat) => (
                            <div
                                key={cat}
                                className="flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-sm text-slate-700 font-medium">{cat}</span>
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
