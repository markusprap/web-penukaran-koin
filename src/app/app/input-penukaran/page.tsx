'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useTransactionStore, CoinDenom } from '@/store/useTransactionStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useMasterDataStore, Store as StoreType } from '@/store/useMasterDataStore';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Store,
    Coins,
    Banknote,
    Camera,
    Signature as SignatureIcon,
    CircleCheckBig,
    Trash2,
    Eye,
    FileText,
    Image as ImageIcon,
    Phone,
    X,
    RotateCw,
    Home,
    Printer
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { generatePDF, generatePDFDigital, printReceiptThermal } from '@/lib/pdfGenerator';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- Denomination Input Component (untuk menghindari clear saat mengetik) ---
// --- Denomination Input Component (untuk menghindari clear saat mengetik) ---
function DenomInput({
    denom,
    currentTotal,
    onUpdate,
    colorClass = "text-[var(--indomaret-blue)]"
}: {
    denom: number;
    currentTotal: number;
    onUpdate: (newQty: number) => void;
    colorClass?: string;
}) {
    // Helper to format number with dots
    const formatNumber = (num: string | number) => {
        if (!num) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    // Helper to extract raw number from formatted string
    const parseNumber = (str: string) => {
        return parseInt(str.replace(/\./g, '')) || 0;
    };

    const [inputValue, setInputValue] = useState<string>(currentTotal > 0 ? formatNumber(currentTotal) : '');

    // Sync dengan external state jika ada perubahan dari luar
    useEffect(() => {
        if (currentTotal > 0 && formatNumber(currentTotal) !== inputValue) {
            setInputValue(formatNumber(currentTotal));
        } else if (currentTotal === 0 && inputValue !== '' && inputValue !== '0') {
            // Jangan reset jika user sedang mengetik
        }
    }, [currentTotal]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, ''); // Hanya ambil angka
        setInputValue(formatNumber(rawValue));
    };

    const handleBlur = () => {
        const totalRupiah = parseNumber(inputValue);
        const newQty = Math.floor(totalRupiah / denom);
        onUpdate(newQty);

        // Update input value ke nilai yang valid (kelipatan denom)
        if (newQty > 0) {
            setInputValue(formatNumber(newQty * denom));
        } else {
            setInputValue('');
        }
    };

    const calculatedQty = Math.floor(parseNumber(inputValue) / denom);

    return (
        <div className="flex-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Rupiah</p>
            <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">Rp</span>
                <input
                    type="text"
                    inputMode="numeric"
                    value={inputValue}
                    placeholder="0"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="bg-transparent text-xl font-black w-full outline-none text-left placeholder:text-slate-200 dark:text-white"
                />
            </div>
            {calculatedQty > 0 && (
                <p className={`text-xs font-bold mt-1 ${colorClass}`}>
                    = {calculatedQty.toLocaleString()} {denom >= 1000 ? 'lembar' : 'keping'}
                </p>
            )}
        </div>
    );
}

// --- Signature Modal Component ---
function SignatureModal({ isOpen, onClose, onSave, title }: { isOpen: boolean, onClose: () => void, onSave: (data: string) => void, title: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set dimensions to window size for full screen signature
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 200; // Leave space for header/footer

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
    }, [isOpen]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        let x, y;

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
        }
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            onSave(canvas.toDataURL());
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-black text-lg">{title}</h3>
                <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                    <X size={24} />
                </button>
            </div>
            <div className="flex-1 bg-slate-50 dark:bg-slate-900 relative touch-none overflow-hidden">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                />
                <p className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-slate-400 font-bold uppercase pointer-events-none opacity-50">
                    Area Tanda Tangan
                </p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                <button
                    onClick={clearCanvas}
                    className="py-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-bold text-slate-500"
                >
                    Hapus Ulang
                </button>
                <button
                    onClick={handleSave}
                    className="py-4 rounded-xl bg-[var(--indomaret-blue)] text-white font-bold"
                >
                    Simpan Tanda Tangan
                </button>
            </div>
        </div>
    );
}

// --- Camera Modal Component ---
function CameraModal({ isOpen, onClose, onCapture }: { isOpen: boolean, onClose: () => void, onCapture: (data: string) => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { showAlert } = useNotificationStore();
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    useEffect(() => {
        if (!isOpen) return;
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: facingMode }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                showAlert('Akses Kamera Gagal', "Tidak dapat mengakses kamera. Pastikan bapak sudah memberikan izin kamera di browser.", 'error');
                onClose();
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isOpen, facingMode]);

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                onCapture(canvas.toDataURL('image/jpeg'));
                onClose();
            }
        }
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-300">
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Overlay Button Close */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-3 bg-black/50 backdrop-blur-md text-white rounded-full z-10"
                >
                    <X size={24} />
                </button>

                {/* Overlay Button Switch Camera */}
                <button
                    onClick={toggleCamera}
                    className="absolute top-6 left-6 p-3 bg-black/50 backdrop-blur-md text-white rounded-full z-10"
                >
                    <RotateCw size={24} />
                </button>
            </div>
            <div className="p-8 bg-black flex justify-center pb-12">
                <button
                    onClick={takePhoto}
                    className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 ring-4 ring-white/20 active:scale-95 transition-all"
                />
            </div>
        </div>
    );
}

// --- Main Page Component ---
export default function InputPenukaran() {
    const router = useRouter();
    const { user, vehicle } = useAuthStore();
    const { currentTransaction, updateStep1, updateCoins, updateBigMoney, completeTransaction, clearCurrentTransaction, history } = useTransactionStore();
    const { notify, showAlert } = useNotificationStore();
    const { getActiveAssignmentByUser, fetchAssignments, updateAssignment } = useAssignmentStore();

    const activeAssignment = user ? getActiveAssignmentByUser(user.nik) : undefined;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showBAModal, setShowBAModal] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Form State
    const [storeCode, setStoreCode] = useState('');
    const [storeTeamName, setStoreTeamName] = useState('');
    const [storeTeamNik, setStoreTeamNik] = useState('');
    const [storeTeamWa, setStoreTeamWa] = useState('');
    const [storeTeamPosition, setStoreTeamPosition] = useState('Chief of Store');

    // Media State
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [storeSignature, setStoreSignature] = useState<string | null>(null);
    const [financeSignature, setFinanceSignature] = useState<string | null>(null);

    // Modal Controls
    const [showCamera, setShowCamera] = useState(false);
    const [signatureModal, setSignatureModal] = useState<{ isOpen: boolean, type: 'store' | 'finance' | null }>({ isOpen: false, type: null });

    useEffect(() => {
        setIsMounted(true);
        if (!user) router.push('/app/login');
        if (!currentTransaction) router.push('/app/dashboard');
    }, [user, currentTransaction, router]);

    // Use real stores from backend
    const storesData = useMasterDataStore((state) => state.stores);
    const fetchMasterData = useMasterDataStore((state) => state.fetchMasterData);

    useEffect(() => {
        fetchMasterData();
        fetchAssignments();
    }, [fetchMasterData, fetchAssignments]);

    // Filter stores based on active assignment
    const filteredStores = storesData.filter(s =>
        activeAssignment?.storeCodes.includes(s.code)
    );

    // Track which stores already have completed transactions in this session
    const exchangedStoreCodes = new Set(
        history
            .filter(tx => activeAssignment?.storeCodes.includes(tx.storeCode))
            .map(tx => tx.storeCode)
    );

    const selectedStore = storesData.find(s => s.code === storeCode);

    const handleNextStep = () => {
        if (step === 1) {
            if (!storeCode || !storeTeamName) return;
            updateStep1(
                storeCode,
                selectedStore?.name || '',
                selectedStore?.address || '', // Pass address
                storeTeamName,
                storeTeamWa,
                storeTeamPosition,
                vehicle || '-'
            );
        }
        // Validate coin vs big money balance before moving to finalization step
        if (step === 3) {
            if (totalKoin === 0) {
                notify('Masukkan jumlah koin yang ditukar terlebih dahulu.', 'warning');
                return;
            }
            if (totalKoin !== totalUangBesar) {
                showAlert(
                    'Nominal Tidak Seimbang',
                    `Total koin (Rp ${totalKoin.toLocaleString()}) tidak sama dengan total uang besar (Rp ${totalUangBesar.toLocaleString()}). Selisih: Rp ${Math.abs(totalKoin - totalUangBesar).toLocaleString()}.`,
                    'warning'
                );
                return;
            }
        }
        setStep(step + 1);
    };

    const handleBackStep = () => {
        if (step === 1) router.back();
        else setStep(step - 1);
    };

    const handleCapturePhoto = () => {
        setShowCamera(true);
    };

    const handleFinalize = () => {
        if (!capturedPhoto || !storeSignature || !financeSignature) {
            notify('Harap lengkapi foto dan kedua tanda tangan sebelum mengirim.', 'warning');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            completeTransaction(financeSignature, storeSignature, capturedPhoto);

            // Update Assignment Progress
            if (activeAssignment && storeCode) {
                const storeIndex = activeAssignment.storeCodes.indexOf(storeCode);
                const nextIndex = Math.max(activeAssignment.currentStopIndex || 0, storeIndex + 1);

                updateAssignment(activeAssignment.id, {
                    currentStopIndex: nextIndex,
                    status: 'Active' // Keep active so user can finish session in dashboard
                });
            }

            setStep(5);
            setLoading(false);
        }, 1500);
    };

    if (!currentTransaction) return null;

    const totalKoin = (currentTransaction.coins || []).reduce((acc, c) => acc + (c.denom * c.qty), 0);
    const totalUangBesar = (currentTransaction.bigMoney || []).reduce((acc, c) => acc + (c.denom * c.qty), 0);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 pb-20 transition-colors">
            {/* Header - Hide on Success Step */}
            {step < 5 && (
                <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 max-w-2xl mx-auto">
                        <button onClick={handleBackStep} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-xl font-black tracking-tight">Input Penukaran</h1>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Langkah {step} dari 4</p>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="max-w-2xl mx-auto mt-4 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--indomaret-blue)] transition-all duration-500"
                            style={{ width: `${(step / 4) * 100}%` }}
                        />
                    </div>
                </header>
            )}

            <main className="max-w-xl mx-auto p-6 transition-all">
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-[var(--indomaret-blue)] mb-2">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                    <Store size={20} />
                                </div>
                                <h2 className="font-black uppercase text-xs tracking-widest">Identitas Toko</h2>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Toko</label>
                                <select
                                    value={storeCode}
                                    onChange={(e) => setStoreCode(e.target.value)}
                                    className="input-field w-full appearance-none bg-no-repeat bg-[right_1rem_center] font-bold py-4 rounded-2xl border-2 border-slate-100 focus:border-[var(--indomaret-blue)] transition-all outline-none dark:bg-slate-900 dark:border-slate-800"
                                >
                                    <option value="">-- Pilih Kode Toko --</option>
                                    {filteredStores.map(s => {
                                        const isExchanged = exchangedStoreCodes.has(s.code);
                                        return (
                                            <option key={s.code} value={s.code} disabled={isExchanged}>
                                                {s.code} - {s.name}{isExchanged ? ' ✓ Sudah Ditukar' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {selectedStore && (
                                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-300">
                                    <p className="text-[9px] uppercase font-black text-slate-400 mb-1 tracking-widest">Alamat Toko</p>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed">{selectedStore.address}</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 mb-2">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <SignatureIcon size={20} />
                                </div>
                                <h2 className="font-black uppercase text-xs tracking-widest">Tim Toko Terkait</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Penerima</label>
                                    <input
                                        placeholder="Contoh: Budi Sudarsono"
                                        value={storeTeamName}
                                        onChange={(e) => setStoreTeamName(e.target.value)}
                                        className="input-field w-full font-bold py-4 rounded-2xl border-2 border-slate-100 focus:border-[var(--indomaret-blue)] transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NIK</label>
                                        <input
                                            placeholder="NIK Karyawan"
                                            value={storeTeamNik}
                                            onChange={(e) => setStoreTeamNik(e.target.value)}
                                            className="input-field w-full font-bold py-4 rounded-2xl border-2 border-slate-100 focus:border-[var(--indomaret-blue)] transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jabatan (CIF)</label>
                                        <select
                                            value={storeTeamPosition}
                                            onChange={(e) => setStoreTeamPosition(e.target.value)}
                                            className="input-field w-full font-bold py-4 rounded-2xl border-2 border-slate-100 focus:border-[var(--indomaret-blue)] transition-all dark:bg-slate-900 dark:border-slate-800"
                                        >
                                            <option>Chief of Store</option>
                                            <option>Store Senior Leader</option>
                                            <option>Store Junior Leader</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No WA Toko</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Phone size={16} />
                                        </div>
                                        <input
                                            placeholder="08xx xxxx xxxx"
                                            value={storeTeamWa}
                                            onChange={(e) => setStoreTeamWa(e.target.value)}
                                            className="input-field w-full font-bold py-4 pl-12 rounded-2xl border-2 border-slate-100 focus:border-[var(--indomaret-blue)] transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3 text-[var(--indomaret-blue)]">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                    <Coins size={20} />
                                </div>
                                <h2 className="font-black uppercase text-xs tracking-widest">Rincian Koin</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Koin</p>
                                <p className="text-xl font-black text-[var(--indomaret-blue)]">Rp {totalKoin.toLocaleString()}</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-center font-bold">
                            💡 Masukkan <span className="text-[var(--indomaret-blue)]">Total Rupiah</span> per pecahan, sistem akan menghitung jumlah keping otomatis.
                        </p>
                        <div className="space-y-3">
                            {currentTransaction.coins?.map((c, idx) => (
                                <div key={c.denom} className="bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 text-[var(--indomaret-blue)] rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                                            {c.denom}
                                        </div>
                                        <DenomInput
                                            denom={c.denom}
                                            currentTotal={c.qty * c.denom}
                                            onUpdate={(newQty) => {
                                                const newCoins = [...(currentTransaction.coins || [])];
                                                newCoins[idx].qty = newQty;
                                                updateCoins(newCoins);
                                            }}
                                            colorClass="text-[var(--indomaret-blue)]"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3 text-green-600">
                                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <Banknote size={20} />
                                </div>
                                <h2 className="font-black uppercase text-xs tracking-widest">Uang Besar</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Diterima</p>
                                <p className="text-xl font-black text-green-600">Rp {totalUangBesar.toLocaleString()}</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-center font-bold">
                            💵 Masukkan <span className="text-green-600">Total Rupiah</span> yang diterima per pecahan.
                        </p>
                        <div className="space-y-3">
                            {currentTransaction.bigMoney?.map((m, idx) => (
                                <div key={m.denom} className="bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all focus-within:ring-2 focus-within:ring-green-500/20">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-xl flex items-center justify-center font-black text-xs shrink-0">
                                            {m.denom >= 1000 ? `${m.denom / 1000}K` : m.denom}
                                        </div>
                                        <DenomInput
                                            denom={m.denom}
                                            currentTotal={m.qty * m.denom}
                                            onUpdate={(newQty) => {
                                                const newM = [...(currentTransaction.bigMoney || [])];
                                                newM[idx].qty = newQty;
                                                updateBigMoney(newM);
                                            }}
                                            colorClass="text-green-600"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className={cn(
                            "p-6 rounded-3xl flex justify-between items-center transition-all",
                            totalKoin === totalUangBesar ? "bg-green-600 text-white" : "bg-red-600 text-white"
                        )}>
                            <span className="text-sm font-black uppercase">Selisih</span>
                            <span className="text-2xl font-black">Rp {(totalKoin - totalUangBesar).toLocaleString()}</span>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-right-5 duration-500">
                        {/* BA Quick Preview */}
                        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                                <FileText size={180} />
                            </div>
                            <div className="flex justify-between items-center relative z-10">
                                <h2 className="font-black text-blue-400 uppercase text-[10px] tracking-[0.2em]">Berita Acara (BA) Preview</h2>
                                <button
                                    onClick={() => setShowBAModal(true)}
                                    className="flex items-center gap-2 text-[10px] font-black bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all"
                                >
                                    <Eye size={14} /> LIHAT DOKUMEN
                                </button>
                            </div>
                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Outlet</p>
                                        <p className="text-lg font-black tracking-tight">{currentTransaction.storeName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">PIC Toko</p>
                                        <p className="text-sm font-bold">{currentTransaction.storeTeamName}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-xs font-bold text-slate-400">Total Nominal</span>
                                    <span className="text-2xl font-black text-blue-400 tracking-tighter">Rp {totalKoin.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            {/* Photo Section */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Camera size={14} /> Foto Serah Terima
                                </label>
                                {capturedPhoto ? (
                                    <div className="relative group">
                                        <img src={capturedPhoto} className="w-full h-56 object-cover rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm" alt="Captured" />
                                        <button
                                            onClick={() => setCapturedPhoto(null)}
                                            className="absolute top-4 right-4 p-3 bg-red-500 text-white rounded-2xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                        {isMounted && (
                                            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-widest">
                                                UPLOADED • {format(new Date(), 'HH:mm')}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleCapturePhoto}
                                        disabled={loading}
                                        className="w-full h-56 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 gap-4 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-400 transition-all group dark:border-slate-800 dark:bg-slate-900"
                                    >
                                        {loading ? (
                                            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl shadow-sm text-slate-300 group-hover:scale-110 group-hover:text-blue-500 transition-all">
                                                    <Camera size={44} />
                                                </div>
                                                <div className="text-center">
                                                    <span className="block font-black text-xs uppercase tracking-widest">Ambil Foto Bukti</span>
                                                </div>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Digital Signature */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <SignatureIcon size={14} /> Konfirmasi Tanda Tangan
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Ttd Petugas (Driver/Kasir)</p>
                                        {financeSignature ? (
                                            <div className="relative group">
                                                <div className="h-48 bg-white dark:bg-slate-800 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center p-4">
                                                    <img src={financeSignature} className="max-h-full max-w-full" alt="Signature" />
                                                </div>
                                                <button
                                                    onClick={() => setFinanceSignature(null)}
                                                    className="absolute top-4 right-4 p-2 bg-red-100 text-red-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setSignatureModal({ isOpen: true, type: 'finance' })}
                                                className="w-full h-48 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 gap-3 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200 transition-all font-black text-xs uppercase tracking-widest"
                                            >
                                                <SignatureIcon size={32} />
                                                <span>Klik untuk Tanda Tangan</span>
                                            </button>
                                        )}
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 text-center">{user?.full_name}</p>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Ttd Pihak Toko ({storeTeamName})</p>
                                        {storeSignature ? (
                                            <div className="relative group">
                                                <div className="h-48 bg-white dark:bg-slate-800 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center p-4">
                                                    <img src={storeSignature} className="max-h-full max-w-full" alt="Signature" />
                                                </div>
                                                <button
                                                    onClick={() => setStoreSignature(null)}
                                                    className="absolute top-4 right-4 p-2 bg-red-100 text-red-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setSignatureModal({ isOpen: true, type: 'store' })}
                                                className="w-full h-48 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 gap-3 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200 transition-all font-black text-xs uppercase tracking-widest"
                                            >
                                                <SignatureIcon size={32} />
                                                <span>Klik untuk Tanda Tangan</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-green-500/40 relative">
                            <CircleCheckBig size={64} />
                        </div>
                        <h1 className="text-4xl font-black mb-2 text-center text-slate-900 dark:text-white tracking-tighter">Berhasil!</h1>
                        <p className="text-center text-slate-500 mb-12 max-w-xs font-bold leading-relaxed">Data penukaran telah tersinkronisasi ke server pusat.</p>
                        <div className="w-full space-y-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center mb-2">Cetak / Unduh Bukti Transaksi</p>
                            {/* Print button - full width, prominent */}
                            <button
                                onClick={() => {
                                    if (currentTransaction) {
                                        printReceiptThermal({
                                            id: currentTransaction.id || 'DRAFT',
                                            storeCode: currentTransaction.storeCode || '-',
                                            storeName: currentTransaction.storeName || '-',
                                            storeAddress: currentTransaction.storeAddress || '',
                                            storeTeamName: currentTransaction.storeTeamName || '-',
                                            storeTeamPosition: currentTransaction.storeTeamPosition || '-',
                                            storeTeamWa: currentTransaction.storeTeamWa || '-',
                                            vehicle: currentTransaction.vehicle || '-',
                                            coins: currentTransaction.coins || [],
                                            bigMoney: currentTransaction.bigMoney || [],
                                            timestamp: currentTransaction.timestamp || new Date().toISOString(),
                                            status: 'completed',
                                            adminSignature: financeSignature,
                                            signature: storeSignature,
                                            evidencePhoto: capturedPhoto,
                                            userName: user?.full_name || 'Petugas'
                                        });
                                    }
                                }}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl flex items-center justify-center gap-3 font-bold text-sm uppercase tracking-wider shadow-lg shadow-purple-500/30 transition-all hover:-translate-y-1"
                            >
                                <Printer size={22} />
                                <span>🖨️ Print Struk (Bluetooth)</span>
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => {
                                        if (currentTransaction) {
                                            generatePDF({
                                                id: currentTransaction.id || 'DRAFT',
                                                storeCode: currentTransaction.storeCode || '-',
                                                storeName: currentTransaction.storeName || '-',
                                                storeAddress: currentTransaction.storeAddress || '',
                                                storeTeamName: currentTransaction.storeTeamName || '-',
                                                storeTeamPosition: currentTransaction.storeTeamPosition || '-',
                                                storeTeamWa: currentTransaction.storeTeamWa || '-',
                                                vehicle: currentTransaction.vehicle || '-',
                                                coins: currentTransaction.coins || [],
                                                bigMoney: currentTransaction.bigMoney || [],
                                                timestamp: currentTransaction.timestamp || new Date().toISOString(),
                                                status: 'completed',
                                                adminSignature: financeSignature,
                                                signature: storeSignature,
                                                evidencePhoto: capturedPhoto,
                                                userName: user?.full_name || 'Petugas'
                                            });
                                        }
                                    }}
                                    className="py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex flex-col items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider shadow-lg transition-all hover:-translate-y-1"
                                >
                                    <Banknote size={24} />
                                    <span>Unduh Struk</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (currentTransaction) {
                                            generatePDFDigital({
                                                id: currentTransaction.id || 'DRAFT',
                                                storeCode: currentTransaction.storeCode || '-',
                                                storeName: currentTransaction.storeName || '-',
                                                storeAddress: currentTransaction.storeAddress || '',
                                                storeTeamName: currentTransaction.storeTeamName || '-',
                                                storeTeamPosition: currentTransaction.storeTeamPosition || '-',
                                                storeTeamWa: currentTransaction.storeTeamWa || '-',
                                                vehicle: currentTransaction.vehicle || '-',
                                                coins: currentTransaction.coins || [],
                                                bigMoney: currentTransaction.bigMoney || [],
                                                timestamp: currentTransaction.timestamp || new Date().toISOString(),
                                                status: 'completed',
                                                adminSignature: financeSignature,
                                                signature: storeSignature,
                                                evidencePhoto: capturedPhoto,
                                                userName: user?.full_name || 'Petugas'
                                            });
                                        }
                                    }}
                                    className="py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl flex flex-col items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider shadow-lg transition-all hover:-translate-y-1"
                                >
                                    <FileText size={24} />
                                    <span>PDF Digital</span>
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    clearCurrentTransaction();
                                    router.push('/app/dashboard');
                                }}
                                className="w-full py-5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 mt-4"
                            >
                                <Home size={18} />
                                <span>Selesai & Kembali ke Dashboard</span>
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* --- MODALS --- */}
            <CameraModal
                isOpen={showCamera}
                onClose={() => setShowCamera(false)}
                onCapture={(data) => setCapturedPhoto(data)}
            />

            <SignatureModal
                isOpen={signatureModal.isOpen}
                onClose={() => setSignatureModal({ ...signatureModal, isOpen: false })}
                onSave={(data) => {
                    if (signatureModal.type === 'store') setStoreSignature(data);
                    if (signatureModal.type === 'finance') setFinanceSignature(data);
                }}
                title={signatureModal.type === 'store' ? `Tanda Tangan ${storeTeamName}` : 'Tanda Tangan Petugas'}
            />


            {/* --- RECEIPT STYLE BA MODAL --- */}
            {showBAModal && isMounted && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="w-full max-w-sm bg-[#f8f8f8] text-slate-900 rounded-[1.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 max-h-[90vh] flex flex-col font-mono">
                        {/* Receipt Container */}
                        <div className="overflow-y-auto p-6 space-y-6">
                            {/* Receipt Header */}
                            <div className="text-center space-y-1 py-4 border-b border-dashed border-slate-300">
                                <h1 className="text-lg font-black leading-tight uppercase">INDOMARET<br />BUKTI PENUKARAN KOIN</h1>
                                <p className="text-[10px] text-slate-500 tracking-tighter">Coin Exchange Digital Receipt</p>
                            </div>

                            {/* Metadata Section */}
                            <div className="space-y-1 text-[11px] font-bold">
                                <div className="flex justify-between">
                                    <span>TANGGAL</span>
                                    <span suppressHydrationWarning>{format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
                                </div>
                                <div className="flex justify-between items-start gap-4">
                                    <span>TOKO</span>
                                    <span className="text-right">{currentTransaction.storeCode} - {currentTransaction.storeName}</span>
                                </div>
                                <div className="flex justify-between items-start gap-4">
                                    <span>ALAMAT</span>
                                    <span className="text-right text-[9px] leading-tight max-w-[150px]">{selectedStore?.address}</span>
                                </div>
                                <div className="flex justify-between border-t border-dashed border-slate-200 mt-2 pt-2">
                                    <span>PIC TOKO</span>
                                    <span className="text-right">{currentTransaction.storeTeamName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>JABATAN</span>
                                    <span>{currentTransaction.storeTeamPosition}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>NO WA</span>
                                    <span>{currentTransaction.storeTeamWa}</span>
                                </div>
                                <div className="flex justify-between mt-1 pt-1 border-t border-dashed border-slate-200">
                                    <span>PETUGAS</span>
                                    <span>{user?.full_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>KENDARAAN</span>
                                    <span>{currentTransaction.vehicle}</span>
                                </div>
                            </div>

                            {/* Exchange Table (Koin) */}
                            <div className="space-y-2">
                                <p className="text-[10px] font-black border-y border-dashed border-slate-300 py-1 text-center">RINCIAN KOIN (TUKAR)</p>
                                <table className="w-full text-[11px]">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="text-left py-1">PECAHAN</th>
                                            <th className="text-center py-1">QTY</th>
                                            <th className="text-right py-1">TOTAL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentTransaction.coins?.filter(c => c.qty > 0).map(c => (
                                            <tr key={c.denom}>
                                                <td className="py-1">Rp {c.denom.toLocaleString()}</td>
                                                <td className="text-center py-1">{c.qty}</td>
                                                <td className="text-right py-1">Rp {(c.denom * c.qty).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t border-slate-900 font-black">
                                            <td colSpan={2} className="py-2">TOTAL TUKAR</td>
                                            <td className="text-right py-2">Rp {totalKoin.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Balance Table (Uang Diterima) */}
                            <div className="space-y-2">
                                <p className="text-[10px] font-black border-y border-dashed border-slate-300 py-1 text-center uppercase">Uang Diterima (Besar)</p>
                                <table className="w-full text-[11px]">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="text-left py-1">PECAHAN</th>
                                            <th className="text-center py-1">QTY</th>
                                            <th className="text-right py-1">TOTAL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentTransaction.bigMoney?.filter(m => m.qty > 0).map(m => (
                                            <tr key={m.denom}>
                                                <td className="py-1">Rp {m.denom.toLocaleString()}</td>
                                                <td className="text-center py-1">{m.qty}</td>
                                                <td className="text-right py-1">Rp {(m.denom * m.qty).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t border-slate-900 font-black">
                                            <td colSpan={2} className="py-2">TOTAL TERIMA</td>
                                            <td className="text-right py-2">Rp {totalUangBesar.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>


                            {/* Signature Section */}
                            <div className="pt-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center space-y-2">
                                        <p className="text-[10px] font-black">PETUGAS</p>
                                        <div className="h-16 flex items-center justify-center border-b border-slate-300 border-dashed">
                                            {financeSignature ? (
                                                <img src={financeSignature} className="max-h-full" alt="Finance Signature" />
                                            ) : (
                                                <span className="text-slate-300 text-[10px]">No Sig</span>
                                            )}
                                        </div>
                                        <p className="text-[11px] font-bold">({user?.full_name})</p>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-[10px] font-black">TIM TOKO</p>
                                        <div className="h-16 flex items-center justify-center border-b border-slate-300 border-dashed">
                                            {storeSignature ? (
                                                <img src={storeSignature} className="max-h-full" alt="Store Signature" />
                                            ) : (
                                                <span className="text-slate-300 text-[10px]">No Sig</span>
                                            )}
                                        </div>
                                        <p className="text-[11px] font-bold">({storeTeamName})</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center pt-8 pb-4">
                                <p className="text-[9px] text-slate-400 italic">*** Terima kasih atas kerja samanya ***</p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-white border-t border-slate-200">
                            <button
                                onClick={() => setShowBAModal(false)}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
                            >
                                Selesai Meninjau
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Actions */}
            {step < 5 && (
                <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 p-6 z-40 safe-area-bottom shadow-2xl">
                    <div className="max-w-2xl mx-auto flex gap-4">
                        {step < 4 ? (
                            <button
                                onClick={handleNextStep}
                                disabled={step === 1 && (!storeCode || !storeTeamName)}
                                className="flex-1 bg-[var(--indomaret-blue)] hover:bg-blue-700 text-white flex items-center justify-center gap-3 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50 disabled:translate-y-0 hover:-translate-y-1"
                            >
                                <span>Lanjutkan</span>
                                <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handleFinalize}
                                disabled={loading || !capturedPhoto || !storeSignature}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-3 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-500/20 transition-all disabled:opacity-50 disabled:translate-y-0 hover:-translate-y-1"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Konfirmasi & Kirim</span>
                                        <Check size={18} />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </footer>
            )}
        </div>
    );
}
