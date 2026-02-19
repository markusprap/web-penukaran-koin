'use client';

import {
    Users,
    Truck,
    Coins,
    Trash2,
    Plus,
    Check,
    X,
    Calendar,
    Edit
} from 'lucide-react';
import { useMasterDataStore } from '@/store/useMasterDataStore';
import { useAssignmentStore, Stock } from '@/store/useAssignmentStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';

export default function AdminAssignmentsPage() {
    const { users, vehicles, stockInventory, fetchStock, stores, fetchMasterData } = useMasterDataStore();
    const { assignments, fetchAssignments, createAssignment, updateAssignment, deleteAssignment, isLoading } = useAssignmentStore();
    const { notify, showAlert, showConfirm } = useNotificationStore();

    useEffect(() => {
        fetchAssignments();
        fetchMasterData();
    }, [fetchAssignments, fetchMasterData]);

    // Filter State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State (Assignment)
    const [selectedCashier, setSelectedCashier] = useState('');
    const [selectedDriver, setSelectedDriver] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [initialStock, setInitialStock] = useState<Stock>({});
    const [nominalInputs, setNominalInputs] = useState<Record<number, string>>({});
    const [editingAssignment, setEditingAssignment] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Store Selection State
    const [selectedStoreCodes, setSelectedStoreCodes] = useState<string[]>([]);
    const [storeSearch, setStoreSearch] = useState('');

    // Filtered Assignments
    const filteredAssignments = assignments.filter(a => a.date === selectedDate);

    // Filter helpers
    const cashiers = users.filter(u => u.position === 'CASHIER');
    const drivers = users.filter(u => u.position === 'DRIVER');
    const availableVehicles = vehicles; // In real app, filter by availability
    const denoms = [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
    const totalModal = Object.entries(initialStock).reduce((acc, [d, q]) => acc + (parseInt(d) * q), 0);

    // Handlers
    const handleStockChange = (denom: number, val: string) => {
        const rawValue = val.replace(/\D/g, '');
        const nominal = parseInt(rawValue) || 0;

        const formatted = rawValue ? parseInt(rawValue).toLocaleString('id-ID') : '';
        setNominalInputs(prev => ({ ...prev, [denom]: formatted }));

        const qty = Math.floor(nominal / denom);
        setInitialStock(prev => ({ ...prev, [denom]: qty }));
    };

    const filteredStores = stores.filter(s =>
        !selectedStoreCodes.includes(s.code) &&
        (s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
            s.code.toLowerCase().includes(storeSearch.toLowerCase()))
    ).slice(0, 10);

    const addStoreToRoute = (code: string) => {
        if (!selectedStoreCodes.includes(code)) {
            setSelectedStoreCodes(prev => [...prev, code]);
        }
        setStoreSearch('');
    };

    const removeStoreFromRoute = (code: string) => {
        setSelectedStoreCodes(prev => prev.filter(c => c !== code));
    };

    const openModal = (assign?: any) => {
        if (assign) {
            setEditingAssignment(assign.id);
            setSelectedCashier(assign.cashierId);
            setSelectedDriver(assign.driverId);
            setSelectedVehicle(assign.vehicleId);
            setInitialStock(assign.initialStock);
            setSelectedStoreCodes(assign.storeCodes || []);

            // Format nominal inputs for display
            const inputs: Record<number, string> = {};
            Object.entries(assign.initialStock).forEach(([d, q]) => {
                const denom = parseInt(d);
                inputs[denom] = (denom * (q as number)).toLocaleString('id-ID');
            });
            setNominalInputs(inputs);
        } else {
            setEditingAssignment(null);
            setSelectedCashier('');
            setSelectedDriver('');
            setSelectedVehicle('');
            setInitialStock({});
            setNominalInputs({});
            setSelectedStoreCodes([]);
        }
        setIsModalOpen(true);
    };

    const handleFormSubmit = async () => {
        if (!selectedCashier || !selectedDriver || !selectedVehicle) {
            showAlert('Data Belum Lengkap', 'Mohon lengkapi data petugas dan armada.', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingAssignment) {
                await updateAssignment(editingAssignment, {
                    cashierId: selectedCashier,
                    driverId: selectedDriver,
                    vehicleId: selectedVehicle,
                    storeCodes: selectedStoreCodes
                });
                notify('Penugasan berhasil diperbarui!', 'success');
            } else {
                // Create Flow
                if (totalModal === 0) {
                    const confirmed = await showConfirm('Konfirmasi Modal', 'Modal awal 0 Rupiah? Yakin lanjutkan?');
                    if (!confirmed) {
                        setIsSubmitting(false);
                        return;
                    }
                }

                // Check Stock
                let enoughStock = true;
                Object.entries(initialStock).forEach(([d, qty]) => {
                    const denom = parseInt(d);
                    if ((stockInventory[denom] || 0) < qty) {
                        enoughStock = false;
                        showAlert('Stok Tidak Cukup', `Stok gudang tidak cukup untuk pecahan ${denom}`, 'error');
                    }
                });
                if (!enoughStock) {
                    setIsSubmitting(false);
                    return;
                }

                if (selectedStoreCodes.length === 0) {
                    showAlert('Data Belum Lengkap', 'Pilih minimal satu toko untuk dikunjungi rute.', 'warning');
                    setIsSubmitting(false);
                    return;
                }

                await createAssignment({
                    date: selectedDate,
                    cashierId: selectedCashier,
                    driverId: selectedDriver,
                    vehicleId: selectedVehicle,
                    initialStock: initialStock,
                    storeCodes: selectedStoreCodes
                });
                // Refresh stock from server (backend auto-deducted)
                await fetchStock();
                notify('Penugasan berhasil dibuat!', 'success');
            }
            setIsModalOpen(false);
        } catch (err: any) {
            showAlert('Gagal Menyimpan', err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, stock: Stock) => {
        const confirmed = await showConfirm('Hapus Penugasan', 'Apakah Anda yakin ingin menghapus penugasan ini? Stok akan dikembalikan ke gudang.');
        if (confirmed) {
            await deleteAssignment(id);
            // Refresh stock from server (backend auto-returned stock)
            await fetchStock();
            notify('Penugasan dihapus dan stok dikembalikan.', 'info');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Manajemen Penugasan</h1>
                    <p className="text-slate-500 text-sm">Monitoring dan history penugasan armada.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-[var(--indomaret-blue)] outline-none"
                        />
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="btn-primary flex items-center gap-2 py-3 px-6 shadow-lg shadow-blue-500/20 whitespace-nowrap"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">Buat Penugasan</span>
                        <span className="sm:hidden">Buat</span>
                    </button>
                </div>
            </div>

            {/* LIST ASSIGNMENTS */}
            {isLoading && assignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <div className="w-12 h-12 border-4 border-[var(--indomaret-blue)] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Memuat Data Penugasan...</p>
                </div>
            ) : filteredAssignments.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-slate-400 font-bold">Belum ada penugasan untuk tanggal ini.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredAssignments.map(assign => (
                        <div key={assign.id} className="glass-card p-6 space-y-4 border-l-4 border-l-[var(--indomaret-blue)] hover:border-l-[var(--indomaret-red)] transition-all group">
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">{assign.date}</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${assign.status === 'Active' ? 'bg-green-100 text-green-700' :
                                            assign.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                                                'bg-amber-100 text-amber-700'
                                        }`}>
                                        {assign.status === 'Active' ? 'Sedang Jalan' :
                                            assign.status === 'Completed' ? 'Selesai' : 'Siap'}
                                    </span>
                                    <button
                                        onClick={() => openModal(assign)}
                                        className="p-1 text-[var(--indomaret-blue)] hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                        title="Edit Penugasan"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(assign.id, assign.initialStock)}
                                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Hapus Penugasan"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <Truck size={18} className="text-slate-400 group-hover:text-[var(--indomaret-blue)] transition-colors" />
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{vehicles.find(v => v.nopol === assign.vehicleId)?.description} ({assign.vehicleId})</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Users size={18} className="text-slate-400 group-hover:text-[var(--indomaret-blue)] transition-colors" />
                                    <div className="text-sm">
                                        <p><span className="text-slate-500">Kasir:</span> {assign.cashier?.full_name || users.find(u => u.nik === assign.cashierId)?.full_name || assign.cashierId}</p>
                                        <p><span className="text-slate-500">Supir:</span> {assign.driver?.full_name || users.find(u => u.nik === assign.driverId)?.full_name || assign.driverId}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Coins size={18} className="text-slate-400 group-hover:text-[var(--indomaret-blue)] transition-colors" />
                                    <p className="font-bold text-[var(--indomaret-blue)]">
                                        Rp {Object.entries(assign.initialStock).reduce((acc, [d, q]) => acc + (parseInt(d) * q), 0).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">
                                        {assign.storeCodes?.length || 0}
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Toko Terdaftar</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CREATE/EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="text-xl font-black">{editingAssignment ? 'Edit Penugasan' : 'Buat Penugasan Baru'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500">Pilih Kasir</label>
                                    <select
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold"
                                        value={selectedCashier}
                                        onChange={e => setSelectedCashier(e.target.value)}
                                    >
                                        <option value="">-- Pilih Kasir --</option>
                                        {cashiers.map(u => <option key={u.nik} value={u.nik}>{u.full_name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500">Pilih Supir</label>
                                    <select
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold"
                                        value={selectedDriver}
                                        onChange={e => setSelectedDriver(e.target.value)}
                                    >
                                        <option value="">-- Pilih Supir --</option>
                                        {drivers.map(u => <option key={u.nik} value={u.nik}>{u.full_name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500">Pilih Armada</label>
                                    <select
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold"
                                        value={selectedVehicle}
                                        onChange={e => setSelectedVehicle(e.target.value)}
                                    >
                                        <option value="">-- Pilih Armada --</option>
                                        {availableVehicles.map(v => <option key={v.nopol} value={v.nopol}>{v.nopol} - {v.description}</option>)}
                                    </select>
                                </div>
                            </div>


                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg flex items-center gap-2">
                                            <Coins size={20} className="text-[var(--indomaret-blue)]" />
                                            Distribusi Modal Awal
                                        </h3>
                                        {editingAssignment && (
                                            <p className="text-xs text-amber-600 font-bold mt-1">
                                                [!IMPORTANT] Modal awal tidak dapat diubah setelah penugasan dibuat untuk menjaga konsistensi stok gudang.
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400 font-bold uppercase">Total Modal</p>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white">Rp {totalModal.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {denoms.map(denom => (
                                        <div key={denom} className="space-y-1">
                                            <label className="text-xs font-bold text-slate-400">Pecahan {denom.toLocaleString()}</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Rp</span>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={nominalInputs[denom] || ''}
                                                    disabled={!!editingAssignment}
                                                    className={`w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2 pl-8 pr-3 text-sm font-bold tabular-nums focus:ring-2 focus:ring-[var(--indomaret-blue)] ${editingAssignment ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    placeholder="0"
                                                    onChange={(e) => handleStockChange(denom, e.target.value)}
                                                />
                                            </div>
                                            <p className="text-[10px] text-right text-slate-500">
                                                {(initialStock[denom] || 0).toLocaleString()} {denom >= 2000 ? 'lbr' : 'kpg'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-8 space-y-4">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Truck size={20} className="text-indigo-600" />
                                    Perencanaan Rute (List Toko)
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Cari & Tambah Toko</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Nama atau Kode Toko..."
                                                value={storeSearch}
                                                onChange={(e) => setStoreSearch(e.target.value)}
                                                className="w-full pl-4 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold border-none outline-none ring-2 ring-transparent focus:ring-indigo-500 shadow-sm text-sm"
                                            />
                                            {storeSearch && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 max-h-60 overflow-y-auto custom-scrollbar z-[70]">
                                                    {filteredStores.length === 0 ? (
                                                        <div className="p-4 text-center text-slate-400 text-xs font-black uppercase tracking-widest">Tidak Ditemukan</div>
                                                    ) : (
                                                        filteredStores.map(store => (
                                                            <button
                                                                key={store.code}
                                                                onClick={() => addStoreToRoute(store.code)}
                                                                className="w-full p-4 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex justify-between items-center transition-colors group border-b border-slate-50 dark:border-slate-700/50 last:border-none"
                                                            >
                                                                <div>
                                                                    <p className="font-black text-slate-800 dark:text-slate-200 text-xs uppercase">{store.name}</p>
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{store.code} • {store.branch}</p>
                                                                </div>
                                                                <Plus size={16} className="text-indigo-500" />
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Urutan Kunjungan ({selectedStoreCodes.length})</label>
                                        {selectedStoreCodes.length === 0 ? (
                                            <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-700">
                                                <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">List Masih Kosong</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                                {selectedStoreCodes.map((code, index) => {
                                                    const store = stores.find(s => s.code === code);
                                                    if (!store) return null;
                                                    return (
                                                        <div key={code} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-indigo-200 transition-all">
                                                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 font-bold text-[10px]">
                                                                {index + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-black text-[11px] text-slate-900 dark:text-white truncate uppercase tracking-tight">{store.name}</h4>
                                                                <p className="text-[9px] text-slate-400 truncate font-black uppercase tracking-tighter opacity-60">{store.code}</p>
                                                            </div>
                                                            <button onClick={() => removeStoreFromRoute(code)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 transition-all">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                            <button
                                onClick={handleFormSubmit}
                                disabled={isSubmitting}
                                className={`btn-primary py-3 px-8 flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Check size={20} />
                                )}
                                <span>{editingAssignment ? 'Update Penugasan' : 'Simpan & Tugaskan'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
