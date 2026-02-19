'use client';

import { useState, useEffect } from 'react';
import { useAuthStore, Position } from '@/store/useAuthStore';
import { useAssignmentStore, Assignment } from '@/store/useAssignmentStore';
import { useMasterDataStore } from '@/store/useMasterDataStore';
import { useRouter } from 'next/navigation';
import { Truck, Users, ArrowRight, ShieldCheck, Coins, AlertCircle } from 'lucide-react';
import { useHydration } from '@/hooks/useHydration';

export default function SessionSetup() {
    const { user, setSessionDetails } = useAuthStore();
    const { getActiveAssignmentByUser } = useAssignmentStore();
    const { vehicles } = useMasterDataStore();
    const router = useRouter();

    const [assignment, setAssignment] = useState<Assignment | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAssignments = useAssignmentStore(state => state.fetchAssignments);
    const hydrated = useHydration();

    useEffect(() => {
        if (!hydrated) return;
        if (!user) {
            router.push('/app/login');
            return;
        }

        const syncAndCheck = async () => {
            setIsLoading(true);
            try {
                // Force sync with server to get latest assignment
                await fetchAssignments();

                const activeAssign = getActiveAssignmentByUser(user.nik);
                setAssignment(activeAssign);
            } catch (error) {
                console.error('Failed to sync assignments:', error);
            } finally {
                setIsLoading(false);
            }
        };

        syncAndCheck();
    }, [user, router, getActiveAssignmentByUser, fetchAssignments, hydrated]);

    const [isStarting, setIsStarting] = useState(false);
    const updateAssignment = useAssignmentStore(state => state.updateAssignment);

    const handleStart = async () => {
        if (assignment && user) {
            setIsStarting(true);
            try {
                // Determine Role based on assignment
                const role: Position = assignment.driverId === user.nik ? 'DRIVER' : 'CASHIER';

                // Transition Status to Active if it's currently Ready
                if (assignment.status === 'Ready') {
                    await updateAssignment(assignment.id, { status: 'Active' });
                }

                // Set Session (Vehicle & Role from Assignment)
                setSessionDetails(assignment.vehicleId, role);

                // For now just redirect
                router.push('/app/dashboard');
            } catch (error) {
                console.error('Failed to start assignment:', error);
            } finally {
                setIsStarting(false);
            }
        }
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (!assignment) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex items-center justify-center">
                <div className="max-w-md w-full glass-card p-8 text-center space-y-6">
                    <div className="inline-flex p-4 bg-red-100 text-red-600 rounded-full">
                        <AlertCircle size={48} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Tidak Ada Penugasan</h1>
                        <p className="text-slate-500 mt-2">
                            Halo {user?.full_name}, Anda belum memiliki jadwal tugas aktif hari ini. Silakan hubungi Admin Operasional.
                        </p>
                    </div>
                    <button onClick={() => window.location.reload()} className="btn-secondary w-full">
                        Cek Lagi
                    </button>
                </div>
            </div>
        );
    }

    const vehicleInfo = vehicles.find(v => v.nopol === assignment.vehicleId);
    const role = assignment.driverId === user?.nik ? 'Supir' : 'Kasir';
    const totalModal = Object.entries(assignment.initialStock).reduce((acc, [d, q]) => acc + (parseInt(d) * q), 0);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex items-center justify-center">
            <div className="max-w-xl w-full space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full mb-4">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Konfirmasi Tugas</h1>
                    <p className="text-slate-500">Sistem mendeteksi jadwal aktif untuk Anda hari ini.</p>
                </div>

                <div className="glass-card p-0 overflow-hidden border-l-4 border-l-[var(--indomaret-blue)]">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-900/10">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Tanggal</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{assignment.date}</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Detail Info */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Peran Anda</p>
                                    <p className="font-bold text-lg">{role}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                    <Truck size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Armada</p>
                                    <p className="font-bold text-lg">{assignment.vehicleId}</p>
                                    <p className="text-sm text-slate-500">{vehicleInfo?.description || 'Kendaraan Operasional'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                    <Coins size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Modal Awal (Diterima)</p>
                                    <p className="font-bold text-lg text-[var(--indomaret-blue)]">Rp {totalModal.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Confirmation Alert */}
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl text-xs text-amber-800 dark:text-amber-400 leading-relaxed flex gap-2">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <p>Dengan menekan tombol di bawah, Anda mengonfirmasi kehadiran dan penerimaan modal awal operasional sesuai nominal di atas.</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleStart}
                    disabled={isStarting}
                    className="btn-primary w-full py-5 text-xl flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isStarting ? (
                        <>
                            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Memproses...</span>
                        </>
                    ) : (
                        <>
                            <span>Terima Tugas & Mulai</span>
                            <ArrowRight size={24} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
