'use client';

import {
    UserPlus,
    Search,
    Edit,
    Trash2,
    CheckCircle,
    Shield,
    Filter,
    X,
    Save,
    User,
    Key,
    Briefcase,
    BadgeCheck,
    AlertTriangle
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useMasterDataStore, User as UserType } from '@/store/useMasterDataStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminUsers() {
    const { users, addUser, updateUser, deleteUser, resetSystemData } = useMasterDataStore();
    const { user: currentUser } = useAuthStore();
    const { notify, showAlert } = useNotificationStore();
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

    // Form State
    const initialFormState: UserType = {
        nik: '',
        full_name: '',
        password: '',
        role: 'FIELD',
        position: 'CASHIER'
    };
    const [formData, setFormData] = useState<UserType>(initialFormState);

    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.nik.includes(searchTerm)
        );
    }, [users, searchTerm]);

    const openAddModal = () => {
        setIsEditMode(false);
        setFormData(initialFormState);
        setIsModalOpen(true);
    };

    const openEditModal = (user: UserType) => {
        setIsEditMode(true);
        setSelectedUser(user);
        setFormData({ ...user });
        setIsModalOpen(true);
    };

    const openDeleteModal = (user: UserType) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nik || !formData.full_name || !formData.password) {
            notify('Semua field wajib diisi!', 'warning');
            return;
        }

        setIsProcessing(true);
        try {
            if (isEditMode && selectedUser) {
                await updateUser(selectedUser.nik, formData);
            } else {
                // Check duplicate NIK
                if (users.some(u => u.nik === formData.nik)) {
                    notify('NIK sudah terdaftar!', 'error');
                    setIsProcessing(false);
                    return;
                }
                await addUser(formData);
            }
            setIsModalOpen(false);
            notify(isEditMode ? 'Data petugas diperbarui!' : 'Petugas baru berhasil ditambahkan!', 'success');
        } catch (err: any) {
            showAlert('Gagal Menyimpan', err.message || 'Gagal menyimpan data.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const confirmDelete = async () => {
        if (selectedUser) {
            setIsProcessing(true);
            try {
                await deleteUser(selectedUser.nik);
                setIsDeleteModalOpen(false);
                setSelectedUser(null);
                notify('Data petugas berhasil dihapus.', 'info');
            } catch (err: any) {
                showAlert('Gagal Menghapus', err.message || 'Gagal menghapus data.', 'error');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleResetData = async () => {
        setIsProcessing(true);
        try {
            await resetSystemData();
            setIsResetModalOpen(false);
            notify('Data sistem berhasil di-reset!', 'success');
        } catch (err: any) {
            showAlert('Gagal Reset Data', err.message || 'Terjadi kesalahan saat mereset data.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Manajemen User</h1>
                    <p className="text-slate-500 text-sm">Kelola akses, peran, dan data petugas lapangan dalam format tabel.</p>
                </div>
                <div className="flex gap-3">
                    {currentUser?.role === 'SUPER_ADMIN' && (
                        <button
                            onClick={() => setIsResetModalOpen(true)}
                            className="flex items-center gap-2 py-3 px-6 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-xl font-bold hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                        >
                            <AlertTriangle size={20} />
                            <span>Reset Data</span>
                        </button>
                    )}
                    <button
                        onClick={openAddModal}
                        className="btn-primary flex items-center gap-2 py-3 px-6 shadow-lg shadow-blue-500/20"
                    >
                        <UserPlus size={20} />
                        <span>Tambah User Baru</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari Nama atau NIK..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[var(--indomaret-blue)] transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-500">
                    <Filter size={18} />
                    <span>Filter Role</span>
                </button>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-5">Nama & NIK</th>
                                <th className="px-6 py-5">Role</th>
                                <th className="px-6 py-5">Jabatan</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((u) => (
                                    <tr key={u.nik} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 font-bold group-hover:bg-[var(--indomaret-blue)] group-hover:text-white transition-all">
                                                    {u.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">{u.full_name}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase font-medium">NIK: {u.nik}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase 
                                                ${u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                                                    u.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-blue-100 text-blue-700'}`}>
                                                {u.role === 'SUPER_ADMIN' ? 'Super Admin' :
                                                    u.role === 'ADMIN' ? 'Admin Finance' :
                                                        'Field Staff'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400 capitalize">
                                            {u.position}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-bold">
                                                <CheckCircle size={14} />
                                                Aktif
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(u)}
                                                    className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-[var(--indomaret-blue)] shadow-sm transition-all border border-transparent hover:border-slate-100"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(u)}
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
                                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">
                                        User tidak ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ADD / EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                {isEditMode ? <Edit size={20} className="text-[var(--indomaret-blue)]" /> : <UserPlus size={20} className="text-[var(--indomaret-blue)]" />}
                                {isEditMode ? 'Edit Data User' : 'Tambah User Baru'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">NIK (Nomor Induk)</label>
                                    <div className="relative">
                                        <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-[var(--indomaret-blue)]"
                                            placeholder="Ex: 12345"
                                            value={formData.nik}
                                            onChange={e => setFormData({ ...formData, nik: e.target.value })}
                                            disabled={isEditMode}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[var(--indomaret-blue)]"
                                            placeholder="Password Akses"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Nama Lengkap</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-[var(--indomaret-blue)]"
                                        placeholder="Nama Lengkap Petugas"
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Role System</label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-[var(--indomaret-blue)] appearance-none"
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                        >
                                            <option value="SUPER_ADMIN">Super Admin (Full)</option>
                                            <option value="ADMIN">Admin Finance (Limited)</option>
                                            <option value="FIELD">Field Staff (Mobile)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Jabatan</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-[var(--indomaret-blue)] appearance-none"
                                            value={formData.position}
                                            onChange={e => setFormData({ ...formData, position: e.target.value as any })}
                                        >
                                            <option value="DRIVER">Driver</option>
                                            <option value="CASHIER">Cashier</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </div>
                                </div>
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
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Hapus User?</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            Anda yakin ingin menghapus user <span className="font-bold text-slate-900 dark:text-white">{selectedUser?.full_name}</span>? Tindakan ini tidak dapat dibatalkan.
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

            {/* RESET DATA CONFIRM MODAL */}
            {isResetModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-8 text-center border-2 border-red-100 dark:border-red-900/30">
                        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-red-50/50 dark:ring-red-900/10">
                            <AlertTriangle size={40} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Reset Seluruh Data?</h3>
                        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl mb-6">
                            <p className="text-red-600 dark:text-red-400 text-sm font-bold leading-relaxed">
                                PERINGATAN: Tindakan ini akan menghapus SEMUA data Transaksi, Stok, dan Rute.
                            </p>
                            <p className="text-slate-500 text-xs mt-2">
                                Data User (Petugas) dan Toko (Master) TIDAK akan dihapus.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsResetModalOpen(false)}
                                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors uppercase tracking-widest text-xs"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleResetData}
                                disabled={isProcessing}
                                className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-500/30 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                            >
                                {isProcessing ? 'Processing...' : 'Ya, Reset Data'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
