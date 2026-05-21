import React, { useState, useRef, useEffect } from "react";
import { Search, X, Calendar, CheckSquare } from "lucide-react";

export default function SearchBar({ isSearchOpen, setIsSearchOpen, events = [], onSearchItemClick }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target) && isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery("");
        setResults([]);
        setHasSearched(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isSearchOpen, setIsSearchOpen]);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  const triggerSearch = () => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    
    // Tìm kiếm sự kiện, task, hoặc lịch hẹn theo tên hoặc mô tả
    const filtered = events.filter((ev) => {
      const matchTitle = ev.title && ev.title.toLowerCase().includes(q);
      const matchDesc = ev.description && ev.description.toLowerCase().includes(q);
      return matchTitle || matchDesc;
    });
    
    setResults(filtered);
    setHasSearched(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      triggerSearch();
    }
  };

  const formatItemDate = (item) => {
    const dateStr = item.start_time || item.deadline_time || item.created_at;
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const handleItemClick = (item) => {
    if (onSearchItemClick) {
      onSearchItemClick(item);
    }
    // Đóng và reset tìm kiếm
    setIsSearchOpen(false);
    setSearchQuery("");
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div ref={searchRef} className="relative z-50">
      <button
        onClick={() => {
          setIsSearchOpen((v) => !v);
          setSearchQuery("");
          setResults([]);
          setHasSearched(false);
        }}
        className={`p-2 rounded-full transition ${
          isSearchOpen ? "bg-blue-50 text-blue-600" : "hover:text-slate-700 hover:bg-slate-100"
        }`}
      >
        <Search className="w-5 h-5" />
      </button>
      
      {isSearchOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Input Box */}
          <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tên sự kiện, task... và nhấn Enter"
              className="flex-1 text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setResults([]);
                  setHasSearched(false);
                }}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Results List */}
          <div className="max-h-80 overflow-y-auto">
            {hasSearched ? (
              results.length > 0 ? (
                <div className="py-2 divide-y divide-slate-50">
                  {results.map((item) => {
                    const isTask = item.event_type === "task";
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-blue-50/40 transition cursor-pointer group"
                      >
                        <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${
                          isTask ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                        }`}>
                          {isTask ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Calendar className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition truncate">
                            {item.title || "Không có tiêu đề"}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 font-medium">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isTask ? "bg-purple-100/60 text-purple-700" : "bg-blue-100/60 text-blue-700"
                            }`}>
                              {isTask ? "Công việc" : (item.event_type === "appointment" ? "Lịch hẹn" : "Sự kiện")}
                            </span>
                            <span>•</span>
                            <span>{formatItemDate(item)}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center gap-2 text-slate-400">
                  <Search className="w-8 h-8 text-slate-200" />
                  <p className="text-sm font-medium">
                    Không tìm thấy kết quả cho "{searchQuery}"
                  </p>
                  <p className="text-xs text-slate-300">
                    Vui lòng thử lại với từ khóa khác.
                  </p>
                </div>
              )
            ) : (
              <div className="py-10 flex flex-col items-center gap-2 text-slate-400">
                <Search className="w-8 h-8 text-slate-200" />
                <p className="text-sm font-medium">Nhập từ khóa và nhấn Enter</p>
                <p className="text-xs text-slate-300">
                  Tìm kiếm sự kiện, việc làm, lịch hẹn...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
