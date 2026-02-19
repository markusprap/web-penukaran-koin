'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useMasterDataStore } from '@/store/useMasterDataStore';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function AdminLoginPage() {
    const [nik, setNik] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'info' | 'warning';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        setAlertConfig({ isOpen: true, title, message, type });
    };

    const login = useAuthStore((state) => state.login);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const user = await apiFetch('/users/login', {
                method: 'POST',
                body: JSON.stringify({ nik, password }),
            });

            const userRole = (user.role || '').toUpperCase();
            const isAdminRole = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
            if (!isAdminRole) {
                setError('Akses ditolak. Akun ini bukan akun Administrator.');
                setIsLoading(false);
                return;
            }

            login(user.nik, user.full_name, user.role.toLowerCase(), user.position.toLowerCase(), user.token);
            router.push('/admin'); // Redirect to main admin page
        } catch (err: any) {
            setError(err.message || 'NIK atau Password salah.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-200/50 dark:bg-blue-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-red-200/50 dark:bg-red-600/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="max-w-md w-full bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-8 relative z-10 rounded-3xl shadow-2xl border-t-4 border-t-[var(--indomaret-blue)]">
                <div className="text-center space-y-2 mb-8">
                    <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-2 shadow-inner border border-slate-200 dark:border-slate-700">
                        <Shield className="text-[var(--indomaret-blue)]" size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Admin Portal</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Masuk untuk mengelola sistem finance.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">NIK Administrator</label>
                            <input
                                type="text"
                                value={nik}
                                onChange={(e) => setNik(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold"
                                placeholder="Masukkan NIK Admin"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-200 text-sm animate-in slide-in-from-top-2">
                            <AlertCircle size={18} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 group hover:scale-[1.02] transition-all"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <span>Masuk Dashboard</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>

                    <div className="text-center space-y-4">
                        <button
                            type="button"
                            onClick={() => router.push('/')}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors text-sm font-bold"
                        >
                            Kembali ke Halaman Utama
                        </button>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Masalah Login?</p>
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        await apiFetch('/users/setup', { method: 'POST' });
                                        useMasterDataStore.getState().resetToDefault();
                                        showAlert('Data Disinkron', 'Database pusat telah dikoneksikan. Silakan coba login kembali.', 'success');
                                    } catch (err: any) {
                                        showAlert('Gagal Sinkron', 'Tidak dapat terhubung ke server. Pastikan backend aktif.', 'error');
                                    }
                                }}
                                className="text-[10px] font-black text-[var(--indomaret-blue)] hover:underline uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full transition-all"
                            >
                                Sinkronisasi Data Baru
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* TROUBLESHOOTING ALERT */}
            {alertConfig.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center border border-slate-200 dark:border-slate-800">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${alertConfig.type === 'success' ? 'bg-green-50 text-green-500' :
                            alertConfig.type === 'error' ? 'bg-red-50 text-red-500' :
                                'bg-blue-50 text-blue-500'
                            }`}>
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight italic">{alertConfig.title}</h3>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                            {alertConfig.message}
                        </p>
                        <button
                            onClick={() => {
                                setAlertConfig(prev => ({ ...prev, isOpen: false }));
                                // After sync, we might want to reload the page to be absolutely sure the store persists
                                if (alertConfig.title === 'Data Disinkron') {
                                    window.location.reload();
                                }
                            }}
                            className="w-full py-3 bg-[var(--indomaret-blue)] text-white font-black rounded-xl hover:brightness-110 transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest text-xs"
                        >
                            Oke, Mengerti
                        </button>
                    </div>
                </div>
            )}

            <div className="absolute bottom-6 text-center w-full z-10">
                <p className="text-xs text-slate-400 dark:text-slate-600">Terproteksi & Terenkripsi • Internal Use Only</p>
            </div>
        </div>
    );
}
