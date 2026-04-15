import React, { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

export default function SearchBar({ isSearchOpen, setIsSearchOpen }) {
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target) && isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isSearchOpen, setIsSearchOpen]);

  useEffect(() => {
    if (isSearchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [isSearchOpen]);

  return (
    <div ref={searchRef} className="relative z-50">
      <button
        onClick={() => {
          setIsSearchOpen((v) => !v);
          setSearchQuery("");
        }}
        className={`p-2 rounded-full transition ${
          isSearchOpen ? "bg-blue-50 text-blue-600" : "hover:text-slate-700 hover:bg-slate-100"
        }`}
      >
        <Search className="w-5 h-5" />
      </button>
      {isSearchOpen && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sự kiện, lịch hẹn..."
              className="flex-1 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="py-8 flex flex-col items-center gap-2 text-slate-400">
            <Search className="w-8 h-8 text-slate-200" />
            <p className="text-sm font-medium">
              {searchQuery
                ? `Không tìm thấy "${searchQuery}"`
                : "Nhập từ khóa để tìm kiếm"}
            </p>
            {!searchQuery && (
              <p className="text-xs text-slate-300">
                Sự kiện, việc làm, lịch hẹn...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
