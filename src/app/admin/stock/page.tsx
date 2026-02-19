'use client';

import { useMasterDataStore } from '@/store/useMasterDataStore';
import { apiFetch } from '@/lib/api';
import {
    Coins,
    ArrowUpRight,
    ArrowDownRight,
    TrendingDown,
    Info,
    RefreshCw,
    AlertTriangle,
    Edit,
    Save,
    X,
    Plus
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function AdminStock() {
    const { stockInventory, updateStock, saveStockToServer, fetchStock } = useMasterDataStore();
    const { notify } = useNotificationStore();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [allTransactions, setAllTransactions] = useState<any[]>([]);

    // Fetch latest stock and ALL transactions (both field + walk-in) on load
    useEffect(() => {
        fetchStock();
        apiFetch('/transactions').then(data => setAllTransactions(data || [])).catch(() => { });
    }, [fetchStock]);

    // Local state for editing
    const [editValues, setEditValues] = useState<Record<number, number>>({});

    // Calculate total coins used per denomination from all transactions
    const usedDenomStock = useMemo(() => {
        const used: Record<number, number> = {};
        allTransactions.forEach((tx: any) => {
            const coins = tx.details?.filter((d: any) => d.type === 'COIN') || [];
            coins.forEach((coin: any) => {
                if (coin.qty > 0) {
                    used[coin.denom] = (used[coin.denom] || 0) + coin.qty;
                }
            });
        });
        return used;
    }, [allTransactions]);

    // Available Denoms
    const denomsList = [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

    // Calculate Grid Data
    const stockData = useMemo(() => {
        return denomsList.map(denom => {
            const currentQty = stockInventory[denom] || 0;
            const stockValue = currentQty * denom;

            // Status Logic
            let status = 'Normal';
            // We use a fixed threshold or just check if it's 0 for status
            if (currentQty === 0) status = 'Empty';
            else if (currentQty < 100) status = 'Low'; // Simple threshold

            return {
                label: `Pecahan ${denom.toLocaleString()}`,
                denom,
                initialQty: currentQty, // In this view, initial is just the current DB state
                currentQty,
                usedQty: usedDenomStock[denom] || 0, // Keep for info but don't subtract
                stockValue,
                status
            };
        });
    }, [stockInventory, usedDenomStock]);

    // Grand Totals
    const currentStockValue = stockData.reduce((acc, d) => acc + d.stockValue, 0);
    const totalOutValue = allTransactions.reduce((acc, tx: any) => acc + (tx.totalCoin || 0), 0);
    const totalInValue = allTransactions.reduce((acc, tx: any) => acc + (tx.totalBigMoney || 0), 0);

    const handleOpenEdit = () => {
        // Initialize with NOMINAL VALUES (Rupiah), not Quantity
        const nominalValues: Record<number, number> = {};
        Object.entries(stockInventory).forEach(([denom, qty]) => {
            nominalValues[parseInt(denom)] = qty * parseInt(denom);
        });
        setEditValues(nominalValues);
        setIsEditModalOpen(true);
    };

    const handleSaveStock = async () => {
        setIsSaving(true);
        try {
            // Build the stock object with quantities
            const stockToSave: Record<number, number> = {};
            Object.entries(editValues).forEach(([denomStr, nominal]) => {
                const denom = parseInt(denomStr);
                const qty = Math.floor(nominal / denom);
                stockToSave[denom] = qty;
            });

            await saveStockToServer(stockToSave);
            setIsEditModalOpen(false);
            notify('Stok berhasil diperbarui!', 'success');
        } catch (err) {
            notify('Gagal menyimpan stok ke server', 'error');
        } finally {
            setIsSaving(false);
        }
    };



    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Manajemen Stok Koin</h1>
                    <p className="text-slate-500 text-sm">Monitor persediaan koin di seluruh armada dan gudang.</p>
                </div>
                <button
                    onClick={handleOpenEdit}
                    className="btn-primary flex items-center gap-2 py-3 px-6 shadow-lg shadow-blue-500/20"
                >
                    <Edit size={18} />
                    <span>Update Stok Manual</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Stock Overview */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <Coins size={180} />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div>
                                <p className="text-blue-400 text-xs font-black uppercase tracking-[0.2em] mb-4">Total Nilai Persediaan</p>
                                <h2 className="text-5xl font-black tabular-nums">Rp {currentStockValue.toLocaleString()}</h2>
                                <p className="text-slate-400 text-sm mt-2 font-medium">Stok Tersedia (Siap Tukar)</p>
                            </div>
                            <div className="grid grid-cols-2 gap-10 pt-8 border-t border-white/10">
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase mb-2">Total Keluar (Tukar)</p>
                                    <div className="flex items-center gap-2 text-red-400">
                                        <TrendingDown size={18} />
                                        <span className="text-lg font-bold">Rp {totalOutValue.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase mb-2">Total Masuk (Uang Besar)</p>
                                    <div className="flex items-center gap-2 text-green-400">
                                        <ArrowUpRight size={18} />
                                        <span className="text-lg font-bold">Rp {totalInValue.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                            <Coins size={20} className="text-[var(--indomaret-blue)]" />
                            Rincian Stok Per Pecahan
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {stockData.map((d) => (
                                <div key={d.label} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex justify-between items-center group hover:border-[var(--indomaret-blue)] transition-all">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{d.label}</p>
                                        <p className="text-xl font-black text-[var(--indomaret-blue)] my-0.5">
                                            Rp {d.stockValue.toLocaleString()}
                                        </p>
                                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-tight">
                                            {d.currentQty.toLocaleString()} <span className="text-[9px] text-slate-400 font-bold">{d.denom >= 2000 ? 'lembar' : 'keping'}</span>
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase 
                                        ${d.status === 'Critical' || d.status === 'Empty' ? 'bg-red-100 text-red-600' :
                                            d.status === 'Low' ? 'bg-amber-100 text-amber-600' :
                                                'bg-green-100 text-green-600'}`}>
                                        {d.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Fleet Stock Monitoring & Tips */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <AlertTriangle size={20} className="text-amber-500" />
                            <h3 className="font-bold">Log Aktivitas Stok</h3>
                        </div>
                        <div className="space-y-4">
                            {/* Dummy Logs visually - Real implementation requires StockLog Store */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                                <p className="text-xs font-bold text-blue-800 dark:text-blue-400">System Ready</p>
                                <p className="text-[10px] text-blue-600 mt-1">Manajemen stok siap digunakan. Silakan input stok awal.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-600 text-white rounded-3xl p-6 shadow-xl space-y-4">
                        <div className="flex items-center gap-2">
                            <Info size={18} />
                            <h3 className="font-bold text-sm uppercase tracking-widest">Tips Manajemen</h3>
                        </div>
                        <p className="text-xs text-blue-100 leading-relaxed">
                            Pastikan update stok dilakukan setiap pagi sebelum armada berangkat (Loading) dan sore hari setelah kembali (Unloading).
                        </p>
                    </div>
                </div>
            </div>

            {/* EDIT MODAL */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Edit size={20} className="text-[var(--indomaret-blue)]" />
                                Update Stok Gudang
                            </h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20 mb-6">
                                <p className="text-xs text-amber-800 dark:text-amber-400 font-bold flex items-center gap-2">
                                    <Info size={14} />
                                    Input Total Nominal (Rupiah)
                                </p>
                                <p className="text-[10px] text-amber-600 mt-1 ml-6">
                                    Masukkan total nilai rupiah untuk setiap pecahan. Sistem akan otomatis menghitung jumlah keping.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {denomsList.map(denom => (
                                    <div key={denom} className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                            <span>Pecahan {denom.toLocaleString()}</span>
                                            <span className="text-[var(--indomaret-blue)]">
                                                {/* Calculate Quantity from Nominal State for Display */}
                                                {Math.floor((editValues[denom] || 0) / denom).toLocaleString()} {denom >= 2000 ? 'lembar' : 'keping'}
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Rp</span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-[var(--indomaret-blue)] tabular-nums"
                                                // Value is now directly the Nominal Value from state
                                                value={editValues[denom] ? editValues[denom].toLocaleString('id-ID') : ''}
                                                placeholder="0"
                                                onChange={(e) => {
                                                    // Remove non-digit characters
                                                    const rawValue = e.target.value.replace(/\D/g, '');
                                                    const nominal = parseInt(rawValue) || 0;

                                                    // Store nominal directly
                                                    setEditValues(prev => ({ ...prev, [denom]: nominal }));
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0 flex gap-3 justify-end">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveStock}
                                disabled={isSaving}
                                className="px-6 py-3 rounded-xl font-bold bg-[var(--indomaret-blue)] text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save size={18} />
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
