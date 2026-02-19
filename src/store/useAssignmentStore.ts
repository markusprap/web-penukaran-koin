import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

export interface Stock {
    [denom: number]: number;
}

export interface Assignment {
    id: string;
    date: string; // YYYY-MM-DD
    cashierId: string; // NIK
    driverId: string; // NIK
    vehicleId: string; // Nopol
    initialStock: Stock;
    currentStock: Stock;
    storeCodes: string[];
    currentStopIndex?: number; // 0 to length-1
    status: 'Active' | 'Completed' | 'Ready';
    // Hydrated fields from API
    cashier?: { nik: string; full_name: string };
    driver?: { nik: string; full_name: string };
    vehicle?: any;
}

interface AssignmentState {
    assignments: Assignment[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchAssignments: () => Promise<void>;
    createAssignment: (data: Omit<Assignment, 'id' | 'status' | 'currentStock'>) => Promise<Assignment>;
    updateAssignment: (id: string, data: Partial<Omit<Assignment, 'id'>>) => Promise<void>;
    completeAssignment: (id: string, finalStock: Stock) => Promise<void>;
    deleteAssignment: (id: string) => Promise<void>;

    // Helpers (Client-side)
    getActiveAssignmentByUser: (nik: string) => Assignment | undefined;
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
    assignments: [],
    isLoading: false,
    error: null,

    fetchAssignments: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await apiFetch('/assignments');
            set({ assignments: data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    createAssignment: async (data) => {
        set({ isLoading: true });
        try {
            const created = await apiFetch('/assignments', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            set((state) => ({
                assignments: [created, ...state.assignments],
                isLoading: false
            }));
            return created;
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    updateAssignment: async (id, data) => {
        set({ isLoading: true });
        try {
            const updated = await apiFetch(`/assignments/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            set((state) => ({
                assignments: state.assignments.map((a) => a.id === id ? updated : a),
                isLoading: false
            }));
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    deleteAssignment: async (id) => {
        set({ isLoading: true });
        try {
            await apiFetch(`/assignments/${id}`, { method: 'DELETE' });
            set((state) => ({
                assignments: state.assignments.filter((a) => a.id !== id),
                isLoading: false
            }));
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    completeAssignment: async (id, finalStock) => {
        set({ isLoading: true });
        try {
            const result = await apiFetch(`/assignments/${id}/complete`, {
                method: 'POST',
                body: JSON.stringify({ remainingStock: finalStock })
            });
            set((state) => ({
                assignments: state.assignments.map((a) => a.id === id ? result.assignment : a),
                isLoading: false
            }));
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    getActiveAssignmentByUser: (nik) => {
        return get().assignments.find(a =>
            (a.cashierId === nik || a.driverId === nik) &&
            (a.status === 'Active' || a.status === 'Ready')
        );
    },
}));
