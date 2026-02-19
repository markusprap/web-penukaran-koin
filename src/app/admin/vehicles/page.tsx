'use client';

import {
    Truck,
    Search,
    Plus,
    Edit,
    Trash2,
    X,
    Save,
    Tag,
    ClipboardList,
    Check,
    MapPin,
    Eye,
    AlertTriangle,
    Info
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useMasterDataStore, Vehicle as VehicleType, RouteAssignment } from '@/store/useMasterDataStore';
import { useRouter } from 'next/navigation';

export default function AdminVehiclesPage() {
    const router = useRouter();

    const { vehicles, addVehicle, updateVehicle, deleteVehicle, stores, assignRoute, routes } = useMasterDataStore();

    // ==========================================
    // CUSTOM ALERTS & MODALS STATE
    // ==========================================
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

    // ==========================================
    // VEHICLE MASTER (CRUD)
    // ==========================================
    const [searchTerm, setSearchTerm] = useState('');
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);

    const initialFormState: VehicleType = {
        id: '',
        nopol: '',
        brand: '',
        type: '',
        description: ''
    };
    const [formData, setFormData] = useState<VehicleType>(initialFormState);

    const filteredVehicles = useMemo(() => {
        return vehicles.filter(v =>
            v.nopol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [vehicles, searchTerm]);

    const openAddVehicleModal = () => {
        setIsEditMode(false);
        setFormData({ ...initialFormState, id: `v-${Date.now()}` });
        setIsVehicleModalOpen(true);
    };

    const openEditModal = (vehicle: VehicleType) => {
        setIsEditMode(true);
        setSelectedVehicle(vehicle);
        setFormData({ ...vehicle });
        setIsVehicleModalOpen(true);
    };

    const openDeleteModal = (vehicle: VehicleType) => {
        setSelectedVehicle(vehicle);
        setIsDeleteModalOpen(true);
    };

    const [processing, setProcessing] = useState(false);

    const handleVehicleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nopol || !formData.brand) {
            showAlert('Input Error', 'Nomor Polisi dan Merk Kendaraan wajib diisi!', 'error');
            return;
        }
        setProcessing(true);
        try {
            if (isEditMode && selectedVehicle) {
                await updateVehicle(selectedVehicle.id, formData);
                showAlert('Berhasil', 'Data kendaraan berhasil diperbarui.', 'success');
            } else {
                await addVehicle(formData);
                showAlert('Berhasil', 'Kendaraan baru berhasil ditambahkan.', 'success');
            }
            setIsVehicleModalOpen(false);
        } catch (err: any) {
            showAlert('Gagal', err.message || 'Gagal menyimpan data kendaraan.', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const confirmDeleteVehicle = async () => {
        if (selectedVehicle) {
            setProcessing(true);
            try {
                await deleteVehicle(selectedVehicle.id);
                setIsDeleteModalOpen(false);
                setSelectedVehicle(null);
                showAlert('Terhapus', 'Unit kendaraan telah dihapus permanent.', 'success');
            } catch (err: any) {
                showAlert('Gagal', err.message || 'Gagal menghapus kendaraan.', 'error');
            } finally {
                setProcessing(false);
            }
        }
    };

    // ==========================================
    // VIEW ROUTE (Condensed Table UI)
    // ==========================================
    const [viewRouteModalOpen, setViewRouteModalOpen] = useState(false);
    const [viewRouteData, setViewRouteData] = useState<{ vehicle: VehicleType, stores: any[], activeRoute?: any } | null>(null);
    const [routeInternalSearch, setRouteInternalSearch] = useState('');

    const openViewRoute = (vehicle: VehicleType) => {
        const activeRoute = routes.find(r => r.vehicleId === vehicle.nopol && r.status !== 'Completed');

        if (!activeRoute) {
            showAlert('Info Rute', 'Tidak ada jadwal rute aktif untuk armada ini.', 'info');
            return;
        }

        const routeStores = activeRoute.storeCodes.map(code => stores.find(s => s.code === code)).filter(Boolean);

        setViewRouteData({
            vehicle: vehicle,
            stores: routeStores,
            activeRoute: activeRoute
        });
        setViewRouteModalOpen(true);
    };


    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Master Armada</h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-70">Fleet Management & Route Planner</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={openAddVehicleModal}
                        className="btn-primary flex items-center gap-2 py-3 px-6 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        <Plus size={20} />
                        <span className="uppercase text-xs font-black tracking-widest">Tambah Unit</span>
                    </button>
                </div>
            </div>

            {/* VEHICLE LIST */}
            <div className="space-y-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari Nopol, Merk, atau Tipe..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[var(--indomaret-blue)] outline-none font-bold text-sm shadow-sm transition-all"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVehicles.map(vehicle => {
                        const hasActiveRoute = routes.some(r => r.vehicleId === vehicle.nopol && r.status !== 'Completed');
                        return (
                            <div key={vehicle.id} className="glass-card p-6 flex flex-col justify-between group hover:border-[var(--indomaret-blue)] transition-all relative overflow-hidden active:scale-[0.98]">
                                {hasActiveRoute && (
                                    <div className="absolute top-0 right-0">
                                        <div className="bg-green-500 text-white text-[8px] font-black px-4 py-1 rotate-45 translate-x-3 translate-y-1 shadow-sm uppercase tracking-widest animate-pulse">On Task</div>
                                    </div>
                                )}
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-[var(--indomaret-blue)]">
                                            <Truck size={24} />
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditModal(vehicle)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-blue-600 transition-colors">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => openDeleteModal(vehicle)} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500 hover:text-red-600 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight">{vehicle.nopol}</h3>
                                    <p className="text-slate-500 font-bold text-sm mb-4 uppercase text-[11px] tracking-tight">{vehicle.brand} • {vehicle.type}</p>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 py-2 px-3 rounded-lg w-fit mb-4 uppercase tracking-wider">
                                        <Tag size={12} />
                                        {vehicle.description}
                                    </div>

                                    <button
                                        onClick={() => openViewRoute(vehicle)}
                                        className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-[11px] font-black border transition-all uppercase tracking-widest ${hasActiveRoute
                                            ? 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white dark:bg-indigo-900/20 dark:border-indigo-800'
                                            : 'bg-slate-50 border-slate-100 text-slate-300 dark:bg-slate-800 dark:border-slate-700 cursor-not-allowed'
                                            }`}
                                        disabled={!hasActiveRoute}
                                    >
                                        {hasActiveRoute ? <MapPin size={14} /> : <Eye size={14} />}
                                        <span>{hasActiveRoute ? 'Monitoring Rute' : 'Belum Ada Rute'}</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL: VIEW ROUTE */}
            {viewRouteModalOpen && viewRouteData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] scale-in">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-[var(--indomaret-blue)] text-white">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <Truck size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black italic tracking-tighter uppercase">{viewRouteData.vehicle.nopol}</h2>
                                    <p className="text-[10px] text-blue-100 font-black uppercase tracking-widest">Rute Kunjungan Aktif</p>
                                </div>
                            </div>
                            <button onClick={() => setViewRouteModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
                                <X size={28} />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-hidden flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400">Total Kunjungan: </span>
                                    <span className="text-[var(--indomaret-blue)] text-sm ml-1">{viewRouteData.stores.length} Unit</span>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari di rute ini..."
                                        value={routeInternalSearch}
                                        onChange={(e) => setRouteInternalSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-[11px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-[var(--indomaret-blue)] transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-50 dark:border-slate-800 rounded-2xl">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 z-10 shadow-sm">
                                        <tr>
                                            <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 w-16 text-center">No</th>
                                            <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 w-24">Kode</th>
                                            <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Nama Toko</th>
                                            <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 hidden md:table-cell">Alamat</th>
                                            <th className="p-4 text-[9px] font-black text-blue-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 w-24 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {viewRouteData.stores
                                            .filter(s => s.name.toLowerCase().includes(routeInternalSearch.toLowerCase()) || s.code.toLowerCase().includes(routeInternalSearch.toLowerCase()))
                                            .map((store: any, index: number) => (
                                                <tr key={store.code} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                                    <td className="p-3">
                                                        <div className="flex justify-center">
                                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 font-bold text-[9px]">
                                                                {index + 1}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-[10px] font-black text-slate-900 dark:text-white tabular-nums uppercase">{store.code}</td>
                                                    <td className="p-3">
                                                        <div>
                                                            <p className="font-black text-[11px] text-slate-800 dark:text-white uppercase line-clamp-1">{store.name}</p>
                                                            <p className="text-[9px] text-slate-400 font-black md:hidden line-clamp-1 italic uppercase">{store.address}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 hidden md:table-cell">
                                                        <p className="text-[10px] font-bold text-slate-500 line-clamp-1 italic">{store.address}</p>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {index < (viewRouteData.activeRoute?.currentStopIndex || 0) ? (
                                                            <span className="text-[9px] font-black px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-full tracking-widest whitespace-nowrap">DONE</span>
                                                        ) : (
                                                            <span className="text-[9px] font-black px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-full tracking-widest">WAIT</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-50 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-900/50">
                            <button onClick={() => setViewRouteModalOpen(false)} className="text-[9px] font-black text-[var(--indomaret-blue)] hover:underline uppercase tracking-widest transition-all">Tutup Preview</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: VEHICLE CRUD */}
            {isVehicleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-xl overflow-hidden scale-in">
                        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-900 text-white">
                            <h2 className="text-xl font-black uppercase tracking-tighter italic">{isEditMode ? 'Update Unit' : 'Registrasi Unit'}</h2>
                            <button onClick={() => setIsVehicleModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleVehicleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nomor Polisi</label>
                                <input type="text" value={formData.nopol} onChange={e => setFormData({ ...formData, nopol: e.target.value.toUpperCase() })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-black border-none focus:ring-2 focus:ring-[var(--indomaret-blue)] text-sm shadow-inner uppercase" placeholder="B 1234 XYZ" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Merk / Brand</label>
                                <input type="text" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-black border-none focus:ring-2 focus:ring-[var(--indomaret-blue)] text-sm shadow-inner uppercase" placeholder="Daihatsu / Toyota" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe Unit</label>
                                <input type="text" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-black border-none focus:ring-2 focus:ring-[var(--indomaret-blue)] text-sm shadow-inner uppercase" placeholder="Grand Max / L300" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan Spesifikasi</label>
                                <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-black border-none focus:ring-2 focus:ring-[var(--indomaret-blue)] text-sm shadow-inner uppercase" placeholder="Blind Van / Box" />
                            </div>
                            <button type="submit" className="w-full btn-primary py-4 mt-4 flex justify-center gap-2 bg-slate-900 hover:bg-black transition-all shadow-xl active:scale-95">
                                <Save size={18} /> <span className="uppercase font-black tracking-widest text-[11px]">Simpan Perubahan</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CUSTOM CONFIRM DELETE */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-8 text-center space-y-4 shadow-2xl scale-in">
                        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-inner">
                            <Trash2 size={48} />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic">Hapus Unit?</h2>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-wider leading-relaxed opacity-70">
                            Unit <span className="text-red-600 underline">{selectedVehicle?.nopol}</span> akan dihapus dari database. Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex flex-col gap-3 pt-6">
                            <button onClick={confirmDeleteVehicle} className="w-full py-4 font-black text-[11px] uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 rounded-xl transition-all shadow-lg active:scale-95">Konfirmasi Hapus</button>
                            <button onClick={() => setIsDeleteModalOpen(false)} className="w-full py-4 font-black text-[11px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">Batalkan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: CUSTOM ALERT (Success / Error / Info) */}
            {alertConfig.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-8 text-center space-y-4 shadow-2xl relative overflow-hidden scale-in">
                        <div className={`absolute top-0 left-0 right-0 h-2 ${alertConfig.type === 'success' ? 'bg-green-500' :
                            alertConfig.type === 'error' ? 'bg-red-500' :
                                alertConfig.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                            }`} />

                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ${alertConfig.type === 'success' ? 'bg-green-50 text-green-600' :
                            alertConfig.type === 'error' ? 'bg-red-50 text-red-600' :
                                alertConfig.type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                            {alertConfig.type === 'success' && <Check size={56} strokeWidth={3} />}
                            {alertConfig.type === 'error' && <X size={56} strokeWidth={3} />}
                            {alertConfig.type === 'warning' && <AlertTriangle size={56} strokeWidth={3} />}
                            {alertConfig.type === 'info' && <Info size={56} strokeWidth={3} />}
                        </div>

                        <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white italic">{alertConfig.title}</h2>
                        <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest leading-relaxed opacity-80">{alertConfig.message}</p>

                        <div className="pt-6">
                            <button
                                onClick={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                                className={`w-full py-4 font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-95 ${alertConfig.type === 'success' ? 'bg-green-500 hover:bg-green-600 text-white' :
                                    alertConfig.type === 'error' ? 'bg-red-500 hover:bg-red-600 text-white' :
                                        alertConfig.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-white' :
                                            'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    }`}
                            >
                                Oke, Mengerti
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
