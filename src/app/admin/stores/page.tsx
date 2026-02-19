'use client';

import {
    Store,
    Upload,
    Search,
    Plus,
    Edit,
    Trash2,
    Download,
    Filter,
    CheckCircle,
    X,
    Save,
    MapPin,
    User,
    Building2
} from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import { useMasterDataStore, Store as StoreType } from '@/store/useMasterDataStore';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function AdminStores() {
    const { stores, addStore, updateStore, deleteStore } = useMasterDataStore();
    const { notify, showAlert } = useNotificationStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);

    // Form State
    const initialFormState = {
        code: '',
        name: '',
        area_spv: '',
        area_mgr: '',
        address: '',
        branch: 'Jombang 1 (G148)' // Default
    };
    const [formData, setFormData] = useState(initialFormState);

    const filteredStores = useMemo(() => {
        // Reset page when search changes
        setCurrentPage(1);
        return stores.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.area_spv.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.area_mgr.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [stores, searchTerm]);

    const totalPages = Math.ceil(filteredStores.length / pageSize);
    const paginatedStores = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredStores.slice(start, start + pageSize);
    }, [filteredStores, currentPage, pageSize]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCsvUpload = () => {
        fileInputRef.current?.click();
    };

    const [processing, setProcessing] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            let successCount = 0;

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Simple regex to handle commas inside quotes if they exist
                const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

                const cleanValue = (val: string) => {
                    let v = val?.trim() || '';
                    if (v.startsWith('"') && v.endsWith('"')) {
                        v = v.substring(1, v.length - 1).replace(/""/g, '"');
                    }
                    return v;
                };

                if (cols.length >= 2) {
                    const code = cleanValue(cols[0]);
                    const name = cleanValue(cols[1]);
                    if (stores.some(s => s.code === code)) continue;

                    const newStore: StoreType = {
                        code: code,
                        name: name,
                        area_spv: cleanValue(cols[2]),
                        area_mgr: cleanValue(cols[3]),
                        address: cleanValue(cols[4]),
                        branch: cleanValue(cols[5]) || 'Jombang 1 (G148)'
                    };
                    try {
                        await addStore(newStore);
                        successCount++;
                    } catch (err: any) {
                        showAlert('Gagal Menambahkan Toko', `Gagal menambahkan toko ${code}: ${err.message || 'Terjadi kesalahan.'}`, 'error');
                    }
                }
            }

            setIsUploading(false);
            notify(`Berhasil mengunggah ${successCount} toko baru dari CSV!`, 'success');
            e.target.value = ''; // Reset input
        };
        reader.readAsText(file);
    };

    const downloadTemplate = () => {
        const headers = "KODE,NAMA,AREA_SPV,AREA_MGR,ALAMAT,CABANG";
        const example = "TRBC,Indomaret Tembelang,Bagus Sujatmiko,Hendra Wijaya,Jl. Raya Tembelang,Jombang 1 (G148)";
        const blob = new Blob([`${headers}\n${example}`], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "template_toko.csv";
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const openAddModal = () => {
        setIsEditMode(false);
        setFormData(initialFormState);
        setIsModalOpen(true);
    };

    const openEditModal = (store: StoreType) => {
        setIsEditMode(true);
        setSelectedStore(store);
        setFormData({
            code: store.code,
            name: store.name,
            area_spv: store.area_spv,
            area_mgr: store.area_mgr,
            address: store.address,
            branch: store.branch || 'Jombang 1 (G148)'
        });
        setIsModalOpen(true);
    };

    const openDeleteModal = (store: StoreType) => {
        setSelectedStore(store);
        setIsDeleteModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.code || !formData.name) {
            notify('Kode dan Nama Toko wajib diisi!', 'warning');
            return;
        }

        try {
            if (isEditMode && selectedStore) {
                await updateStore(selectedStore.code, formData);
            } else {
                // Check duplicate code
                if (stores.some(s => s.code === formData.code)) {
                    notify('Kode Toko sudah ada!', 'error');
                    return;
                }
                await addStore(formData);
            }
            setIsModalOpen(false);
            notify(isEditMode ? 'Data toko berhasil diperbarui!' : 'Toko baru berhasil didaftarkan!', 'success');
        } catch (err: any) {
            showAlert('Gagal Menyimpan', err.message || 'Gagal menyimpan data.', 'error');
        }
    };

    const confirmDelete = async () => {
        if (selectedStore) {
            try {
                await deleteStore(selectedStore.code);
                setIsDeleteModalOpen(false);
                setSelectedStore(null);
                notify('Toko berhasil dihapus.', 'info');
            } catch (err: any) {
                showAlert('Gagal Menghapus', err.message || 'Gagal menghapus data toko.', 'error');
            }
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Master Toko</h1>
                    <p className="text-slate-500 text-sm">Kelola database outlet, area supervisor, dan area manager.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleCsvUpload}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
                    >
                        {isUploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Upload size={18} />}
                        <span>{isUploading ? 'Mengunggah...' : 'Upload CSV'}</span>
                    </button>
                    <button
                        onClick={openAddModal}
                        className="btn-primary flex items-center gap-2 py-3 px-6 shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={20} />
                        <span>Tambah Toko</span>
                    </button>
                </div>
            </div>

            {/* Stats Quick View */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-[var(--indomaret-blue)] rounded-2xl">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Toko</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">{stores.length} Outlet</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-2xl">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Data</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">Sinkron</p>
                    </div>
                </div>
                <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 flex flex-col justify-center">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400">Template CSV</span>
                        <button
                            onClick={downloadTemplate}
                            className="text-[10px] font-black text-blue-400 flex items-center gap-1 hover:underline"
                        >
                            <Download size={12} /> DOWNLOAD
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">Kolom: [KODE, NAMA, AREA_SPV, AREA_MGR, ALAMAT, CABANG]</p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".csv"
                        onChange={handleFileChange}
                    />
                </div>
            </div>

            {/* Filter & Search */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari Toko, KODE, AS, atau AM..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[var(--indomaret-blue)] transition-all"
                    />
                </div>
            </div>

            {/* Stores Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-5">Kode</th>
                                <th className="px-6 py-5">Nama Toko</th>
                                <th className="px-6 py-5">Area Supervisor (AS)</th>
                                <th className="px-6 py-5">Area Manager (AM)</th>
                                <th className="px-6 py-5">Alamat</th>
                                <th className="px-6 py-5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                            {paginatedStores.length > 0 ? (
                                paginatedStores.map((s) => (
                                    <tr key={s.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-black text-[10px] text-[var(--indomaret-blue)] bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg uppercase whitespace-nowrap">
                                                {s.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900 dark:text-white leading-tight">{s.name}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-700 dark:text-slate-300">{s.area_spv}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-700 dark:text-slate-300">{s.area_mgr}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[200px]" title={s.address}>{s.address}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(s)}
                                                    className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-[var(--indomaret-blue)] shadow-sm transition-all border border-transparent hover:border-slate-100"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(s)}
                                                    className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-500 shadow-sm transition-all border border-transparent hover:border-slate-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic font-medium">
                                        Toko tidak ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {filteredStores.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Showing <span className="text-slate-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-slate-900 dark:text-white">{Math.min(currentPage * pageSize, filteredStores.length)}</span> of <span className="text-slate-900 dark:text-white">{filteredStores.length}</span> Outlet
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            </button>

                            <div className="flex items-center">
                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    // Complex logic to show only few pages if there are many
                                    if (
                                        totalPages <= 7 ||
                                        pageNum === 1 ||
                                        pageNum === totalPages ||
                                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all ${currentPage === pageNum
                                                    ? 'bg-[var(--indomaret-blue)] text-white shadow-md shadow-blue-500/20'
                                                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    } else if (
                                        (pageNum === 2 && currentPage > 3) ||
                                        (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                                    ) {
                                        return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                                    }
                                    return null;
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ADD / EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                {isEditMode ? <Edit size={20} className="text-[var(--indomaret-blue)]" /> : <Plus size={20} className="text-[var(--indomaret-blue)]" />}
                                {isEditMode ? 'Edit Data Toko' : 'Tambah Toko Baru'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Kode Toko</label>
                                    <div className="relative">
                                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-[var(--indomaret-blue)] uppercase"
                                            placeholder="Cth: TRBC"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            disabled={isEditMode}
                                            required
                                            maxLength={4}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Cabang</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-[var(--indomaret-blue)] appearance-none"
                                            value={formData.branch}
                                            onChange={e => setFormData({ ...formData, branch: e.target.value })}
                                        >
                                            <option value="Jombang 1 (G148)">Jombang 1 (G148)</option>
                                            <option value="Jombang 2 (G261)">Jombang 2 (G261)</option>
                                        </select>
                                    </div>
                                </div>                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Nama Toko</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[var(--indomaret-blue)]"
                                    placeholder="Nama Lengkap Toko"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Area SPV (AS)</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[var(--indomaret-blue)]"
                                            placeholder="Nama AS"
                                            value={formData.area_spv}
                                            onChange={e => setFormData({ ...formData, area_spv: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Area MGR (AM)</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[var(--indomaret-blue)]"
                                            placeholder="Nama AM"
                                            value={formData.area_mgr}
                                            onChange={e => setFormData({ ...formData, area_mgr: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Alamat Lengkap</label>
                                <textarea
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[var(--indomaret-blue)] min-h-[80px] resize-none"
                                    placeholder="Alamat toko..."
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-[var(--indomaret-blue)] text-white font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Simpan Data
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRM MODAL */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Hapus Toko?</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            Anda yakin ingin menghapus toko <span className="font-bold text-slate-900 dark:text-white">{selectedStore?.name}</span>? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
