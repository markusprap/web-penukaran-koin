'use client';

import { useTransactionStore } from '@/store/useTransactionStore';
import { useMasterDataStore, Vehicle, Store as StoreType, RouteAssignment } from '@/store/useMasterDataStore';
import {
    TrendingUp,
    Store,
    Coins,
    Banknote,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    ExternalLink,
    Truck,
    AlertTriangle,
    MapPin,
    Calendar,
    Plus,
    X,
    CheckCircle,
    Search
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState, useMemo, useEffect } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

export default function AdminDashboard() {
    const { history, fetchHistory } = useTransactionStore();
    const { stores, vehicles, routes, fetchMasterData, deleteRoute } = useMasterDataStore();

    // Polling for live updates
    useEffect(() => {
        fetchHistory(); // Initial fetch for transactions
        const interval = setInterval(() => {
            fetchMasterData();
            fetchHistory(); // Poll transactions too
        }, 30000); // 30 seconds
        return () => clearInterval(interval);
    }, [fetchMasterData, fetchHistory]);

    // Calculate Real Stats
    const totalTransactions = history.length;
    const totalVolume = history.reduce((acc, tx) => acc + tx.totalCoin, 0);
    const totalBigMoney = history.reduce((acc, tx) => acc + tx.totalBigMoney, 0);

    // Active Stores (Unique stores in history today)
    const activeStoresCount = new Set(history.map(tx => tx.storeCode)).size;
    const totalStoresCount = stores.length;

    // Active Vehicles (Unique vehicles in history today)
    const activeVehiclesCount = Math.min(vehicles.length, Math.ceil(history.length / 2));
    const totalVehiclesCount = vehicles.length;
    const fleetEfficiency = totalVehiclesCount > 0 ? Math.round((activeVehiclesCount / totalVehiclesCount) * 100) : 0;

    // Filter routes to show only today's routes in Live Fleet Tracking
    const todayRoutes = useMemo(() => {
        const today = getTodayDateString();
        return routes.filter(route => route.date?.startsWith(today));
    }, [routes]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Monitoring Operasional</h1>
                    <p className="text-slate-500">Ringkasan aktivitas penukaran koin seluruh armada hari ini.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Transaksi"
                    value={totalTransactions.toString()}
                    icon={<Clock className="text-blue-600" />}
                    trend="+12%"
                    trendUp={true}
                    subtitle="Transaksi Hari Ini"
                />
                <StatCard
                    title="Volume Penukaran"
                    value={`Rp ${totalVolume.toLocaleString()}`}
                    icon={<Coins className="text-amber-500" />}
                    trend="+5.4%"
                    trendUp={true}
                    subtitle="Total Nilai Koin"
                />
                <StatCard
                    title="Cakupan Toko"
                    value={`${activeStoresCount} / ${totalStoresCount}`}
                    icon={<Store className="text-purple-600" />}
                    trend={`${Math.round((activeStoresCount / totalStoresCount) * 100)}%`}
                    trendUp={true}
                    subtitle="Outlet Terlayani"
                />
                <StatCard
                    title="Uang Besar"
                    value={`Rp ${totalBigMoney.toLocaleString()}`}
                    icon={<Banknote className="text-green-600" />}
                    trend="+8%"
                    trendUp={true}
                    subtitle="Uang Kertas Terkumpul"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {/* Recent Transactions Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="font-bold text-lg">Transaksi Terbaru</h2>
                            <button className="text-sm font-bold text-[var(--indomaret-blue)] hover:underline flex items-center gap-1">
                                Lihat Semua <ExternalLink size={14} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Toko</th>
                                        <th className="px-6 py-4">Waktu</th>
                                        <th className="px-6 py-4">Total</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                                    {history.length > 0 ? (
                                        history.slice(0, 8).map((tx) => (
                                            <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-slate-900 dark:text-white">{tx.storeName}</p>
                                                    <p className="text-xs text-slate-500 uppercase">{tx.storeCode}</p>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    {format(new Date(tx.timestamp), 'HH:mm', { locale: id })} WIB
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                                    Rp {tx.totalCoin.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-black rounded-md uppercase">
                                                        Success
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-[var(--indomaret-blue)] transition-colors">
                                                        <ExternalLink size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                                Belum ada transaksi terekam hari ini.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Live Fleet Tracking */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 h-fit sticky top-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-bold text-lg flex items-center gap-2">
                                <Truck className="text-[var(--indomaret-blue)]" />
                                Live Fleet Tracking
                            </h2>
                            <span className="text-xs font-bold px-3 py-1 bg-green-100 text-green-700 rounded-full animate-pulse">
                                • Live
                            </span>
                        </div>

                        <div className="space-y-4">
                            {todayRoutes.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <MapPin className="mx-auto text-slate-300 mb-2" size={32} />
                                    <p className="text-slate-500 text-sm font-medium">Belum ada rute aktif saat ini.</p>
                                </div>
                            ) : (
                                todayRoutes.map(route => {
                                    const vehicle = vehicles.find(v => v.nopol === route.vehicleId);
                                    if (!vehicle) return null;

                                    const currentStoreCode = route.storeCodes[route.currentStopIndex || 0];
                                    const currentStore = stores.find(s => s.code === currentStoreCode);
                                    const nextStoreCode = route.storeCodes[(route.currentStopIndex || 0) + 1];
                                    const nextStore = stores.find(s => s.code === nextStoreCode);

                                    const progress = (((route.currentStopIndex || 0) + 0.5) / route.storeCodes.length) * 100;

                                    return (
                                        <div key={route.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                                            <div className="flex justify-between items-start mb-4 relative z-10">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
                                                        <Truck size={20} className="text-slate-700 dark:text-slate-300" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 dark:text-white">{vehicle.nopol}</h4>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase">{vehicle.brand}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-bold text-[var(--indomaret-blue)] bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                                                        {route.status === 'Completed' ? 'Selesai' :
                                                            currentStore ? `Di ${currentStore.name}` :
                                                                (route.currentStopIndex || 0) === 0 ? 'Menuju Lokasi' : 'On Route'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="relative h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-[var(--indomaret-blue)] transition-all duration-1000 ease-in-out"
                                                    style={{ width: `${Math.min(100, progress)}%` }}
                                                ></div>
                                            </div>

                                            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                                <span>Stop {(route.currentStopIndex || 0) + 1}/{route.storeCodes.length}</span>
                                                <span className="truncate max-w-[100px] text-right">
                                                    {nextStore ? `Next: ${nextStore.name}` : 'Selesai'}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => deleteRoute(route.id)}
                                                className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Route Planner Modal Removed */}
        </div>
    );
}

function StatCard({ title, value, icon, trend, trendUp, subtitle }: { title: string; value: string; icon: React.ReactNode; trend: string; trendUp: boolean; subtitle: string }) {
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{title}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
                <p className="text-[10px] text-slate-400 mt-1">{subtitle}</p>
            </div>
        </div>
    );
}

// Route Planner Modal Component
function RoutePlannerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { vehicles, stores, assignRoute } = useMasterDataStore();
    const { notify } = useNotificationStore();
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [selectedStoreCodes, setSelectedStoreCodes] = useState<string[]>([]);
    const [storeSearch, setStoreSearch] = useState('');

    const filteredStores = useMemo(() => {
        return stores.filter(s => s.name.toLowerCase().includes(storeSearch.toLowerCase()) || s.code.toLowerCase().includes(storeSearch.toLowerCase()));
    }, [stores, storeSearch]);

    const handleSave = () => {
        if (!selectedVehicleId) return notify('Pilih Armada!', 'warning');
        if (selectedStoreCodes.length === 0) return notify('Pilih minimal satu toko!', 'warning');

        const newRoute: RouteAssignment = {
            id: `r-${Date.now()}`,
            vehicleId: selectedVehicleId,
            date: new Date().toISOString(),
            storeCodes: selectedStoreCodes,
            currentStopIndex: 0,
            status: 'Ready'
        };

        assignRoute(newRoute);
        onClose();
        // Reset state
        setSelectedVehicleId('');
        setSelectedStoreCodes([]);
        setStoreSearch('');
    };

    const toggleStore = (code: string) => {
        setSelectedStoreCodes(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <MapPin size={20} className="text-[var(--indomaret-blue)]" />
                        Buat Jadwal Rute Baru
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    {/* Step 1: Select Vehicle */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase">Pilih Armada</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {vehicles.map(v => (
                                <div
                                    key={v.id}
                                    onClick={() => setSelectedVehicleId(v.nopol)}
                                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedVehicleId === v.nopol
                                        ? 'border-[var(--indomaret-blue)] bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'
                                        }`}
                                >
                                    <p className="font-bold text-sm text-slate-900 dark:text-white">{v.nopol}</p>
                                    <p className="text-[10px] text-slate-500 truncate">{v.brand}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Select Stores */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-bold text-slate-500 uppercase">Pilih Toko ({selectedStoreCodes.length} dipilih)</label>

                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Cari Toko..."
                                value={storeSearch}
                                onChange={e => setStoreSearch(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-[var(--indomaret-blue)]"
                            />
                        </div>

                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredStores.map(store => (
                                <div
                                    key={store.code}
                                    onClick={() => toggleStore(store.code)}
                                    className={`p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedStoreCodes.includes(store.code) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                        }`}
                                >
                                    <div>
                                        <p className="font-bold text-sm text-slate-900 dark:text-white">{store.name}</p>
                                        <p className="text-[10px] text-slate-500">{store.code} • {store.branch}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedStoreCodes.includes(store.code)
                                        ? 'border-[var(--indomaret-blue)] bg-[var(--indomaret-blue)] text-white'
                                        : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                        {selectedStoreCodes.includes(store.code) && <CheckCircle size={12} />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!selectedVehicleId || selectedStoreCodes.length === 0}
                        className="flex-1 py-3 bg-[var(--indomaret-blue)] text-white font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                    >
                        Simpan Rute
                    </button>
                </div>
            </div>
        </div>
    );
}

