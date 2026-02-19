import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'FIELD';
export type Position = 'DRIVER' | 'CASHIER' | 'ADMIN';

interface User {
    nik: string;
    full_name: string;
    role: UserRole;
    position: Position;
}

interface AuthState {
    user: User | null;
    token: string | null;
    vehicle: string | null;
    selectedPosition: Position | null;
    sessionDate: string | null; // Format: YYYY-MM-DD
    isAuthenticated: boolean;

    login: (nik: string, full_name: string, role: UserRole, position: Position, token: string) => void;
    setSessionDetails: (vehicle: string, position: Position) => void;
    logout: () => void;
    clearSession: () => void;
    hasValidSession: () => boolean;
    getToken: () => string | null;
}

const getTodayDateString = () => new Date().toISOString().split('T')[0];

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            vehicle: null,
            selectedPosition: null,
            sessionDate: null,
            isAuthenticated: false,

            login: (nik, full_name, role, position, token) =>
                set({
                    user: {
                        nik,
                        full_name,
                        role: role.toUpperCase() as UserRole,
                        position: position.toUpperCase() as Position
                    },
                    token,
                    isAuthenticated: true
                }),

            setSessionDetails: (vehicle, position) =>
                set({ vehicle, selectedPosition: position, sessionDate: getTodayDateString() }),

            // Logout hanya menghapus user auth, TIDAK menghapus vehicle/role untuk re-login di hari yang sama
            logout: () => set({ user: null, token: null, isAuthenticated: false }),

            // Clear session menghapus semua termasuk vehicle/role (digunakan di akhir hari atau manual reset)
            clearSession: () => set({
                user: null,
                token: null,
                vehicle: null,
                selectedPosition: null,
                sessionDate: null,
                isAuthenticated: false
            }),

            // Check apakah session masih valid untuk hari ini
            hasValidSession: () => {
                const { vehicle, selectedPosition, sessionDate } = get();
                return !!(vehicle && selectedPosition && sessionDate === getTodayDateString());
            },

            // Get token for API calls
            getToken: () => get().token,
        }),
        {
            name: 'auth-storage',
        }
    )
);
