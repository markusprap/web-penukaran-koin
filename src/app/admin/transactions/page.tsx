'use client';

import { apiFetch } from '@/lib/api';
import {
    Search,
    Download,
    FileText,
    ChevronRight,
    Coins,
    Banknote,
    Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState, useEffect, useMemo, useCallback, Fragment } from 'react';

interface BackendTransaction {
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

const COIN_DENOMS = [100, 200, 500, 1000, 2000, 5000, 10000, 20000];


export default function AdminTransactions() {

    const [transactions, setTransactions] = useState<BackendTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);



    // Fetch transactions from backend
    const fetchTransactions = useCallback(async () => {
        try {
            const data = await apiFetch('/transactions?source=field');
            setTransactions(data);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // Filter
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx =>
            (tx.store?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.storeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.storeTeamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tx.user?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [transactions, searchTerm]);

    const toggleRow = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };



    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Transaksi Lapangan</h1>
                    <p className="text-slate-500 text-sm">Riwayat penukaran koin oleh petugas lapangan.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors">
                        <Download size={18} />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari Toko, NIK, atau Nama Petugas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[var(--indomaret-blue)] transition-all"
                    />
                </div>
            </div>

            {/* Transactions Table */}
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
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <Loader2 size={32} className="animate-spin mx-auto text-slate-300 mb-3" />
                                        <p className="text-sm text-slate-400">Memuat transaksi...</p>
                                    </td>
                                </tr>
                            ) : filteredTransactions.length > 0 ? (
                                filteredTransactions.map((tx) => (
                                    <Fragment key={tx.id}>
                                        <tr
                                            onClick={() => toggleRow(tx.id)}
                                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group ${expandedRow === tx.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900 dark:text-white uppercase text-xs">{tx.id.substring(0, 8)}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">
                                                    {format(new Date(tx.timestamp || tx.createdAt), 'dd MMM yyyy • HH:mm', { locale: id })}
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
                                                    <span className="font-bold text-blue-600">Rp {tx.totalCoin.toLocaleString()}</span>
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
                                                                {tx.details?.filter((d: any) => d.type === 'COIN').sort((a: any, b: any) => a.denom - b.denom).map((d: any) => (
                                                                    <div key={d.denom} className="flex justify-between items-center border-b border-slate-50 dark:border-slate-700/50 pb-1">
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Rp {d.denom.toLocaleString()}</span>
                                                                        <span className="text-xs font-black text-slate-700 dark:text-white">Rp {(d.denom * d.qty).toLocaleString()}</span>
                                                                    </div>
                                                                ))}
                                                                {(!tx.details || tx.details.filter((d: any) => d.type === 'COIN').length === 0) && (
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
                                                                {tx.details?.filter((d: any) => d.type === 'BIG_MONEY').sort((a: any, b: any) => a.denom - b.denom).map((d: any) => (
                                                                    <div key={d.denom} className="flex justify-between items-center border-b border-slate-50 dark:border-slate-700/50 pb-1">
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Rp {d.denom.toLocaleString()}</span>
                                                                        <span className="text-xs font-black text-slate-700 dark:text-white">Rp {(d.denom * d.qty).toLocaleString()}</span>
                                                                    </div>
                                                                ))}
                                                                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-end">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Terima</span>
                                                                    <span className="text-lg font-black text-green-600 leading-none tabular-nums">Rp {tx.totalBigMoney.toLocaleString()}</span>
                                                                </div>
                                                                {(!tx.details || tx.details.filter((d: any) => d.type === 'BIG_MONEY').length === 0) && (
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
                                            <p className="font-medium">Tidak ada transaksi yang ditemukan.</p>
                                            <p className="text-xs">Coba ubah kata kunci pencarian Anda.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <p className="text-xs text-slate-500 font-medium">Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi</p>
                </div>
            </div>

        </div>
    );
}
