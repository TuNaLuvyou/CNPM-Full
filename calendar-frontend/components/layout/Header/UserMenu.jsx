import React from "react";
import { LogOut } from "lucide-react";
import { t } from "@/lib/i18n";

export default function UserMenu({ currentUser, setCurrentUser, setAuthModal, appSettings, setIsProfileModalOpen }) {
  const lang = appSettings?.language || "vi";

  if (currentUser) {
    const displayName = currentUser.full_name || currentUser.username || "User";
    return (
      <div className="flex items-center gap-3 h-9 px-3 bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span 
          className="text-sm text-slate-600 cursor-pointer hover:bg-slate-50 px-1 rounded transition-colors"
          onClick={() => setIsProfileModalOpen(true)}
          title={t('user.edit_profile', lang) || "Chỉnh sửa thông tin cá nhân"}
        >
          {t('user.welcome', lang)},{" "}
          <span className="font-bold text-blue-600 underline decoration-blue-600/30 underline-offset-4 decoration-2 hover:decoration-blue-600 transition-all">{displayName}</span>
        </span>
        <div className="w-px h-4 bg-slate-200 mx-1"></div>
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              localStorage.removeItem("token");
              window.location.reload();
            }
          }}
          className="text-slate-400 hover:text-red-500 transition-colors"
          title={t('user.logout', lang)}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setAuthModal({ isOpen: true, type: "login" })}
        className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
      >
        {t('user.login', lang)}
      </button>
      <button
        onClick={() => setAuthModal({ isOpen: true, type: "register" })}
        className="h-9 px-4 bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 text-sm font-medium rounded-lg transition-colors"
      >
        {t('user.register', lang)}
      </button>
    </div>
  );
}
