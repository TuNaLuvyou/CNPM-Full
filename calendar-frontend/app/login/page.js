"use client";
import React, { useState, useEffect, Suspense } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Bell,
  Share2,
  CheckSquare,
  ShieldCheck,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { login, register, forgotPassword, resendVerification } from "@/lib/api";
import { t } from "@/lib/i18n";
import ThemeProvider from "@/components/ThemeProvider";
import PageLoader from "@/components/ui/PageLoader";

/* ─── Trang đăng nhập chính ────────────────────────────────────────────── */
export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader isLoading={true} />}>
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Đọc appSettings từ localStorage để đồng bộ theme & ngôn ngữ
  const [appSettings, setAppSettings] = useState({ theme: "light", language: "vi" });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("appSettings");
        if (saved) setAppSettings(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const lang = appSettings.language || "vi";
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState(initialMode); // login | register | forgot

  const [verify, setVerifyState] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("pending_verify");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  }); // { email, afterRegister }

  const setVerify = (val) => {
    setVerifyState(val);
    if (typeof window !== "undefined") {
      if (val) {
        sessionStorage.setItem("pending_verify", JSON.stringify(val));
      } else {
        sessionStorage.removeItem("pending_verify");
      }
    }
  };

  // Nếu đã đăng nhập → về trang chủ ngay lập tức, không bao giờ bị treo spinner
  useEffect(() => {
    // Safety fallback timer: Đảm bảo không bao giờ bị treo ở màn hình loading
    const safetyTimer = setTimeout(() => {
      setIsCheckingAuth(false);
      setMounted(true);
    }, 1500);

    const checkAuth = async () => {
      if (typeof window !== 'undefined' && localStorage.getItem('user')) {
        window.location.replace("/");
        return;
      }
      try {
        const { initAuth } = await import('@/lib/api');
        const user = await initAuth();
        if (user) {
          window.location.replace("/");
          return;
        }
      } catch {}

      clearTimeout(safetyTimer);
      setIsCheckingAuth(false);
      setMounted(true);
    };

    checkAuth();

    return () => clearTimeout(safetyTimer);
  }, []);

  const handleSuccess = () => {
    sessionStorage.removeItem("pending_verify");
    router.replace("/");
  };

  const switchMode = (next) => {
    setMode(next);
    setVerify(null);
  };

  if (!mounted || isCheckingAuth) {
    return <PageLoader isLoading={true} />;
  }

  return (
    <>
      <ThemeProvider appSettings={appSettings} />
      <div className="min-h-screen flex bg-slate-50 dark:bg-[#121212] font-sans selection:bg-blue-500 selection:text-white text-slate-800 dark:text-[#e3e3e3] transition-colors duration-200">
        {/* ── Cột trái: Dynamic Hero Banner (Cố định chiều cao h-screen sticky - Không bao giờ bị xê dịch) ── */}
        <aside className="hidden lg:flex lg:w-[46%] h-screen sticky top-0 flex-shrink-0 overflow-hidden flex-col justify-between px-10 pt-10 pb-6 text-white bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 border-r border-transparent dark:border-slate-800/60 transition-colors duration-200">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/10 dark:bg-blue-600/20 blur-[100px] pointer-events-none auth-pulse"></div>
          <div className="absolute bottom-10 left-0 -ml-20 w-96 h-96 rounded-full bg-blue-400/20 dark:bg-indigo-600/20 blur-[120px] pointer-events-none auth-pulse-slow"></div>

          {/* Top Header & Brand */}
          <div className="relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-white dark:bg-gradient-to-tr dark:from-blue-600 dark:to-indigo-500 rounded-2xl shadow-lg shadow-black/10 border border-white/20 flex items-center justify-center">
                <Calendar className="w-6.5 h-6.5 text-blue-600 dark:text-white" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white">
                {t("app_name", lang)}
              </span>
            </div>

            <h2 className="mt-6 text-2xl xl:text-3xl font-extrabold tracking-tight leading-snug text-white/95 max-w-xl">
              {t("auth_page.tagline", lang)}
            </h2>
            <p className="mt-2.5 text-blue-100 dark:text-slate-400 text-sm leading-relaxed max-w-md">
              {t("auth_page.description", lang)}
            </p>
          </div>

          {/* Dynamic Feature Cards (Nằm ở giữa) */}
          <div className="relative z-10 grid grid-cols-2 gap-4 my-auto">
            {[
              { icon: Calendar, title: "auth_page.feature1_title", desc: "auth_page.feature1_desc" },
              { icon: Bell, title: "auth_page.feature2_title", desc: "auth_page.feature2_desc" },
              { icon: Share2, title: "auth_page.feature3_title", desc: "auth_page.feature3_desc" },
              { icon: CheckSquare, title: "auth_page.feature4_title", desc: "auth_page.feature4_desc" },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="p-4 rounded-2xl bg-white/15 dark:bg-white/10 backdrop-blur-md border border-white/20 dark:border-white/10 hover:border-white/30 transition-all duration-300 group hover:-translate-y-0.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/20 dark:bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <p className="font-bold text-white text-sm">{t(f.title, lang)}</p>
                  <p className="text-xs text-blue-100/90 dark:text-slate-300/80 mt-1 leading-normal">{t(f.desc, lang)}</p>
                </div>
              );
            })}
          </div>

          {/* Footer Badge (Đẩy xuống sát đáy góc cột trái) */}
          <div className="relative z-10 flex items-center justify-between text-xs text-blue-100 dark:text-slate-400 border-t border-white/20 dark:border-white/10 pt-4 mt-auto">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-300 dark:text-emerald-400 flex-shrink-0" />
              <span>Bảo mật SSL 256-bit & Rate Limiting Protected</span>
            </div>
            <span className="flex-shrink-0">© 2026 {t("app_name", lang)}</span>
          </div>
        </aside>

        {/* ── Cột phải: Form Container (Được đồng bộ kích thước chuẩn - 0px xê dịch) ── */}
        <section className="flex-1 flex flex-col items-center justify-center relative overflow-y-auto p-6 sm:p-12 bg-slate-50 dark:bg-[#121212] transition-colors duration-200 min-h-screen">
          {/* Ambient Background Orbs */}
          <div className="absolute top-1/4 right-10 w-72 h-72 rounded-full bg-blue-100/60 dark:bg-blue-600/10 blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-indigo-100/50 dark:bg-indigo-600/10 blur-[120px] pointer-events-none"></div>

          <div className="relative z-10 w-full max-w-md py-6 my-auto">
            {/* Logo cho di động */}
            <div className="lg:hidden flex flex-col items-center gap-3 mb-8 text-center">
              <div className="w-12 h-12 bg-blue-600 dark:bg-gradient-to-tr dark:from-blue-600 dark:to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/25 flex items-center justify-center border border-white/20">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {t("app_name", lang)}
              </span>
            </div>

            {/* Form Card Container - Chiều cao cố định chuẩn min-h-[500px] */}
            <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-7 sm:p-9 border border-slate-200/80 dark:border-[#333] shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/50 min-h-[500px] flex flex-col justify-between transition-all duration-300">
              <div>
                {/* Header Title (Ẩn khi đang hiển thị màn hình thông báo xác nhận email hoặc quên mật khẩu) */}
                {!verify && mode !== "forgot" && (
                  <div className="text-center mb-6 h-[64px] flex flex-col justify-center">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                      {mode === "login"
                        ? t("auth_page.welcome_back", lang)
                        : t("user.create_account", lang)}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-xs sm:text-sm leading-relaxed">
                      {mode === "login"
                        ? t("auth_page.login_subtitle", lang)
                        : t("auth_page.register_subtitle", lang)}
                    </p>
                  </div>
                )}

                {/* Segmented Tab Bar (Đăng nhập / Đăng ký) */}
                {mode !== "forgot" && !verify && (
                  <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 dark:bg-[#141414] border border-slate-200/80 dark:border-[#2d2d2d] rounded-2xl mb-6">
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className={`py-2.5 text-xs sm:text-sm rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                        mode === "login"
                          ? "bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm dark:shadow-md dark:shadow-blue-600/30"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      }`}
                    >
                      {t("user.login", lang)}
                    </button>
                    <button
                      type="button"
                      onClick={() => switchMode("register")}
                      className={`py-2.5 text-xs sm:text-sm rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                        mode === "register"
                          ? "bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm dark:shadow-md dark:shadow-blue-600/30"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      }`}
                    >
                      {t("user.register", lang)}
                    </button>
                  </div>
                )}
              </div>

              {/* Dynamic Form Content Wrapper (Sử dụng key fade nhẹ, min-height đồng nhất) */}
              <div key={verify ? "verify" : mode} className="flex-1 flex flex-col justify-center auth-fade-in">
                {verify ? (
                  <VerifyPendingPanel
                    email={verify.email}
                    isAfterRegister={verify.afterRegister}
                    onBackToLogin={() => switchMode("login")}
                    lang={lang}
                  />
                ) : mode === "login" ? (
                  <LoginForm
                    lang={lang}
                    onSuccess={handleSuccess}
                    onUnverified={(email) => setVerify({ email, afterRegister: false })}
                    onForgot={() => switchMode("forgot")}
                    onSwitchMode={switchMode}
                  />
                ) : mode === "register" ? (
                  <RegisterForm
                    lang={lang}
                    onSuccess={handleSuccess}
                    onPending={(email) => setVerify({ email, afterRegister: true })}
                    onSwitchMode={switchMode}
                  />
                ) : (
                  <ForgotForm lang={lang} onBackToLogin={() => switchMode("login")} />
                )}
              </div>
            </div>


          </div>
        </section>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes authFadeIn {
            from { opacity: 0; transform: translateY(3px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .auth-fade-in { animation: authFadeIn .2s ease-out both; }
          @keyframes authPulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.08); }
          }
          .auth-pulse { animation: authPulse 8s ease-in-out infinite; }
          .auth-pulse-slow { animation: authPulse 12s ease-in-out 2s infinite; }
        ` }} />
      </div>
    </>
  );
}

/* ─── LoginForm Component ────────────────────────────────────────────────── */
function LoginForm({ lang, onSuccess, onForgot, onSwitchMode, onUnverified }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      onSuccess(data.user);
    } catch (err) {
      if (err.message === "email_not_verified") {
        onUnverified?.(email);
      } else {
        setError(err.message || t("user.login_failed", lang));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-1">
      {error && (
        <div className="flex items-start gap-3 text-xs sm:text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 px-4 py-3 rounded-2xl">
          <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Email</label>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors pointer-events-none" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="name@example.com"
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#333] rounded-2xl focus:bg-white dark:focus:bg-[#1e1e1e] focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition duration-200 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t("user.password", lang)}</label>
          <button
            type="button"
            onClick={onForgot}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold transition-colors"
          >
            {t("user.forgot_password", lang)}
          </button>
        </div>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors pointer-events-none" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#333] rounded-2xl focus:bg-white dark:focus:bg-[#1e1e1e] focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition duration-200 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
            title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/35 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none text-sm tracking-wide"
      >
        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
        {loading ? t("user.logging_in", lang) : t("user.login", lang)}
      </button>

      <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 pt-1">
        {t("user.no_account", lang)}{" "}
        <button
          type="button"
          onClick={() => onSwitchMode("register")}
          className="text-blue-600 dark:text-blue-400 font-bold hover:underline transition-colors"
        >
          {t("user.register_now", lang)}
        </button>
      </p>
    </form>
  );
}

/* ─── RegisterForm Component ─────────────────────────────────────────────── */
function RegisterForm({ lang, onSuccess, onPending, onSwitchMode }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await register(fullName, email, password);
      if (data.status === "pending_verification") {
        onPending(data.email || email);
      } else if (data.access || data.user) {
        onSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || t("user.register_failed", lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {error && (
        <div className="flex items-start gap-3 text-xs sm:text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 px-4 py-2.5 rounded-2xl">
          <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">{t("user.full_name", lang)}</label>
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors pointer-events-none" />
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t("user.enter_name", lang)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#333] rounded-2xl focus:bg-white dark:focus:bg-[#1e1e1e] focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition duration-200 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Email</label>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors pointer-events-none" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="name@example.com"
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#333] rounded-2xl focus:bg-white dark:focus:bg-[#1e1e1e] focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition duration-200 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">{t("user.password", lang)}</label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors pointer-events-none" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder={t("user.min_length_pass", lang)}
            className="w-full pl-11 pr-11 py-2.5 bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#333] rounded-2xl focus:bg-white dark:focus:bg-[#1e1e1e] focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition duration-200 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
            title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 mt-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/35 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none text-sm tracking-wide"
      >
        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
        {loading ? t("user.registering", lang) : t("user.register", lang)}
      </button>

      <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 pt-1">
        {t("user.has_account", lang)}{" "}
        <button
          type="button"
          onClick={() => onSwitchMode("login")}
          className="text-blue-600 dark:text-blue-400 font-bold hover:underline transition-colors"
        >
          {t("user.login", lang)}
        </button>
      </p>
    </form>
  );
}

/* ─── ForgotForm Component ───────────────────────────────────────────────── */
function ForgotForm({ lang, onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerToast = (type, title, msg) => {
    setToast({ type, title, message: msg });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setError("");
    setLoading(true);

    const defaultSuccessMsg = lang === "en"
      ? "Password reset link has been sent to your email. Please check your inbox (including Spam)."
      : "Đã gửi link khôi phục mật khẩu vào Email của bạn. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác/spam).";

    // Toast Popup góc phải trên
    triggerToast(
      "success",
      lang === "en" ? "Reset Link Sent!" : "Đã gửi link khôi phục!",
      defaultSuccessMsg
    );
    setMessage(defaultSuccessMsg);

    try {
      const data = await forgotPassword(email);
      if (data.status) setMessage(data.status);
    } catch (err) {
      setMessage("");
      const errMsg = err.message || (lang === "en" ? "Failed to send request" : "Gửi yêu cầu thất bại");
      setError(errMsg);
      triggerToast(
        "error",
        lang === "en" ? "Request Failed" : "Gửi yêu cầu thất bại",
        errMsg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 relative">
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
              <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
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

      {message ? (
        <div className="text-center space-y-5 py-2">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            {lang === "en" ? "Check Your Inbox" : "Kiểm tra Hộp Thư"}
          </h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm font-medium px-2 leading-relaxed">{message}</p>
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all active:scale-[0.98] text-sm"
          >
            {t("user.back_to_login", lang)}
          </button>
        </div>
      ) : (
        <>
          {/* 🔑 Header + Icon Badge đồng bộ chuẩn mỹ thuật */}
          <div className="text-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-md shadow-blue-500/10 mx-auto mb-3">
              <KeyRound className="w-8 h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-1">
              {t("user.recover_password", lang)}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-2">
              {t("user.enter_email_recover", lang)}
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 text-xs sm:text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 px-4 py-3 rounded-2xl">
              <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#333] rounded-2xl focus:bg-white dark:focus:bg-[#1e1e1e] focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition duration-200 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium"
              />
            </div>
          </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none text-sm tracking-wide"
      >
        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
        {loading ? t("user.sending", lang) : t("user.send_request", lang)}
      </button>

      <div className="pt-1 text-center">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors inline-block"
        >
          {t("user.back_to_login", lang)}
        </button>
      </div>
        </>
      )}
    </form>
  );
}

/* ─── VerifyPendingPanel Component ───────────────────────────────────────── */
function VerifyPendingPanel({ email, isAfterRegister = false, onBackToLogin, lang = "vi" }) {
  const [resendLoading, setResendLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', title, message }
  const [resendCount, setResendCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const triggerToast = (type, title, message) => {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleResend = async () => {
    if (!email) return;
    setResendCount((c) => c + 1);

    // Optimistic UI Toast Popup thành công ở góc trên bên phải
    triggerToast(
      "success",
      lang === "en" ? "Verification email sent!" : "Đã gửi lại email xác nhận!",
      lang === "en" ? "Please check your inbox (including Spam)." : "Vui lòng kiểm tra hộp thư (bao gồm cả Spam)."
    );

    try {
      await resendVerification(email);
    } catch (err) {
      // Nếu có lỗi ➔ Bật Popup Toast màu đỏ ở góc trên bên phải
      triggerToast(
        "error",
        lang === "en" ? "Failed to send email" : "Gửi email thất bại!",
        err.message || (lang === "en" ? "Failed to send. Please try again later." : "Gửi thất bại. Vui lòng thử lại sau.")
      );
    }
  };

  return (
    <div className="text-center space-y-5 relative">
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
              <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
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

      <div className="flex justify-center">
        <div className="w-18 h-18 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Mail className="w-8 h-8" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
          {isAfterRegister
            ? lang === "en"
              ? "Check your inbox!"
              : "Kiểm tra hộp thư của bạn!"
            : lang === "en"
            ? "Account not verified"
            : "Tài khoản chưa được xác thực"}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-2">
          {isAfterRegister
            ? lang === "en"
              ? "We sent a verification email to:"
              : "Chúng tôi đã gửi email xác nhận đến:"
            : lang === "en"
            ? "This account email is not verified. Please check:"
            : "Email của tài khoản này chưa được xác thực. Vui lòng kiểm tra:"}
        </p>
      </div>

      {email && (
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold px-4 py-2 rounded-full">
          <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          {email}
        </div>
      )}

      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl px-4 py-3 text-xs text-amber-800 dark:text-amber-300 text-left space-y-1">
        <p>
          <strong>⚠ {lang === "en" ? "Note:" : "Lưu ý:"}</strong>{" "}
          {lang === "en"
            ? "The verification link is valid for 5 minutes."
            : "Link xác nhận chỉ có hiệu lực trong 5 phút."}
        </p>
        <p className="text-[11.5px] opacity-90">
          📩 {lang === "en"
            ? "Please check your Junk/Spam folder if you don't see the email in your main inbox."
            : "Vui lòng kiểm tra kỹ thư mục Thư rác/Spam nếu không thấy email trong hộp thư đến chính."}
        </p>
      </div>

      <button
        onClick={handleResend}
        disabled={resendLoading}
        className="w-full py-3 border border-blue-600/40 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-60"
      >
        {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        {resendLoading
          ? lang === "en"
            ? "Sending..."
            : "Đang gửi..."
          : resendCount > 0
          ? lang === "en"
            ? "Resend again"
            : "Gửi lại lần nữa"
          : lang === "en"
          ? "Resend verification email"
          : "Gửi lại email xác nhận"}
      </button>

      <button
        onClick={onBackToLogin}
        className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-colors text-xs sm:text-sm"
      >
        {t("user.back_to_login", lang)}
      </button>
    </div>
  );
}
