"use client";
import React, { useState, useEffect } from "react";
import { X, User, Mail, Phone, Lock, Eye, EyeOff, Save, CheckCircle, Shield } from "lucide-react";
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
  const [profileError, setProfileError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      setProfileForm({
        full_name: currentUser.full_name || "",
        email: currentUser.email || "",
        phone_number: currentUser.phone_number || "",
      });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setProfileError(null);
      setPasswordError(null);
      setProfileSuccess(false);
      setPasswordSuccess(false);
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
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const updatedUser = await updateProfile({
        full_name: profileForm.full_name,
        email: profileForm.email,
        phone_number: profileForm.phone_number,
      });
      setCurrentUser(updatedUser);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err.message || t('profile.error', lang));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError(t('profile.passwordMismatch', lang));
      setPasswordLoading(false);
      return;
    }

    try {
      await updateProfile({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordSuccess(true);
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err.message || t('profile.error', lang));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
          <form onSubmit={handleProfileSubmit} className="p-6 space-y-5">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 pb-2">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg"
                style={{ backgroundColor: avatarColor }}
              >
                {avatarChar}
              </div>
              <p className="text-sm text-slate-500 dark:text-white/60">{currentUser?.email}</p>
            </div>

            {profileError && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {t('profile.success', lang)}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-white mb-1.5">
                  {t('profile.fullName', lang)}
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={profileForm.full_name}
                  onChange={handleProfileChange}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#484848] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-white mb-1.5">
                  {t('profile.email', lang)}
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#484848] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-white mb-1.5">
                  {t('profile.phone', lang)}
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={profileForm.phone_number}
                  onChange={handleProfileChange}
                  placeholder="0xxx xxx xxx"
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#484848] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 px-4 border border-slate-200 dark:border-[#484848] text-slate-600 dark:text-white font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-[#353535] transition-colors"
              >
                {t('cancel', lang)}
              </button>
              <button
                type="submit"
                disabled={profileLoading}
                className="flex-[2] h-11 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
              >
                {profileLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t('profile.save', lang)}
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
            <div className="flex items-center gap-3 pb-1">
              <Lock className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">{t('profile.changePassword', lang)}</h3>
                <p className="text-xs text-slate-400 dark:text-white/50">Tối thiểu 6 ký tự</p>
              </div>
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Đổi mật khẩu thành công!
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-white mb-1.5">
                  {t('profile.currentPassword', lang)}
                </label>
                <div className="relative">
                  <input
                    type={showPassword.current ? "text" : "password"}
                    name="current_password"
                    value={passwordForm.current_password}
                    onChange={handlePasswordChange}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#484848] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 dark:text-white pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => ({ ...p, current: !p.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#9e9e9e] hover:text-slate-600 dark:hover:text-[#e3e3e3] transition-colors"
                  >
                    {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-white mb-1.5">
                  {t('profile.newPassword', lang)}
                </label>
                <div className="relative">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    name="new_password"
                    value={passwordForm.new_password}
                    onChange={handlePasswordChange}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#484848] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 dark:text-white pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => ({ ...p, new: !p.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#9e9e9e] hover:text-slate-600 dark:hover:text-[#e3e3e3] transition-colors"
                  >
                    {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-white mb-1.5">
                  {t('profile.confirmPassword', lang)}
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={passwordForm.confirm_password}
                  onChange={handlePasswordChange}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#484848] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 px-4 border border-slate-200 dark:border-[#484848] text-slate-600 dark:text-white font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-[#353535] transition-colors"
              >
                {t('cancel', lang)}
              </button>
              <button
                type="submit"
                disabled={passwordLoading}
                className="flex-[2] h-11 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
              >
                {passwordLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Đổi mật khẩu
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