'use client';

import { useMasterDataStore } from '@/store/useMasterDataStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { apiFetch } from '@/lib/api';
import {
    Search,
    Coins,
    Banknote,
    Save,
    Loader2,
    Building2,
    Clock,
    CheckCircle2,
    Store,
    User,
    Phone,
    Briefcase,
    X,
    Plus,
    ChevronRight,
    ChevronDown,
    FileText,
    Download
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useState, useEffect, useMemo, useCallback, useRef, Fragment } from 'react';
import { useRouter } from 'next/navigation';

const COIN_DENOMS = [100, 200, 500, 1000, 2000, 5000, 10000, 20000];
const BIG_MONEY_DENOMS = [50000, 100000];

interface WalkInTx {
    id: string;
    userNik: string;
    storeCode: string;
    vehicleNopol: string | null;
    storeTeamName: string;
    storeTeamWa: string | null;
    storeTeamPosition: string | null;
    totalCoin: number;
    totalBigMoney: number;
    status: string;
    source: string;
    timestamp: string;
    createdAt: string;
    store?: { code: string; name: string; address?: string };
    user?: { nik: string; full_name: string };
    details?: { denom: number; qty: number; type: string }[];
}

export default function WalkInTransaction() {
    const router = useRouter();
    const { stores, fetchMasterData, stockInventory, fetchStock } = useMasterDataStore();
    const { notify, showAlert } = useNotificationStore();
    const { user: authUser } = useAuthStore();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Walk-in transaction history
    const [walkInTxs, setWalkInTxs] = useState<WalkInTx[]>([]);
    const [isLoadingTxs, setIsLoadingTxs] = useState(true);
    const [txSearchTerm, setTxSearchTerm] = useState('');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Store selection with search
    const [storeSearch, setStoreSearch] = useState('');
    const [selectedStore, setSelectedStore] = useState('');
    const [showStoreDropdown, setShowStoreDropdown] = useState(false);
    const storeDropdownRef = useRef<HTMLDivElement>(null);

    // Timestamp
    const [transactionDate, setTransactionDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));

    // Form
    const [storeTeamName, setStoreTeamName] = useState('');
    const [storeTeamWa, setStoreTeamWa] = useState('');
    const [storeTeamPosition, setStoreTeamPosition] = useState('');
    const [coinInputs, setCoinInputs] = useState<Record<number, string>>({});
    const [bigMoneyInputs, setBigMoneyInputs] = useState<Record<number, string>>({});

    // Fetch walk-in transactions
    const fetchWalkInTxs = useCallback(async () => {
        try {
            const data = await apiFetch('/transactions?source=walk_in');
            setWalkInTxs(data);
        } catch (error) {
            console.error('Failed to fetch walk-in transactions:', error);
        } finally {
            setIsLoadingTxs(false);
        }
    }, []);

    useEffect(() => {
        fetchMasterData();
        fetchWalkInTxs();
    }, [fetchMasterData]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (storeDropdownRef.current && !storeDropdownRef.current.contains(e.target as Node)) {
                setShowStoreDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filtered stores for search
    const filteredStores = useMemo(() => {
        if (!storeSearch.trim()) return stores;
        const q = storeSearch.toLowerCase();
        return stores.filter(s =>
            s.code.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q) ||
            (s.address || '').toLowerCase().includes(q)
        );
    }, [stores, storeSearch]);

    const selectedStoreData = stores.find(s => s.code === selectedStore);

    // Calculate coin/bigMoney quantities from nominal inputs
    const coinQty = (denom: number) => {
        const raw = (coinInputs[denom] || '').replace(/\D/g, '');
        const nominal = parseInt(raw) || 0;
        return Math.floor(nominal / denom);
    };
    const bigMoneyQty = (denom: number) => {
        const raw = (bigMoneyInputs[denom] || '').replace(/\D/g, '');
        const nominal = parseInt(raw) || 0;
        return Math.floor(nominal / denom);
    };

    const totalCoin = COIN_DENOMS.reduce((acc, d) => acc + (coinQty(d) * d), 0);
    const totalBigMoney = BIG_MONEY_DENOMS.reduce((acc, d) => acc + (bigMoneyQty(d) * d), 0);

    const filteredWalkInTxs = useMemo(() => {
        return walkInTxs.filter(tx =>
            (tx.store?.name || '').toLowerCase().includes(txSearchTerm.toLowerCase()) ||
            tx.storeCode.toLowerCase().includes(txSearchTerm.toLowerCase()) ||
            tx.storeTeamName.toLowerCase().includes(txSearchTerm.toLowerCase())
        );
    }, [walkInTxs, txSearchTerm]);

    const resetForm = () => {
        setSelectedStore('');
        setStoreSearch('');
        setStoreTeamName('');
        setStoreTeamWa('');
        setStoreTeamPosition('');
        setCoinInputs({});
        setBigMoneyInputs({});
        setTransactionDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
        setShowForm(false);
    };

    const handleSubmit = async () => {
        if (!selectedStore) {
            showAlert('Data Belum Lengkap', 'Pilih toko terlebih dahulu.', 'warning');
            return;
        }
        if (!storeTeamName.trim()) {
            showAlert('Data Belum Lengkap', 'Masukkan nama tim toko.', 'warning');
            return;
        }
        if (totalCoin === 0) {
            showAlert('Data Belum Lengkap', 'Masukkan jumlah koin yang ditukar.', 'warning');
            return;
        }
        if (totalCoin !== totalBigMoney) {
            showAlert(
                'Nominal Tidak Seimbang',
                `Total koin (Rp ${totalCoin.toLocaleString()}) tidak sama dengan total uang besar (Rp ${totalBigMoney.toLocaleString()}). Selisih: Rp ${Math.abs(totalCoin - totalBigMoney).toLocaleString()}.`,
                'warning'
            );
            return;
        }

        // Check warehouse stock sufficiency
        let enoughStock = true;
        COIN_DENOMS.forEach(denom => {
            const qty = coinQty(denom);
            if (qty > 0 && (stockInventory[denom] || 0) < qty) {
                enoughStock = false;
            }
        });
        if (!enoughStock) {
            showAlert('Stok Gudang Tidak Cukup', 'Saldo stok gudang tidak mencukupi untuk transaksi ini.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const details: { denom: number; qty: number; type: string }[] = [];
            COIN_DENOMS.forEach(denom => {
                const qty = coinQty(denom);
                if (qty > 0) details.push({ denom, qty, type: 'COIN' });
            });
            BIG_MONEY_DENOMS.forEach(denom => {
                const qty = bigMoneyQty(denom);
                if (qty > 0) details.push({ denom, qty, type: 'BIG_MONEY' });
            });

            await apiFetch('/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    userNik: authUser?.nik || 'ADMIN',
                    storeCode: selectedStore,
                    vehicleNopol: null,
                    totalCoin,
                    totalBigMoney,
                    storeTeamName: storeTeamName.trim(),
                    storeTeamWa: storeTeamWa.trim() || null,
                    storeTeamPosition: storeTeamPosition.trim() || null,
                    source: 'walk_in',
                    timestamp: new Date(transactionDate).toISOString(),
                    details
                })
            });

            await fetchStock();
            await fetchWalkInTxs(); // Refresh walk-in transaction list

            // Close form and show success alert
            resetForm();
            notify('Transaksi walk-in berhasil dicatat!', 'success');
            showAlert('Berhasil', 'Transaksi walk-in telah berhasil disimpan.', 'success');

        } catch (err: any) {
            showAlert('Gagal', err.message || 'Gagal menyimpan transaksi.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <Building2 size={24} className="text-purple-600" />
                        Transaksi Kantor
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola penukaran koin dari tim toko yang datang langsung ke gudang.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="btn-primary flex items-center gap-2 py-3 px-6 shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={18} />
                        <span>Transaksi Baru</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors">
                        <Download size={18} />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
                    <div className="w-full max-w-3xl max-h-[90vh] bg-slate-50 dark:bg-slate-950 rounded-2xl shadow-2xl mt-8 mb-8 flex flex-col animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-2xl shrink-0">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <Building2 size={20} className="text-purple-600" />
                                    Transaksi Kantor Baru
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">Catat penukaran koin walk-in</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                            {/* Timestamp Card */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                                        <Clock size={18} className="text-purple-600" />
                                    </div>
                                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Waktu Transaksi</h2>
                                </div>
                                <input
                                    type="datetime-local"
                                    value={transactionDate}
                                    onChange={(e) => setTransactionDate(e.target.value)}
                                    className="w-full md:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Store Selection with Search */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                        <Store size={18} className="text-blue-600" />
                                    </div>
                                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Pilih Toko *</h2>
                                </div>

                                <div ref={storeDropdownRef} className="relative">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            value={selectedStore ? `${selectedStore} — ${selectedStoreData?.name || ''}` : storeSearch}
                                            onChange={(e) => {
                                                setStoreSearch(e.target.value);
                                                setSelectedStore('');
                                                setShowStoreDropdown(true);
                                            }}
                                            onFocus={() => setShowStoreDropdown(true)}
                                            placeholder="Ketik kode toko atau nama toko..."
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-11 pr-10 text-sm font-bold focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        />
                                        {selectedStore && (
                                            <button
                                                onClick={() => { setSelectedStore(''); setStoreSearch(''); }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                                            >
                                                <X size={16} className="text-slate-400" />
                                            </button>
                                        )}
                                    </div>

                                    {showStoreDropdown && !selectedStore && (
                                        <div className="absolute z-20 top-full mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-64 overflow-y-auto">
                                            {filteredStores.length > 0 ? (
                                                filteredStores.map(s => (
                                                    <button
                                                        key={s.code}
                                                        onClick={() => {
                                                            setSelectedStore(s.code);
                                                            setStoreSearch('');
                                                            setShowStoreDropdown(false);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-b-0"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <Store size={16} className="text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{s.code} — {s.name}</p>
                                                                {s.address && <p className="text-[11px] text-slate-400 truncate max-w-md">{s.address}</p>}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-6 text-center text-sm text-slate-400">
                                                    Toko tidak ditemukan.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {selectedStoreData?.address && (
                                    <div className="mt-3 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100/50 dark:border-blue-900/20 animate-in fade-in duration-200">
                                        <p className="text-[10px] uppercase font-black text-blue-400 tracking-widest mb-1">Alamat Toko</p>
                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{selectedStoreData.address}</p>
                                    </div>
                                )}
                            </div>

                            {/* Store Team Info */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                        <User size={18} className="text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Info Tim Toko</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <User size={12} /> Nama Tim Toko *
                                        </label>
                                        <input
                                            type="text"
                                            value={storeTeamName}
                                            onChange={(e) => setStoreTeamName(e.target.value)}
                                            placeholder="Nama perwakilan toko"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Phone size={12} /> No. WhatsApp
                                        </label>
                                        <input
                                            type="text"
                                            value={storeTeamWa}
                                            onChange={(e) => setStoreTeamWa(e.target.value)}
                                            placeholder="08xxxxxxxxxx"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Briefcase size={12} /> Jabatan
                                        </label>
                                        <input
                                            type="text"
                                            value={storeTeamPosition}
                                            onChange={(e) => setStoreTeamPosition(e.target.value)}
                                            placeholder="Kasir / Kepala Toko"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Coin Input */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                                        <Coins size={18} className="text-amber-600" />
                                    </div>
                                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Koin yang Ditukar (Nominal Rp)</h2>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {COIN_DENOMS.map(denom => (
                                        <div key={denom} className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase flex justify-between">
                                                <span>Rp {denom.toLocaleString()}</span>
                                                <span className="text-purple-600">
                                                    {coinQty(denom).toLocaleString()} {denom >= 2000 ? 'lbr' : 'kpg'}
                                                </span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">Rp</span>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={coinInputs[denom] || ''}
                                                    placeholder="0"
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value.replace(/\D/g, '');
                                                        const formatted = rawValue ? parseInt(rawValue).toLocaleString('id-ID') : '';
                                                        setCoinInputs(prev => ({ ...prev, [denom]: formatted }));
                                                    }}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-sm font-bold focus:ring-2 focus:ring-purple-500 focus:border-transparent tabular-nums transition-all"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Big Money Input */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                                        <Banknote size={18} className="text-green-600" />
                                    </div>
                                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Uang Besar Diterima (Nominal Rp)</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {BIG_MONEY_DENOMS.map(denom => (
                                        <div key={denom} className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase flex justify-between">
                                                <span>Rp {denom.toLocaleString()}</span>
                                                <span className="text-green-600">
                                                    {bigMoneyQty(denom).toLocaleString()} lembar
                                                </span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">Rp</span>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={bigMoneyInputs[denom] || ''}
                                                    placeholder="0"
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value.replace(/\D/g, '');
                                                        const formatted = rawValue ? parseInt(rawValue).toLocaleString('id-ID') : '';
                                                        setBigMoneyInputs(prev => ({ ...prev, [denom]: formatted }));
                                                    }}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-sm font-bold focus:ring-2 focus:ring-green-500 focus:border-transparent tabular-nums transition-all"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Ringkasan Transaksi</p>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Total Koin Keluar</p>
                                        <p className="text-2xl font-black text-amber-400 tabular-nums">Rp {totalCoin.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Total Uang Besar</p>
                                        <p className="text-2xl font-black text-green-400 tabular-nums">Rp {totalBigMoney.toLocaleString()}</p>
                                    </div>
                                </div>
                                {totalCoin > 0 && totalBigMoney > 0 && totalCoin !== totalBigMoney && (
                                    <p className="text-[10px] text-amber-300 font-bold mt-3">
                                        ⚠️ Selisih: Rp {Math.abs(totalCoin - totalBigMoney).toLocaleString()}
                                    </p>
                                )}
                            </div>

                        </div>
                        {/* Modal Footer */}
                        <div className="flex gap-3 justify-end px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl shrink-0">
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-8 py-2.5 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20 flex items-center gap-2 disabled:opacity-50 text-sm"
                            >
                                {isSubmitting ? (
                                    <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
                                ) : (
                                    <><Save size={18} /> Simpan Transaksi</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================ */}
            {/* WALK-IN TRANSACTION HISTORY TABLE */}
            {/* ============================================ */}

            {/* Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari Toko, Kode, atau Nama Tim..."
                        value={txSearchTerm}
                        onChange={(e) => setTxSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                </div>
            </div>

            {/* Transaction Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-5">Order ID & Waktu</th>
                                <th className="px-6 py-5">Info Toko</th>
                                <th className="px-6 py-5">Penukaran</th>
                                <th className="px-6 py-5 text-right pr-12">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                            {isLoadingTxs ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <Loader2 size={32} className="animate-spin mx-auto text-slate-300 mb-3" />
                                        <p className="text-sm text-slate-400">Memuat transaksi kantor...</p>
                                    </td>
                                </tr>
                            ) : filteredWalkInTxs.length > 0 ? (
                                filteredWalkInTxs.map((tx) => (
                                    <Fragment key={tx.id}>
                                        <tr
                                            onClick={() => setExpandedRow(expandedRow === tx.id ? null : tx.id)}
                                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group ${expandedRow === tx.id ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''}`}
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900 dark:text-white uppercase text-xs">{tx.id.substring(0, 8)}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">
                                                    {format(new Date(tx.timestamp || tx.createdAt), 'dd MMM yyyy • HH:mm', { locale: localeId })}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-white">{tx.store?.name || tx.storeCode}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-medium">{tx.storeCode} • Tim: {tx.storeTeamName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-purple-600">Rp {tx.totalCoin.toLocaleString()}</span>
                                                    <span className="text-[10px] text-slate-400">Koin Keluar</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right pr-6">
                                                <div className="flex items-center justify-end gap-3">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-black rounded uppercase">
                                                        Success
                                                    </span>
                                                    <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all shadow-sm">
                                                        <ChevronRight size={18} className={`text-slate-400 transition-transform duration-300 ${expandedRow === tx.id ? 'rotate-90' : ''}`} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRow === tx.id && (
                                            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
                                                <td colSpan={4} className="px-6 py-8">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2 text-amber-600 mb-2">
                                                                <Coins size={16} />
                                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Detail Koin Keluar</h4>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                                                {tx.details?.filter((d) => d.type === 'COIN').sort((a, b) => a.denom - b.denom).map((d) => (
                                                                    <div key={d.denom} className="flex justify-between items-center border-b border-slate-50 dark:border-slate-700/50 pb-1">
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Rp {d.denom.toLocaleString()}</span>
                                                                        <span className="text-xs font-black text-slate-700 dark:text-white">Rp {(d.denom * d.qty).toLocaleString()}</span>
                                                                    </div>
                                                                ))}
                                                                {(!tx.details || tx.details.filter((d) => d.type === 'COIN').length === 0) && (
                                                                    <p className="col-span-2 text-center text-[10px] text-slate-400 font-bold uppercase py-2 italic opacity-50 tracking-widest">Data koin tidak tersedia</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2 text-green-600 mb-2">
                                                                <Banknote size={16} />
                                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Detail Uang Besar</h4>
                                                            </div>
                                                            <div className="flex flex-col gap-3 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                                                {tx.details?.filter((d) => d.type === 'BIG_MONEY').sort((a, b) => a.denom - b.denom).map((d) => (
                                                                    <div key={d.denom} className="flex justify-between items-center border-b border-slate-50 dark:border-slate-700/50 pb-1">
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Rp {d.denom.toLocaleString()}</span>
                                                                        <span className="text-xs font-black text-slate-700 dark:text-white">Rp {(d.denom * d.qty).toLocaleString()}</span>
                                                                    </div>
                                                                ))}
                                                                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-end">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Terima</span>
                                                                    <span className="text-lg font-black text-green-600 leading-none tabular-nums">Rp {tx.totalBigMoney.toLocaleString()}</span>
                                                                </div>
                                                                {(!tx.details || tx.details.filter((d) => d.type === 'BIG_MONEY').length === 0) && (
                                                                    <p className="text-center text-[10px] text-slate-400 font-bold uppercase py-2 italic opacity-50 tracking-widest">Data uang tidak tersedia</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <FileText size={48} className="mb-4 opacity-20" />
                                            <p className="font-medium">Belum ada transaksi kantor.</p>
                                            <p className="text-xs">Klik "Transaksi Baru" untuk memulai.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <p className="text-xs text-slate-500 font-medium">Menampilkan {filteredWalkInTxs.length} dari {walkInTxs.length} transaksi kantor</p>
                </div>
            </div>

        </div>
    );
}
