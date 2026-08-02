"use client";
import React, { useState } from 'react';
import { X, Loader2, Mail, RefreshCw, LogOut, CheckCircle } from 'lucide-react';
import { login, register, forgotPassword, resendVerification } from '@/lib/api';
import { t } from '@/lib/i18n';

export default function AuthModal({ isOpen, type, onClose, onSwitchType, onLoginSuccess, canClose = true, lang = "vi" }) {
    if (!isOpen) return null;

    const isLogin = type === 'login';
    const isForgot = type === 'forgot';
    const isRegister = type === 'register';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white dark:bg-[#2d2d2d] rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
                {canClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 dark:text-[#9e9e9e] hover:text-slate-600 dark:hover:text-[#bdbdbd] hover:bg-slate-100 dark:hover:bg-[#353535] rounded-full transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-[#e3e3e3]">
                        {isLogin ? t('user.login', lang)
                            : isForgot ? t('user.recover_password', lang)
                            : t('user.create_account', lang)}
                    </h2>
                    {isForgot && (
                        <p className="text-sm text-slate-500 dark:text-[#9e9e9e] mt-2 px-4">
                            {t('user.enter_email_recover', lang)}
                        </p>
                    )}
                </div>

                {isLogin && (
                    <LoginForm onSuccess={onLoginSuccess} onSwitchType={onSwitchType} lang={lang} />
                )}
                {isRegister && (
                    <RegisterForm onSuccess={onLoginSuccess} onSwitchType={onSwitchType} lang={lang} />
                )}
                {isForgot && (
                    <ForgotForm onSwitchType={onSwitchType} lang={lang} />
                )}
            </div>
        </div>
    );
}

// ─── LoginForm ──────────────────────────────────────────────────────────────
function LoginForm({ onSuccess, onSwitchType, lang }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pendingEmail, setPendingEmail] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(email, password);
            onSuccess?.(data.user);
        } catch (err) {
            if (err.message === 'email_not_verified') {
                setPendingEmail(email);
            } else {
                setError(err.message || t('user.login_failed', lang));
            }
        } finally {
            setLoading(false);
        }
    };

    if (pendingEmail) {
        return (
            <VerifyPendingPanel
                email={pendingEmail}
                onClose={() => setPendingEmail(null)}
                onSwitchType={onSwitchType}
                showBackToLogin
                lang={lang}
            />
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-[#e3e3e3] mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="name@example.com"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-[#484848] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-[#1f1f1f] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-[#757575]" />
            </div>
            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-[#e3e3e3]">{t('user.password', lang)}</label>
                    <span onClick={() => onSwitchType('forgot')} className="text-xs text-blue-600 hover:underline cursor-pointer font-medium">
                        {t('user.forgot_password', lang)}
                    </span>
                </div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-[#484848] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-[#1f1f1f] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-[#757575]" />
            </div>
            <button type="submit" disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? t('user.logging_in', lang) : t('user.login', lang)}
            </button>
            <div className="mt-4 text-center text-sm text-slate-600 dark:text-[#bdbdbd]">
                {t('user.no_account', lang)}{' '}
                <span onClick={() => onSwitchType('register')} className="text-blue-600 font-medium hover:underline cursor-pointer">
                    {t('user.register_now', lang)}
                </span>
            </div>
        </form>
    );
}

// ─── RegisterForm ────────────────────────────────────────────────────────────
function RegisterForm({ onSuccess, onSwitchType, lang }) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pendingEmail, setPendingEmail] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await register(fullName, email, password);
            if (data.status === 'pending_verification') {
                setPendingEmail(data.email || email);
            } else if (data.token) {
                onSuccess?.(data.user);
            }
        } catch (err) {
            setError(err.message || t('user.register_failed', lang));
        } finally {
            setLoading(false);
        }
    };

    if (pendingEmail) {
        return (
            <VerifyPendingPanel
                email={pendingEmail}
                onClose={() => onSwitchType('login')}
                onSwitchType={onSwitchType}
                isAfterRegister
                lang={lang}
            />
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-[#e3e3e3] mb-1">{t('user.full_name', lang)}</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder={t('user.enter_name', lang)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-[#484848] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-[#1f1f1f] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-[#757575]" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-[#e3e3e3] mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="name@example.com"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-[#484848] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-[#1f1f1f] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-[#757575]" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-[#e3e3e3] mb-1">{t('user.password', lang)}</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder={t('user.min_length_pass', lang)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-[#484848] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-[#1f1f1f] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-[#757575]" />
            </div>
            <button type="submit" disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? t('user.registering', lang) : t('user.register', lang)}
            </button>
            <div className="mt-4 text-center text-sm text-slate-600 dark:text-[#bdbdbd]">
                {t('user.has_account', lang)}{' '}
                <span onClick={() => onSwitchType('login')} className="text-blue-600 font-medium hover:underline cursor-pointer">
                    {t('user.login', lang)}
                </span>
            </div>
        </form>
    );
}

// ─── VerifyPendingPanel ──────────────────────────────────────────────────────
function VerifyPendingPanel({ email, onClose, onSwitchType, isAfterRegister = false, showBackToLogin = false, lang = "vi" }) {
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMsg, setResendMsg] = useState('');
    const [resendError, setResendError] = useState('');
    const [resendCount, setResendCount] = useState(0);

    const handleResend = async () => {
        if (!email) return;
        setResendLoading(true);
        setResendMsg('');
        setResendError('');
        try {
            await resendVerification(email);
            setResendCount(c => c + 1);
            setResendMsg(lang === 'en' ? 'Confirmation email resent! Please check your inbox (including Spam).' : 'Email xác nhận đã được gửi lại! Vui lòng kiểm tra hộp thư (bao gồm cả Spam).');
        } catch (err) {
            setResendError(err.message || (lang === 'en' ? 'Failed to send. Please try again later.' : 'Gửi thất bại. Vui lòng thử lại sau.'));
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="text-center space-y-5">
            <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center">
                    <Mail className="w-9 h-9 text-blue-500" />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-[#f5f5f5] mb-1">
                    {isAfterRegister
                        ? (lang === 'en' ? 'Check your inbox!' : 'Kiểm tra hộp thư của bạn!')
                        : (lang === 'en' ? 'Account not verified' : 'Tài khoản chưa được xác thực')}
                </h3>
                <p className="text-sm text-slate-500 dark:text-[#9e9e9e] leading-relaxed px-2">
                    {isAfterRegister
                        ? (lang === 'en' ? 'We sent a verification email to:' : 'Chúng tôi đã gửi email xác nhận đến:')
                        : (lang === 'en' ? 'This account email is not verified. Please check:' : 'Email của tài khoản này chưa được xác thực. Vui lòng kiểm tra:')}
                </p>
            </div>

            {email && (
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold px-4 py-2 rounded-full">
                    <Mail className="w-4 h-4" />
                    {email}
                </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700 text-left">
                <strong>⚠ {lang === 'en' ? 'Note:' : 'Lưu ý:'}</strong> {lang === 'en' ? 'The link is valid for 5 minutes.' : 'Link xác nhận chỉ có hiệu lực trong 5 phút.'}
            </div>

            {resendMsg && (
                <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700 text-left">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{resendMsg}</span>
                </div>
            )}
            {resendError && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{resendError}</p>
            )}

            <button
                onClick={handleResend}
                disabled={resendLoading}
                className="w-full py-2.5 px-4 border-2 border-blue-500 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
                {resendLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <RefreshCw className="w-4 h-4" />
                }
                {resendLoading ? (lang === 'en' ? 'Sending...' : 'Đang gửi...') : resendCount > 0 ? (lang === 'en' ? 'Resend again' : 'Gửi lại lần nữa') : (lang === 'en' ? 'Resend verification email' : 'Gửi lại email xác nhận')}
            </button>

            <button
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-[#353535] hover:bg-slate-200 dark:hover:bg-[#484848] text-slate-600 dark:text-[#bdbdbd] font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                <LogOut className="w-4 h-4" />
                {showBackToLogin ? t('user.back_to_login', lang) : (lang === 'en' ? 'Close' : 'Đóng')}
            </button>

            <p className="text-xs text-slate-400 dark:text-[#9e9e9e]">
                {lang === 'en' ? 'Already verified?' : 'Đã xác nhận email?'}{' '}
                <span
                    onClick={() => onSwitchType?.('login')}
                    className="text-blue-500 hover:underline cursor-pointer font-medium"
                >
                    {t('user.login', lang)}
                </span>
            </p>
        </div>
    );
}

// ─── ForgotForm ──────────────────────────────────────────────────────────────
function ForgotForm({ onSwitchType, lang }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;
        
        setLoading(true);
        setError('');
        setMessage('');
        
        try {
            const data = await forgotPassword(email);
            setMessage(data.status);
        } catch (err) {
            setError(err.message || (lang === 'en' ? 'Failed to send request' : 'Gửi yêu cầu thất bại'));
        } finally {
            setLoading(false);
        }
    };

    if (message) {
        return (
            <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <p className="text-slate-600 dark:text-[#bdbdbd] font-medium px-2">{message}</p>
                <button onClick={() => onSwitchType('login')}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                    {t('user.back_to_login', lang)}
                </button>
            </div>
        );
    }

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-[#e3e3e3] mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="name@example.com"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-[#484848] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-[#1f1f1f] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-[#757575]" />
            </div>
            <button type="submit" disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? t('user.sending', lang) : t('user.send_request', lang)}
            </button>
            <div className="mt-4 text-center text-sm">
                <span onClick={() => onSwitchType('login')} className="text-blue-600 font-medium hover:underline cursor-pointer">
                    {t('user.back_to_login', lang)}
                </span>
            </div>
        </form>
    );
}