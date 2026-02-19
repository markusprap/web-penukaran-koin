'use client';

import { useState } from 'react';
import { useAuthStore, Position, UserRole } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function FieldLogin() {
    const [nik, setNik] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, hasValidSession } = useAuthStore();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const user = await apiFetch('/users/login', {
                method: 'POST',
                body: JSON.stringify({ nik, password }),
            });

            login(user.nik, user.full_name, user.role, user.position, user.token);

            if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
                router.push('/admin');
            } else if (hasValidSession()) {
                router.push('/app/dashboard');
            } else {
                router.push('/app/session-setup');
            }
        } catch (err: any) {
            setError(err.message || 'NIK atau Password salah.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
            <div className="max-w-md w-full glass-card p-8 shadow-2xl border-t-4 border-[var(--indomaret-blue)]">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4 text-[var(--indomaret-blue)]">
                        <LogIn size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Field App Login</h1>
                    <p className="text-slate-500 mt-2">Masukan NIK dan Password Anda</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">NIK Petugas</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={nik}
                                onChange={(e) => setNik(e.target.value)}
                                placeholder="Contoh: 12345"
                                className="input-field w-full pl-12"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="input-field w-full pl-12"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/30">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-4"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Masuk Sekarang</span>
                                <LogIn size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-400 font-medium">Lupa password? Hubungi Admin Finance kantor Pusat.</p>
                </div>
            </div>
        </div>
    );
}
