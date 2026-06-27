"use client";
import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { resetPassword } from '@/lib/api';
import { Lock, CheckCircle2, AlertCircle, Loader2, Calendar, Eye, EyeOff } from 'lucide-react';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');

    const [validating, setValidating] = useState(true);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [validationError, setValidationError] = useState('');

    React.useEffect(() => {
        if (!uid || !token) {
            setValidationError('Liên kết khôi phục mật khẩu không hợp lệ hoặc bị thiếu tham số.');
            setValidating(false);
            return;
        }

        import('@/lib/api').then(({ validateResetToken }) => {
            validateResetToken(uid, token)
                .then(res => {
                    if (!res.valid) {
                        setValidationError(res.error || 'Liên kết này đã hết hạn hoặc không hợp lệ.');
                    }
                })
                .catch(err => {
                    setValidationError(err.message || 'Lỗi kết nối máy chủ. Vui lòng thử lại.');
                })
                .finally(() => {
                    setValidating(false);
                });
        });
    }, [uid, token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!uid || !token) {
            setError('Liên kết khôi phục không hợp lệ hoặc thiếu tham số.');
            return;
        }

        if (password.length < 6) {
            setError('Mật khẩu phải có độ dài tối thiểu 6 ký tự.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(uid, token, password);
            setSuccess(true);
            setTimeout(() => {
                router.push('/');
            }, 3000);
        } catch (err) {
            setError(err.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    if (validating) {
        return (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="text-sm text-slate-500 dark:text-[#9e9e9e] font-medium animate-pulse">Đang xác thực liên kết...</span>
            </div>
        );
    }

    if (validationError) {
        return (
            <div className="text-center py-6 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <AlertCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-[#f5f5f5] mb-2">Liên kết không hợp lệ</h2>
                <p className="text-slate-500 dark:text-[#9e9e9e] text-sm mb-6 max-w-xs mx-auto font-medium">{validationError}</p>
                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95"
                >
                    Quay lại trang chủ
                </button>
            </div>
        );
    }

    if (success) {
        return (
            <div className="text-center py-6 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-[#f5f5f5] mb-2">Đổi mật khẩu thành công!</h2>
                <p className="text-slate-500 dark:text-[#9e9e9e] text-sm mb-6 font-medium">Mật khẩu đã được thay đổi. Đang chuyển hướng về trang chủ...</p>
                <div className="w-full bg-slate-100 dark:bg-[#353535] h-1 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full animate-progress"></div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom duration-300">
            {error && (
                <div className="text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-3 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-[#e3e3e3] mb-1.5">Mật khẩu mới</label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#484848] rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-[#f5f5f5] placeholder-slate-400 outline-none transition"
                    />
                    <Lock className="w-5 h-5 text-slate-500 dark:text-[#9e9e9e] absolute left-3 top-3.5" />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-slate-500 dark:text-[#9e9e9e] hover:text-slate-700 dark:hover:text-[#e3e3e3] dark:text-[#e3e3e3]"
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-[#e3e3e3] mb-1.5">Xác nhận mật khẩu mới</label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#484848] rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-[#f5f5f5] placeholder-slate-400 outline-none transition"
                    />
                    <Lock className="w-5 h-5 text-slate-500 dark:text-[#9e9e9e] absolute left-3 top-3.5" />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none mt-4"
            >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#1f1f1f] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-indigo-50 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative w-full max-w-md bg-white dark:bg-[#2d2d2d]/80 backdrop-blur-md rounded-3xl border border-white/60 shadow-2xl p-8 md:p-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30 mb-4">
                        <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-[#f5f5f5] dark:to-[#f5f5f5]">Lịch Cá Nhân</h1>
                    <p className="text-sm text-slate-500 dark:text-[#9e9e9e] mt-2 font-medium">Đặt lại mật khẩu cho tài khoản của bạn</p>
                </div>

                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="text-sm text-slate-500 dark:text-[#9e9e9e] font-medium">Đang tải biểu mẫu...</span>
                    </div>
                }>
                    <ResetPasswordForm />
                </Suspense>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes progress {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
                .animate-progress {
                    animation: progress 3s linear forwards;
                }
            ` }} />
        </div>
    );
}
