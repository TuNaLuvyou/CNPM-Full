"use client";
import React from 'react';
import { X } from 'lucide-react';

export default function AuthModal({ isOpen, type, onClose, onSwitchType }) {
    if (!isOpen) return null;

    const isLogin = type === 'login';
    const isForgot = type === 'forgot';

    return (
        // Lớp nền tối, làm mờ (backdrop-blur)
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            {/* Modal Container */}
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
                {/* Nút đóng */}
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

                <form className="space-y-4">
                    {type === 'register' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                            <input
                                type="text"
                                placeholder="Nhập tên của bạn"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                    </div>
                    {!isForgot && (
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-slate-700">Mật khẩu</label>
                                {isLogin && (
                                    <span 
                                        onClick={() => onSwitchType('forgot')}
                                        className="text-xs text-blue-600 hover:underline cursor-pointer font-medium"
                                    >
                                        Quên mật khẩu?
                                    </span>
                                )}
                            </div>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            />
                        </div>
                    )}

                    <button
                        type="button"
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors mt-2"
                    >
                        {isLogin ? 'Đăng nhập' : isForgot ? 'Gửi yêu cầu' : 'Đăng ký'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-600">
                    {isLogin ? 'Chưa có tài khoản? ' : isForgot ? '' : 'Đã có tài khoản? '}
                    <span
                        onClick={() => onSwitchType(isLogin ? 'register' : 'login')}
                        className="text-blue-600 font-medium hover:underline cursor-pointer"
                    >
                        {isLogin ? 'Đăng ký ngay' : isForgot ? ' Quay lại đăng nhập' : 'Đăng nhập'}
                    </span>
                </div>
            </div>
        </div>
    );
}