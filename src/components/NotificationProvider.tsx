'use client';

import { useNotificationStore, NotificationType } from '@/store/useNotificationStore';
import {
    CheckCircle2,
    AlertCircle,
    Info,
    AlertTriangle,
    X,
    Bell
} from 'lucide-react';
import { useEffect, useState } from 'react';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { notifications, activeDialog, removeNotification } = useNotificationStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <>{children}</>;

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="text-green-500" size={20} />;
            case 'error': return <AlertCircle className="text-red-500" size={20} />;
            case 'warning': return <AlertTriangle className="text-amber-500" size={20} />;
            default: return <Info className="text-blue-500" size={20} />;
        }
    };

    return (
        <>
            {children}

            {/* TOAST NOTIFICATIONS */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
                {notifications.map((n) => (
                    <div
                        key={n.id}
                        className="glass-card flex items-center gap-3 p-4 pr-6 min-w-[300px] animate-in slide-in-from-right-full duration-300 shadow-2xl border-l-4 border-l-current"
                        style={{ color: n.type === 'success' ? '#22c55e' : n.type === 'error' ? '#ef4444' : n.type === 'warning' ? '#f59e0b' : '#3b82f6' }}
                    >
                        <div className="flex-shrink-0">
                            {getIcon(n.type)}
                        </div>
                        <div className="flex-1 text-sm font-bold text-slate-800 dark:text-white">
                            {n.message}
                        </div>
                        <button
                            onClick={() => removeNotification(n.id)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {/* MODAL DIALOGS */}
            {activeDialog && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200 p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
                        <div className="p-8 text-center space-y-6">
                            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${activeDialog.type === 'success' ? 'bg-green-100 text-green-600' :
                                    activeDialog.type === 'error' ? 'bg-red-100 text-red-600' :
                                        activeDialog.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                            'bg-blue-100 text-blue-600'
                                }`}>
                                {activeDialog.type === 'success' && <CheckCircle2 size={40} />}
                                {activeDialog.type === 'error' && <AlertCircle size={40} />}
                                {activeDialog.type === 'warning' && <AlertTriangle size={40} />}
                                {activeDialog.type === 'info' && <Info size={40} />}
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                    {activeDialog.title}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">
                                    {activeDialog.message}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                {activeDialog.cancelText && (
                                    <button
                                        onClick={activeDialog.onCancel}
                                        className="flex-1 py-4 px-6 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                                    >
                                        {activeDialog.cancelText}
                                    </button>
                                )}
                                <button
                                    onClick={activeDialog.onConfirm}
                                    className={`flex-1 py-4 px-6 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${activeDialog.type === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-200/50' :
                                            activeDialog.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200/50' :
                                                'bg-[var(--indomaret-blue)] hover:opacity-90 shadow-blue-200/50'
                                        }`}
                                >
                                    {activeDialog.confirmText}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
