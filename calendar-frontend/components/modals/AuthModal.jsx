"use client";
import React, { useState } from 'react';
import { X, Loader2, Mail, RefreshCw, LogOut, CheckCircle } from 'lucide-react';
import { login, register, forgotPassword, resendVerification } from '@/lib/api';

export default function AuthModal({ isOpen, type, onClose, onSwitchType, onLoginSuccess, canClose = true }) {
    if (!isOpen) return null;

    const isLogin = type === 'login';
    const isForgot = type === 'forgot';
    const isRegister = type === 'register';
    const isVerifyPending = type === 'verify_pending';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white dark:bg-[#2d2d2d] rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
                {canClose && !isVerifyPending && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 dark:text-[#9e9e9e] hover:text-slate-600 dark:hover:text-[#bdbdbd] dark:text-[#bdbdbd] hover:bg-slate-100 dark:hover:bg-[#353535] rounded-full transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-[#e3e3e3]">
                        {isLogin ? 'Đăng nhập'
                            : isForgot ? 'Khôi phục mật khẩu'
                            : isRegister ? 'Tạo tài khoản mới'
                            : 'Xác thực email'}
                    </h2>
                    {isForgot && (
                        <p className="text-sm text-slate-500 dark:text-[#9e9e9e] mt-2 px-4">
                            Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.
                        </p>
                    )}
                </div>

                {isLogin && (
                    <LoginForm onSuccess={onLoginSuccess} onSwitchType={onSwitchType} />
                )}
                {isRegister && (
                    <RegisterForm onSuccess={onLoginSuccess} onSwitchType={onSwitchType} />
                )}
                {isForgot && (
                    <ForgotForm onSwitchType={onSwitchType} />
                )}
                {isVerifyPending && (
                    <VerifyPendingPanel
                        email={type === 'verify_pending' ? undefined : undefined}
                        onClose={onClose}
                        onSwitchType={onSwitchType}
                    />
                )}
            </div>
        </div>
    );
}

// ─── LoginForm ──────────────────────────────────────────────────────────────
function LoginForm({ onSuccess, onSwitchType }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pendingEmail, setPendingEmail] = useState(null); // email chưa xác thực

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(email, password);
            onSuccess?.(data.user);
        } catch (err) {
            // Tài khoản tồn tại nhưng chưa xác thực email
            if (err.message === 'email_not_verified') {
                setPendingEmail(email);
            } else {
                setError(err.message || 'Đăng nhập thất bại');
            }
        } finally {
            setLoading(false);
        }
    };

    // Hiển thị panel yêu cầu xác thực khi phát hiện tài khoản chưa verify
    if (pendingEmail) {
        return (
            <VerifyPendingPanel
                email={pendingEmail}
                onClose={() => setPendingEmail(null)}
                onSwitchType={onSwitchType}
                showBackToLogin
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-[#e3e3e3]">Mật khẩu</label>
                    <span onClick={() => onSwitchType('forgot')} className="text-xs text-blue-600 hover:underline cursor-pointer font-medium">
                        Quên mật khẩu?
                    </span>
                </div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
            <button type="submit" disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
            <div className="mt-4 text-center text-sm text-slate-600 dark:text-[#bdbdbd]">
                Chưa có tài khoản?{' '}
                <span onClick={() => onSwitchType('register')} className="text-blue-600 font-medium hover:underline cursor-pointer">
                    Đăng ký ngay
                </span>
            </div>
        </form>
    );
}

// ─── RegisterForm ────────────────────────────────────────────────────────────
function RegisterForm({ onSuccess, onSwitchType }) {
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
            // Đăng ký thành công → chờ xác thực (status = 'pending_verification')
            if (data.status === 'pending_verification') {
                setPendingEmail(data.email || email);
            } else if (data.token) {
                // Trường hợp dự phòng (backward compat)
                onSuccess?.(data.user);
            }
        } catch (err) {
            setError(err.message || 'Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    };

    // Sau đăng ký thành công, chuyển sang panel chờ xác thực
    if (pendingEmail) {
        return (
            <VerifyPendingPanel
                email={pendingEmail}
                onClose={() => onSwitchType('login')}
                onSwitchType={onSwitchType}
                isAfterRegister
            />
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-[#e3e3e3] mb-1">Họ và tên</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Nhập tên của bạn"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-[#e3e3e3] mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="name@example.com"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-[#e3e3e3] mb-1">Mật khẩu</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
            <button type="submit" disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
            <div className="mt-4 text-center text-sm text-slate-600 dark:text-[#bdbdbd]">
                Đã có tài khoản?{' '}
                <span onClick={() => onSwitchType('login')} className="text-blue-600 font-medium hover:underline cursor-pointer">
                    Đăng nhập
                </span>
            </div>
        </form>
    );
}

// ─── VerifyPendingPanel ──────────────────────────────────────────────────────
/**
 * Panel yêu cầu xác thực email.
 * Hiển thị khi:
 *  - Vừa đăng ký xong (isAfterRegister=true)
 *  - Đăng nhập bằng tài khoản chưa xác thực (showBackToLogin=true)
 */
function VerifyPendingPanel({ email, onClose, onSwitchType, isAfterRegister = false, showBackToLogin = false }) {
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
            setResendMsg('Email xác nhận đã được gửi lại! Vui lòng kiểm tra hộp thư (bao gồm cả Spam).');
        } catch (err) {
            setResendError(err.message || 'Gửi thất bại. Vui lòng thử lại sau.');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="text-center space-y-5">
            {/* Icon envelope */}
            <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center">
                    <Mail className="w-9 h-9 text-blue-500" />
                </div>
            </div>

            {/* Title */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-[#f5f5f5] mb-1">
                    {isAfterRegister ? 'Kiểm tra hộp thư của bạn!' : 'Tài khoản chưa được xác thực'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-[#9e9e9e] leading-relaxed px-2">
                    {isAfterRegister
                        ? 'Chúng tôi đã gửi email xác nhận đến:'
                        : 'Email của tài khoản này chưa được xác thực. Vui lòng kiểm tra:'}
                </p>
            </div>

            {/* Email badge */}
            {email && (
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold px-4 py-2 rounded-full">
                    <Mail className="w-4 h-4" />
                    {email}
                </div>
            )}

            {/* Countdown notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700 text-left">
                <strong>⚠ Lưu ý:</strong> Link xác nhận chỉ có hiệu lực trong <strong>5 phút</strong>.
                Nếu hết hạn, tài khoản sẽ bị xóa và bạn cần đăng ký lại.
            </div>

            {/* Resend feedback */}
            {resendMsg && (
                <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700 text-left">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{resendMsg}</span>
                </div>
            )}
            {resendError && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{resendError}</p>
            )}

            {/* Resend button */}
            <button
                onClick={handleResend}
                disabled={resendLoading}
                className="w-full py-2.5 px-4 border-2 border-blue-500 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
                {resendLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <RefreshCw className="w-4 h-4" />
                }
                {resendLoading ? 'Đang gửi...' : resendCount > 0 ? 'Gửi lại lần nữa' : 'Gửi lại email xác nhận'}
            </button>

            {/* Close / Back button */}
            <button
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-[#353535] hover:bg-slate-200 dark:hover:bg-[#484848] text-slate-600 dark:text-[#bdbdbd] font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                <LogOut className="w-4 h-4" />
                {showBackToLogin ? 'Quay lại đăng nhập' : 'Đóng'}
            </button>

            <p className="text-xs text-slate-400 dark:text-[#9e9e9e]">
                Đã xác nhận email?{' '}
                <span
                    onClick={() => onSwitchType?.('login')}
                    className="text-blue-500 hover:underline cursor-pointer font-medium"
                >
                    Đăng nhập
                </span>
            </p>
        </div>
    );
}

// ─── ForgotForm ──────────────────────────────────────────────────────────────
function ForgotForm({ onSwitchType }) {
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
            setError(err.message || 'Gửi yêu cầu thất bại');
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
                    Quay lại đăng nhập
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
            <button type="submit" disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
            <div className="mt-4 text-center text-sm">
                <span onClick={() => onSwitchType('login')} className="text-blue-600 font-medium hover:underline cursor-pointer">
                    Quay lại đăng nhập
                </span>
            </div>
        </form>
    );
}