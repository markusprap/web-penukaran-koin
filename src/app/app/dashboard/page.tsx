'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useMasterDataStore } from '@/store/useMasterDataStore';
import { useRouter } from 'next/navigation';
import {
    PlusCircle,
    History,
    FileText,
    Coins,
    User,
    Settings,
    LogOut,
    ChevronRight,
    Wallet,
    Home,
    MapPin,
    Smartphone,
    Shield,
    Sun,
    Moon,
    PackageCheck,
    AlertTriangle,
    Loader2,
    Lock,
    Eye,
    EyeOff,
    Save
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useTheme } from '@/components/ThemeProvider';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type DashTab = 'home' | 'profile';

export default function FieldDashboard() {
    const { user, vehicle, selectedPosition, logout } = useAuthStore();
    const { history, startNewTransaction, fetchHistory } = useTransactionStore();
    const fetchMasterData = useMasterDataStore((state) => state.fetchMasterData);
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const { notify, showAlert } = useNotificationStore();
    const [activeTab, setActiveTab] = useState<DashTab>('home');
    const [showStockDetail, setShowStockDetail] = useState(false);
    const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);

    // Assignment store for real stock data
    const { assignments, fetchAssignments, getActiveAssignmentByUser, completeAssignment } = useAssignmentStore();

    useEffect(() => {
        if (!user || !vehicle) {
            router.push('/app/login');
        } else {
            // Sync Master Data and Assignments for Field App
            fetchMasterData();
            fetchAssignments();
            fetchHistory();
        }
    }, [user, vehicle, router, fetchMasterData, fetchAssignments, fetchHistory]);

    const handleStartExchange = () => {
        startNewTransaction(activeAssignment?.initialStock);
        router.push('/app/input-penukaran');
    };

    // Get REAL stock data from the active assignment (synced from Admin)
    const activeAssignment = user ? getActiveAssignmentByUser(user.nik) : undefined;
    const assignmentInitialStock = activeAssignment?.initialStock || {};

    // Calculate used coins per denomination from history
    const usedDenomStock: Record<number, number> = {};
    history.forEach(tx => {
        tx.coins.forEach(coin => {
            if (coin.qty > 0) {
                usedDenomStock[coin.denom] = (usedDenomStock[coin.denom] || 0) + coin.qty;
            }
        });
    });

    // Calculate current stock per denomination from REAL assignment data
    const currentDenomStock = Object.entries(assignmentInitialStock).map(([denom, initialQty]) => {
        const denomNum = parseInt(denom);
        const qty = initialQty as number;
        const usedQty = usedDenomStock[denomNum] || 0;
        const currentQty = Math.max(0, qty - usedQty);
        return {
            denom: denomNum,
            currentQty,
            stockValue: currentQty * denomNum
        };
    });

    // Calculate totals from per-denomination data
    const currentCoinStock = currentDenomStock.reduce((acc, d) => acc + d.stockValue, 0);
    const currentCashCollected = history.reduce((acc, tx) => acc + tx.totalBigMoney, 0);

    // Calculate collected big money from history
    const collectedBigMoney: Record<number, number> = {};
    history.forEach(tx => {
        (tx.bigMoney || []).forEach(bm => {
            if (bm.qty > 0) {
                collectedBigMoney[bm.denom] = (collectedBigMoney[bm.denom] || 0) + bm.qty;
            }
        });
    });

    // Build remaining stock as a Record for the API
    const remainingStockRecord: Record<number, number> = {};
    currentDenomStock.forEach(d => {
        remainingStockRecord[d.denom] = d.currentQty;
    });

    // Add collected big money to return to office
    Object.entries(collectedBigMoney).forEach(([denom, qty]) => {
        const dNum = parseInt(denom);
        remainingStockRecord[dNum] = (remainingStockRecord[dNum] || 0) + qty;
    });

    const handleCompleteAssignment = async () => {
        if (!activeAssignment) return;
        setIsCompleting(true);
        try {
            // 1. Complete the assignment on backend (auto-returns stock to warehouse)
            await completeAssignment(activeAssignment.id, remainingStockRecord);

            notify('Tugas selesai! Stok sisa telah dikembalikan ke gudang.', 'success');
            setShowCompleteConfirm(false);

            // 2. Clear session and redirect
            logout();
            router.push('/');
        } catch (error) {
            notify('Gagal menyelesaikan tugas. Coba lagi.', 'error');
        } finally {
            setIsCompleting(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordForm.newPass !== passwordForm.confirm) {
            notify('Password baru tidak cocok!', 'error');
            return;
        }
        if (passwordForm.newPass.length < 4) {
            notify('Password minimal 4 karakter!', 'error');
            return;
        }
        try {
            const { apiFetch } = await import('@/lib/api');
            await apiFetch(`/users/${user?.nik}`, {
                method: 'PUT',
                body: JSON.stringify({ password: passwordForm.newPass })
            });
            notify('Password berhasil diubah!', 'success');
            setShowChangePassword(false);
            setPasswordForm({ current: '', newPass: '', confirm: '' });
        } catch {
            notify('Gagal mengubah password.', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 pb-24 transition-colors">
            {activeTab === 'home' ? (
                <div className="animate-in fade-in duration-500">
                    {/* Header Home - Clean without settings/logout */}
                    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800">
                        <div className="max-w-xl mx-auto flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-black text-[var(--indomaret-blue)] uppercase tracking-[0.2em] mb-0.5">Operasional</p>
                                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Selamat Bekerja, {user?.full_name.split(' ')[0]}!</h1>
                            </div>
                            <div className="w-10 h-10 bg-[var(--indomaret-blue)] rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20">
                                {user?.full_name.charAt(0)}
                            </div>
                        </div>
                    </header>

                    <main className="max-w-xl mx-auto p-5 space-y-8">
                        {/* Session Status Card */}
                        <div className="bg-gradient-to-br from-[var(--indomaret-blue)] to-blue-700 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-500/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                <MapPin size={100} />
                            </div>
                            <div className="relative z-10 flex justify-between items-end">
                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-black uppercase tracking-wider">Sesi Aktif</span>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black tracking-tighter">{vehicle}</p>
                                        <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-1 opacity-80">{selectedPosition} • Armada Penukaran</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black opacity-60 uppercase mb-1">Update Terakhir</p>
                                    <p className="text-xs font-bold">{format(new Date(), 'HH:mm', { locale: id })} WIB</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={handleStartExchange}
                                className="flex items-center gap-5 p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
                            >
                                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-[var(--indomaret-blue)] rounded-2xl flex items-center justify-center group-hover:bg-[var(--indomaret-blue)] group-hover:text-white transition-all duration-300">
                                    <PlusCircle size={32} />
                                </div>
                                <div className="text-left flex-1">
                                    <span className="block font-black text-lg text-slate-900 dark:text-white leading-tight">Input Penukaran</span>
                                    <span className="block text-xs text-slate-500 mt-1">Mulai input data koin dari toko</span>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-[var(--indomaret-blue)] transition-colors" size={20} />
                            </button>
                            <button
                                onClick={() => router.push('/app/history')}
                                className="flex items-center gap-5 p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
                            >
                                <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <History size={32} />
                                </div>
                                <div className="text-left flex-1">
                                    <span className="block font-black text-lg text-slate-900 dark:text-white leading-tight">History Penukaran</span>
                                    <span className="block text-xs text-slate-500 mt-1">Lihat riwayat penukaran koin</span>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-purple-600 transition-colors" size={20} />
                            </button>
                        </div>

                        {/* Stock Summaries Card */}
                        <div className="bg-slate-900 dark:bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute -bottom-8 -right-8 p-8 opacity-[0.03]">
                                <Wallet size={180} />
                            </div>
                            <div className="flex justify-between items-center mb-8 relative z-10">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">Inventory Status</h3>
                                <Coins size={20} className="text-blue-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-8 relative z-10 border-b border-white/5 pb-8 mb-8">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stok Koin</p>
                                    <p className="text-2xl font-black tracking-tight">Rp {currentCoinStock.toLocaleString()}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Uang Besar</p>
                                    <p className="text-2xl font-black tracking-tight text-green-400">Rp {currentCashCollected.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <button
                                    onClick={() => setShowStockDetail(true)}
                                    className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors border border-white/5"
                                >
                                    Lihat Detail Stok
                                </button>
                            </div>
                        </div>
                    </main>

                    {/* Stock Detail Modal */}
                    {/* Stock Detail Modal */}
                    {showStockDetail && (
                        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
                            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 space-y-8 animate-in slide-in-from-bottom-10 duration-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Detail Stok Koin</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status Inventaris Saat Ini</p>
                                    </div>
                                    <button
                                        onClick={() => setShowStockDetail(false)}
                                        className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                                    {currentDenomStock.map((d) => (
                                        <div key={d.denom} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 italic">Pecahan {d.denom.toLocaleString()}</span>
                                            <div className="text-right">
                                                <span className="font-black">Rp {d.stockValue.toLocaleString()}</span>
                                                <p className="text-[10px] text-slate-400">{d.currentQty.toLocaleString()} keping</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Stok</span>
                                    <span className="text-2xl font-black text-[var(--indomaret-blue)] tracking-tight">Rp {currentCoinStock.toLocaleString()}</span>
                                </div>

                                <button
                                    onClick={() => setShowStockDetail(false)}
                                    className="w-full py-5 bg-[var(--indomaret-blue)] text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    )}

                </div>

            ) : (
                <div className="animate-in fade-in duration-500">
                    {/* Header Profile */}
                    <header className="p-8 pb-4">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Profil Petugas</h2>
                    </header>

                    <main className="max-w-xl mx-auto p-6 space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                            <div className="w-24 h-24 bg-[var(--indomaret-blue)] rounded-3xl flex items-center justify-center text-white text-4xl font-black mx-auto mb-6 shadow-xl shadow-blue-500/20">
                                {user?.full_name.charAt(0)}
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{user?.full_name}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">NIK: {user?.nik} • {selectedPosition}</p>

                            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                    <p className="text-xs font-black text-green-600 uppercase">On-Duty</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Armada</p>
                                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase truncate">{vehicle}</p>
                                </div>
                            </div>
                        </div>

                        {/* Settings Section */}
                        <div className="space-y-3">
                            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pengaturan Aplikasi</p>
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                <button
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    className="w-full h-16 px-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-amber-500 transition-colors">
                                            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                                        </div>
                                        <div className="text-left">
                                            <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">Mode Tampilan</span>
                                            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">{theme === 'dark' ? 'Gelap' : 'Terang'}</span>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "w-12 h-6 rounded-full relative transition-all duration-300",
                                        theme === 'dark' ? "bg-blue-600" : "bg-slate-200"
                                    )}>
                                        <div className={cn(
                                            "w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm",
                                            theme === 'dark' ? "left-7" : "left-1"
                                        )}></div>
                                    </div>
                                </button>
                                <div className="h-px bg-slate-50 dark:bg-slate-800 mx-6"></div>
                                <div
                                    className="w-full h-16 px-6 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                                            <Smartphone size={20} />
                                        </div>
                                        <div className="text-left">
                                            <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">Perangkat</span>
                                            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">{typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop') : '-'}</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-lg uppercase tracking-wider">Online</span>
                                </div>
                                <div className="h-px bg-slate-50 dark:bg-slate-800 mx-6"></div>
                                <button
                                    onClick={() => setShowChangePassword(true)}
                                    className="w-full h-16 px-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-blue-500 transition-colors">
                                            <Lock size={20} />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Ganti Password</span>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-300" />
                                </button>
                            </div>
                        </div>

                        {/* Selesai Tugas Button - In Profile Tab to prevent accidental clicks */}
                        {activeAssignment && (
                            <div className="space-y-3">
                                <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tugas Aktif</p>
                                <button
                                    onClick={() => setShowCompleteConfirm(true)}
                                    className="w-full flex items-center gap-4 p-5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl shadow-lg shadow-orange-500/20 hover:shadow-xl transition-all group text-white"
                                >
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                        <PackageCheck size={24} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <span className="block font-black text-sm leading-tight">Selesai Tugas</span>
                                        <span className="block text-[10px] text-amber-100 mt-0.5">Kembalikan sisa stok ke gudang</span>
                                    </div>
                                    <ChevronRight size={18} className="text-white/60 group-hover:text-white transition-colors" />
                                </button>
                            </div>
                        )}

                        {/* Logout Button */}
                        <button
                            onClick={() => { logout(); router.push('/'); }}
                            className="w-full py-5 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-3xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-red-200 transition-all border border-red-200/50"
                        >
                            <LogOut size={18} />
                            <span>Keluar dari Sesi</span>
                        </button>

                        <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest mt-4 pb-8">
                            CoinExchange v1.1.0
                        </p>

                        {/* Change Password Modal */}
                        {showChangePassword && (
                            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
                                <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 space-y-6 animate-in slide-in-from-bottom-10 duration-500">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-[var(--indomaret-blue)]">
                                                <Lock size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Ganti Password</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Keamanan Akun</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setShowChangePassword(false); setPasswordForm({ current: '', newPass: '', confirm: '' }); }}
                                            className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Baru</label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPass ? 'text' : 'password'}
                                                    value={passwordForm.newPass}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                                                    placeholder="Masukkan password baru"
                                                    className="w-full py-4 px-5 pr-12 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-[var(--indomaret-blue)] outline-none transition-all text-sm font-bold"
                                                />
                                                <button onClick={() => setShowNewPass(!showNewPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                    {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Konfirmasi Password</label>
                                            <input
                                                type="password"
                                                value={passwordForm.confirm}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                                                placeholder="Ulangi password baru"
                                                className="w-full py-4 px-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-[var(--indomaret-blue)] outline-none transition-all text-sm font-bold"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleChangePassword}
                                        disabled={!passwordForm.newPass || !passwordForm.confirm}
                                        className="w-full py-5 bg-[var(--indomaret-blue)] text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <Save size={16} />
                                        Simpan Password
                                    </button>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            )}

            {/* Complete Assignment Confirmation Modal */}
            {showCompleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 space-y-6 animate-in slide-in-from-bottom-10 duration-500 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-start shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Konfirmasi Selesai</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Kembali Ke Kantor</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCompleteConfirm(false)}
                                className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20 shrink-0">
                            <p className="text-xs text-amber-800 dark:text-amber-400 font-bold leading-relaxed">
                                Apakah Anda yakin ingin menyelesaikan tugas hari ini? Seluruh sisa stok berikut akan dikembalikan ke gudang secara otomatis.
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                            {/* Coins Section */}
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sisa Stok Koin</p>
                                <div className="space-y-1">
                                    {currentDenomStock.filter(d => d.currentQty > 0).map(d => (
                                        <div key={d.denom} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Pecahan Rp {d.denom.toLocaleString()}</span>
                                            <span className="text-sm font-black text-slate-900 dark:text-white">Rp {(d.currentQty * d.denom).toLocaleString()}</span>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{d.currentQty.toLocaleString()} {d.denom >= 2000 ? 'lembar' : 'keping'}</p>
                                        </div>
                                    ))}
                                    {currentCoinStock === 0 && <p className="text-xs text-slate-400 italic ml-1">Tidak ada koin tersisa.</p>}
                                </div>
                            </div>

                            {/* Big Money Section */}
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-green-500 uppercase tracking-widest ml-1">Uang Besar Diterima</p>
                                <div className="space-y-1">
                                    {Object.entries(collectedBigMoney).map(([denom, qty]) => (
                                        <div key={denom} className="flex justify-between items-center p-3 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100/50 dark:border-green-900/20">
                                            <span className="text-xs font-bold text-green-700 dark:text-green-400">Pecahan Rp {parseInt(denom).toLocaleString()}</span>
                                            <span className="text-sm font-black text-green-700 dark:text-green-400">Rp {(qty * parseInt(denom)).toLocaleString()}</span>
                                            <p className="text-[10px] text-green-600/60 mt-0.5">{qty.toLocaleString()} lembar</p>
                                        </div>
                                    ))}
                                    {currentCashCollected === 0 && <p className="text-xs text-slate-400 italic ml-1">Tidak ada uang besar dikumpulkan.</p>}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 shrink-0">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Nilai Balikan</span>
                                <span className="text-xl font-black text-[var(--indomaret-blue)] tracking-tight">Rp {(currentCoinStock + currentCashCollected).toLocaleString()}</span>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => setShowCompleteConfirm(false)}
                                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleCompleteAssignment}
                                    disabled={isCompleting}
                                    className="flex-[2] py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isCompleting ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <PackageCheck size={16} />
                                    )}
                                    Ya, Selesai Tugas
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Bottom Nav Bar */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-10 py-5 flex justify-around items-center z-40 shadow-2xl safe-area-bottom">
                <button
                    onClick={() => setActiveTab('home')}
                    className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'home' ? 'text-[var(--indomaret-blue)] scale-110' : 'text-slate-300'}`}
                >
                    <Home size={24} className={activeTab === 'home' ? 'fill-[var(--indomaret-blue)]' : ''} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'home' ? 'opacity-100' : 'opacity-0'}`}>Beranda</span>
                </button>
                <div className="w-px h-6 bg-slate-100 dark:bg-slate-800"></div>
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'profile' ? 'text-[var(--indomaret-blue)] scale-110' : 'text-slate-300'}`}
                >
                    <User size={24} className={activeTab === 'profile' ? 'fill-[var(--indomaret-blue)]' : ''} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'profile' ? 'opacity-100' : 'opacity-0'}`}>Profil</span>
                </button>
            </nav>
        </div>
    );
}
