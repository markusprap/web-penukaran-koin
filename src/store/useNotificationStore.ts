import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
    id: string;
    message: string;
    type: NotificationType;
}

interface Dialog {
    title: string;
    message: string;
    type: NotificationType;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

interface NotificationState {
    notifications: Notification[];
    activeDialog: Dialog | null;

    // Toast notifications
    notify: (message: string, type?: NotificationType) => void;
    removeNotification: (id: string) => void;

    // Modal dialogs (replaces alert/confirm)
    showAlert: (title: string, message: string, type?: NotificationType) => Promise<void>;
    showConfirm: (title: string, message: string, options?: { confirmText?: string; cancelText?: string; type?: NotificationType }) => Promise<boolean>;
    closeDialog: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    activeDialog: null,

    notify: (message, type = 'success') => {
        const id = Math.random().toString(36).substring(7);
        set((state) => ({
            notifications: [...state.notifications, { id, message, type }]
        }));

        // Auto remove toast after 3s
        setTimeout(() => get().removeNotification(id), 3000);
    },

    removeNotification: (id) => {
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id)
        }));
    },

    showAlert: (title, message, type = 'info') => {
        return new Promise((resolve) => {
            set({
                activeDialog: {
                    title,
                    message,
                    type,
                    confirmText: 'OK',
                    onConfirm: () => {
                        get().closeDialog();
                        resolve();
                    }
                }
            });
        });
    },

    showConfirm: (title, message, options = {}) => {
        return new Promise((resolve) => {
            set({
                activeDialog: {
                    title,
                    message,
                    type: options.type || 'warning',
                    confirmText: options.confirmText || 'Ya, Lanjutkan',
                    cancelText: options.cancelText || 'Batal',
                    onConfirm: () => {
                        get().closeDialog();
                        resolve(true);
                    },
                    onCancel: () => {
                        get().closeDialog();
                        resolve(false);
                    }
                }
            });
        });
    },

    closeDialog: () => set({ activeDialog: null })
}));
