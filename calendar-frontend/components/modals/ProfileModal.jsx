"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, User, Lock, Eye, EyeOff, Save, CheckCircle, Shield, AlertCircle } from "lucide-react";
import { t } from "@/lib/i18n";
import { updateProfile } from "@/lib/api";

const AVATAR_COLORS = [
  "#4285F4", "#EA4335", "#FBBC05", "#34A853",
  "#FF6D01", "#46BDC6", "#7B1FA2", "#E91E63",
];

export default function ProfileModal({ isOpen, onClose, currentUser, setCurrentUser, lang }) {
  const [activeTab, setActiveTab] = useState("profile");

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState({ current: false, new: false });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerToast = (type, title, message) => {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      setProfileForm({
        full_name: currentUser.full_name || "",
        email: currentUser.email || "",
        phone_number: currentUser.phone_number || "",
      });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setActiveTab("profile");
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const avatarChar = (currentUser?.full_name || currentUser?.email || "U").charAt(0).toUpperCase();
  const avatarColor = AVATAR_COLORS[(currentUser?.id || 0) % AVATAR_COLORS.length];

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      const updatedUser = await updateProfile({
        full_name: profileForm.full_name,
        email: profileForm.email,
        phone_number: profileForm.phone_number,
      });
      setCurrentUser(updatedUser);
      triggerToast(
        "success",
        lang === "en" ? "Profile Updated!" : "Cập nhật thành công!",
        lang === "en" ? "Your personal information has been updated." : "Thông tin cá nhân của bạn đã được lưu."
      );
    } catch (err) {
      triggerToast(
        "error",
        lang === "en" ? "Update Failed" : "Cập nhật thất bại!",
        err.message || t('profile.error', lang)
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      triggerToast(
        "error",
        lang === "en" ? "Password Mismatch" : "Mật khẩu không khớp!",
        t('profile.passwordMismatch', lang)
      );
      setPasswordLoading(false);
      return;
    }

    try {
      await updateProfile({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      triggerToast(
        "success",
        lang === "en" ? "Password Changed!" : "Đổi mật khẩu thành công!",
        lang === "en" ? "Your account password has been updated." : "Mật khẩu mới đã được cập nhật thành công."
      );
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      triggerToast(
        "error",
        lang === "en" ? "Password Change Failed" : "Đổi mật khẩu thất bại!",
        err.message || t('profile.error', lang)
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 🔔 Popup Toast Thông Báo (Gắn Portal trực tiếp vào document.body ở góc trên bên phải màn hình) */}
      {mounted && toast && typeof window !== "undefined" && createPortal(
        <div
          className={`fixed top-6 right-6 z-[99999] flex items-center justify-between gap-3.5 px-4.5 py-3.5 rounded-xl shadow-2xl border text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-top-3 duration-250 min-w-[300px] max-w-md text-white ${
            toast.type === "success"
              ? "bg-emerald-600 border-emerald-500 shadow-emerald-600/40"
              : "bg-rose-600 border-rose-500 shadow-rose-600/40"
          }`}
        >
          <div className="flex items-center gap-3">
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />
            )}
            <div className="text-left">
              <p className="font-bold text-white text-xs sm:text-sm">{toast.title}</p>
              <p className="text-[11px] sm:text-xs text-white/90 mt-0.5">{toast.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-white/80 hover:text-white text-sm p-1 transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>,
        document.body
      )}

      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-[#2d2d2d] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#484848]">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            {t('profile.title', lang)}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-[#353535] rounded-full transition-colors text-slate-400 dark:text-[#9e9e9e] hover:text-slate-600 dark:hover:text-[#e3e3e3]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-[#484848]">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === "profile"
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-500 dark:text-white/60 hover:text-slate-700 dark:hover:text-white"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              <span>{t('profile.title', lang)}</span>
            </div>
            {activeTab === "profile" && (
              <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === "security"
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-500 dark:text-white/60 hover:text-slate-700 dark:hover:text-white"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              <span>{t('profile.changePassword', lang)}</span>
            </div>
            {activeTab === "security" && (
              <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <form onSubmit={handleProfileSubmit} className="p-4 sm:p-5 space-y-3">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-1 pb-0.5">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md shadow-slate-300 dark:shadow-none"
                style={{ backgroundColor: avatarColor }}
              >
                {avatarChar}
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-white/60">{currentUser?.email}</p>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-white mb-1">
                  {t('profile.fullName', lang)}
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={profileForm.full_name}
                  onChange={handleProfileChange}
                  className="w-full h-9.5 px-3 bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#484848] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 dark:text-white text-xs sm:text-sm font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-white mb-1">
                  {t('profile.email', lang)}
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className="w-full h-9.5 px-3 bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#484848] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 dark:text-white text-xs sm:text-sm font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-white mb-1">
                  {t('profile.phone', lang)}
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={profileForm.phone_number}
                  onChange={handleProfileChange}
                  placeholder="0xxx xxx xxx"
                  className="w-full h-9.5 px-3 bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#484848] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 dark:text-white text-xs sm:text-sm font-medium"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-9.5 px-4 border border-slate-200 dark:border-[#484848] text-slate-600 dark:text-white font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-[#353535] transition-colors text-xs sm:text-sm"
              >
                {t('cancel', lang)}
              </button>
              <button
                type="submit"
                disabled={profileLoading}
                className="flex-[2] h-9.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-md shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
              >
                {profileLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    {t('profile.save', lang)}
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <form onSubmit={handlePasswordSubmit} className="p-4 sm:p-5 space-y-3">
            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-white mb-1">
                  {t('profile.currentPassword', lang)}
                </label>
                <div className="relative">
                  <input
                    type={showPassword.current ? "text" : "password"}
                    name="current_password"
                    value={passwordForm.current_password}
                    onChange={handlePasswordChange}
                    placeholder={lang === "en" ? "Enter current password" : "Nhập mật khẩu hiện tại"}
                    className="w-full h-9.5 px-3 bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#484848] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 dark:text-white pr-9 text-xs sm:text-sm font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => ({ ...p, current: !p.current }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#9e9e9e] hover:text-slate-600 dark:hover:text-[#e3e3e3] transition-colors"
                  >
                    {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-white mb-1">
                  {t('profile.newPassword', lang)}
                </label>
                <div className="relative">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    name="new_password"
                    value={passwordForm.new_password}
                    onChange={handlePasswordChange}
                    placeholder={lang === "en" ? "Minimum 6 characters" : "Tối thiểu 6 ký tự"}
                    className="w-full h-9.5 px-3 bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#484848] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 dark:text-white pr-9 text-xs sm:text-sm font-medium"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => ({ ...p, new: !p.new }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#9e9e9e] hover:text-slate-600 dark:hover:text-[#e3e3e3] transition-colors"
                  >
                    {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-white mb-1">
                  {t('profile.confirmPassword', lang)}
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={passwordForm.confirm_password}
                  onChange={handlePasswordChange}
                  placeholder={lang === "en" ? "Re-enter new password" : "Nhập lại mật khẩu mới"}
                  className="w-full h-9.5 px-3 bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#484848] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 dark:text-white text-xs sm:text-sm font-medium"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-9.5 px-4 border border-slate-200 dark:border-[#484848] text-slate-600 dark:text-white font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-[#353535] transition-colors text-xs sm:text-sm"
              >
                {t('cancel', lang)}
              </button>
              <button
                type="submit"
                disabled={passwordLoading}
                className="flex-[2] h-9.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-md shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
              >
                {passwordLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    {t('profile.changePassword', lang)}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}