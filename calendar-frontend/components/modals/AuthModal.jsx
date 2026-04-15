"use client";
import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { login, register } from '@/lib/api';

export default function AuthModal({ isOpen, type, onClose, onSwitchType, onLoginSuccess }) {
    if (!isOpen) return null;

    const isLogin = type === 'login';
    const isForgot = type === 'forgot';
    const isRegister = type === 'register';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">
                        {isLogin ? 'Đăng nhập' : isForgot ? 'Khôi phục mật khẩu' : 'Tạo tài khoản mới'}
                    </h2>
                    {isForgot && (
                        <p className="text-sm text-slate-500 mt-2 px-4">
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
            </div>
        </div>
    );
}

function LoginForm({ onSuccess, onSwitchType }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(email, password);
            onSuccess?.(data.user);
        } catch (err) {
            setError(err.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="name@example.com"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-700">Mật khẩu</label>
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
            <div className="mt-4 text-center text-sm text-slate-600">
                Chưa có tài khoản?{' '}
                <span onClick={() => onSwitchType('register')} className="text-blue-600 font-medium hover:underline cursor-pointer">
                    Đăng ký ngay
                </span>
            </div>
        </form>
    );
}

function RegisterForm({ onSuccess, onSwitchType }) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await register(fullName, email, password);
            onSuccess?.(data.user);
        } catch (err) {
            setError(err.message || 'Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Nhập tên của bạn"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="name@example.com"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
            <button type="submit" disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
            <div className="mt-4 text-center text-sm text-slate-600">
                Đã có tài khoản?{' '}
                <span onClick={() => onSwitchType('login')} className="text-blue-600 font-medium hover:underline cursor-pointer">
                    Đăng nhập
                </span>
            </div>
        </form>
    );
}

function ForgotForm({ onSwitchType }) {
    const [email, setEmail] = useState('');
    return (
        <form className="space-y-4" onSubmit={e => e.preventDefault()}>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
            <button type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors mt-2">
                Gửi yêu cầu
            </button>
            <div className="mt-4 text-center text-sm">
                <span onClick={() => onSwitchType('login')} className="text-blue-600 font-medium hover:underline cursor-pointer">
                    Quay lại đăng nhập
                </span>
            </div>
        </form>
    );
}