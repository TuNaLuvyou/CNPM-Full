import React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { t } from "@/lib/i18n";
import { logout } from "@/lib/api";

export default function UserMenu({ currentUser, setCurrentUser, appSettings, setIsProfileModalOpen }) {
  const lang = appSettings?.language || "vi";
  const router = useRouter();

  if (currentUser) {
    const displayName = currentUser.full_name || currentUser.username || "User";
    return (
      <div className="flex items-center gap-3 h-9 px-3 bg-white dark:bg-[#2d2d2d] border border-slate-200 dark:border-[#484848] rounded-lg shadow-sm">
        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span 
          className="text-sm text-slate-600 dark:text-[#9e9e9e] cursor-pointer hover:bg-slate-50 dark:hover:bg-[#353535] px-1 rounded transition-colors"
          onClick={() => setIsProfileModalOpen(true)}
          title={t('user.edit_profile', lang) || "Chỉnh sửa thông tin cá nhân"}
        >
          {t('user.welcome', lang)},{" "}
          <span className="font-bold text-blue-600 dark:text-[#f5f5f5] underline decoration-blue-600/30 dark:decoration-[#f5f5f5]/30 underline-offset-4 decoration-2 hover:decoration-blue-600 dark:hover:decoration-[#f5f5f5] transition-all">{displayName}</span>
        </span>
        <div className="w-px h-4 bg-slate-200 dark:bg-[#484848] mx-1"></div>
        <button
          onClick={() => {
            logout(); // Đăng xuất ngầm, không await
            if (setCurrentUser) setCurrentUser(null);
            router.replace('/login');
          }}
          className="text-slate-400 dark:text-[#9e9e9e] hover:text-red-500 transition-colors"
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
        onClick={() => router.push("/login")}
        className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
      >
        {t('user.login', lang)}
      </button>
      <button
        onClick={() => router.push("/login?mode=register")}
        className="h-9 px-4 bg-white dark:bg-[#2d2d2d] text-blue-600 border border-blue-600 hover:bg-blue-50 text-sm font-medium rounded-lg transition-colors"
      >
        {t('user.register', lang)}
      </button>
    </div>
  );
}
