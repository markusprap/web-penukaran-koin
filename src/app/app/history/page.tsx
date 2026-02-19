'use client';

import { useTransactionStore } from '@/store/useTransactionStore';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Search,
    FileText,
    Calendar,
    ArrowUpRight,
    Download
} from 'lucide-react';
import { generatePDF, generatePDFDigital } from '@/lib/pdfGenerator';
import { useAuthStore } from '@/store/useAuthStore';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';

export default function FieldHistory() {
    const { history } = useTransactionStore();
    const { user } = useAuthStore();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState<string>('');

    const filteredHistory = history.filter(tx => {
        const matchesSearch = tx.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.id.toLowerCase().includes(searchTerm.toLowerCase());

        const txDate = format(new Date(tx.timestamp), 'yyyy-MM-dd');
        const matchesDate = selectedDate ? txDate === selectedDate : true;

        return matchesSearch && matchesDate;
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-10">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 p-6 sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800 backdrop-blur-md bg-white/80 dark:bg-slate-900/80">
                <div className="max-w-xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">History Penukaran</h1>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-5 space-y-6">
                {/* Search & Filter Section */}
                <div className="space-y-3">
                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--indomaret-blue)] transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Cari Toko atau ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border-2 border-transparent focus:border-[var(--indomaret-blue)] rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm font-bold"
                        />
                    </div>

                    {/* Date Filter */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border-2 border-transparent focus:border-[var(--indomaret-blue)] rounded-2xl py-3 pl-12 pr-4 shadow-sm focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm font-bold text-slate-600 dark:text-slate-300"
                            />
                        </div>
                        {selectedDate && (
                            <button
                                onClick={() => setSelectedDate('')}
                                className="px-4 py-3 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-2xl font-bold text-xs hover:bg-red-200 transition-colors"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* History List */}
                <div className="space-y-4">
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map((tx) => (
                            <div key={tx.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tanggal Transaksi</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-white">{format(new Date(tx.timestamp), 'dd MMMM yyyy', { locale: id })}</p>
                                        </div>
                                    </div>
                                    <span className="bg-blue-50 dark:bg-blue-900/30 text-[var(--indomaret-blue)] px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">Success</span>
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-[var(--indomaret-blue)] shadow-sm">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="font-black text-xs text-slate-900 dark:text-white uppercase leading-tight">{tx.storeName}</p>
                                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">ID: {tx.id.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                generatePDF({
                                                    ...tx,
                                                    id: tx.id,
                                                    status: 'completed',
                                                    signature: tx.signatureToko,
                                                    adminSignature: tx.signaturePetugas,
                                                    evidencePhoto: tx.photo,
                                                    userName: user?.full_name || 'Petugas',
                                                    storeTeamName: tx.storeTeamName || '-',
                                                    storeTeamPosition: tx.storeTeamPosition || '-',
                                                    storeTeamWa: tx.storeTeamWa || '-',
                                                    storeAddress: tx.storeAddress || '',
                                                    vehicle: tx.vehicle || '-'
                                                });
                                            }}
                                            className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
                                            title="Struk Termal"
                                        >
                                            <Download size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                generatePDFDigital({
                                                    ...tx,
                                                    id: tx.id,
                                                    status: 'completed',
                                                    signature: tx.signatureToko,
                                                    adminSignature: tx.signaturePetugas,
                                                    evidencePhoto: tx.photo,
                                                    userName: user?.full_name || 'Petugas',
                                                    storeTeamName: tx.storeTeamName || '-',
                                                    storeTeamPosition: tx.storeTeamPosition || '-',
                                                    storeTeamWa: tx.storeTeamWa || '-',
                                                    storeAddress: tx.storeAddress || '',
                                                    vehicle: tx.vehicle || '-'
                                                });
                                            }}
                                            className="w-9 h-9 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center text-green-500 hover:bg-green-100 dark:hover:bg-green-900/40 transition-all"
                                            title="PDF Digital (Dengan Foto)"
                                        >
                                            <FileText size={16} />
                                        </button>
                                        <ArrowUpRight size={18} className="text-slate-300 group-hover:text-[var(--indomaret-blue)] transition-colors self-center ml-1" />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center px-2">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Koin</p>
                                        <p className="text-lg font-black text-[var(--indomaret-blue)]">Rp {tx.totalCoin.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Uang Besar</p>
                                        <p className="text-lg font-black text-green-600 dark:text-green-400">Rp {tx.totalBigMoney.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto text-slate-300">
                                <Search size={40} />
                            </div>
                            <div>
                                <p className="font-black text-slate-900 dark:text-white">Tidak Ada Hasil</p>
                                <p className="text-xs text-slate-400">Coba gunakan kata kunci pencarian lain.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
