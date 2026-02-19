import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

// Interfaces based on existing JSON structure
export interface User {
    nik: string;
    password?: string;
    full_name: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'FIELD';
    position: 'ADMIN' | 'CASHIER' | 'DRIVER';
}

export interface Store {
    code: string;
    name: string;
    address: string;
    area_spv: string; // Renamed from as
    area_mgr: string; // Renamed from am
    branch: string;
}

export interface Vehicle {
    id: string;
    nopol: string;
    brand: string;
    type: string;
    description: string;
}

export interface StockInventory {
    [denom: number]: number;
}

export interface RouteAssignment {
    id: string;
    vehicleId: string;
    date: string;
    storeCodes: string[];
    currentStopIndex?: number; // 0 to length-1
    status: 'Active' | 'Completed' | 'Ready';
}

interface MasterDataState {
    users: User[];
    stores: Store[];
    vehicles: Vehicle[];
    stockInventory: StockInventory;

    // User Actions
    addUser: (user: User) => void;
    updateUser: (nik: string, data: Partial<User>) => void;
    deleteUser: (nik: string) => void;

    // Store Actions
    addStore: (store: Store) => void;
    updateStore: (code: string, data: Partial<Store>) => void;
    deleteStore: (code: string) => void;

    // Vehicle Actions
    addVehicle: (vehicle: Vehicle) => void;
    updateVehicle: (id: string, data: Partial<Vehicle>) => void;
    deleteVehicle: (id: string) => void;


    // Inventory Actions
    updateStock: (denom: number, qty: number, mode: 'add' | 'set' | 'remove') => void;
    saveStockToServer: (stock: StockInventory) => Promise<void>;
    fetchStock: () => Promise<void>;

    // Route Actions
    routes: RouteAssignment[];
    assignRoute: (route: RouteAssignment) => void;
    updateRouteProgress: (routeId: string, progressIndex: number, status: RouteAssignment['status']) => void;
    deleteRoute: (routeId: string) => void;

    // Reset Data (for testing)
    resetToDefault: () => void;
    fetchMasterData: () => Promise<void>;
    resetSystemData: () => Promise<void>;
}

export const useMasterDataStore = create<MasterDataState>()(
    (set, get) => ({
        users: [],
        stores: [],
        vehicles: [],
        stockInventory: {
            100: 0,
            200: 0,
            500: 0,
            1000: 0,
            2000: 0,
            5000: 0,
            10000: 0,
            20000: 0,
            50000: 0,
            100000: 0
        },

        fetchMasterData: async () => {
            try {
                const [users, stores, vehicles, assignments, stock] = await Promise.all([
                    apiFetch('/users'),
                    apiFetch('/stores'),
                    apiFetch('/vehicles'),
                    apiFetch('/assignments'),
                    apiFetch('/stock')
                ]);
                set({ users, stores, vehicles, routes: assignments, stockInventory: stock });
            } catch (error) {
                console.error('Failed to sync master data:', error);
            }
        },

        resetSystemData: async () => {
            try {
                await apiFetch('/system/reset-data', { method: 'POST' });
                // Refresh data after reset
                await get().fetchMasterData();
            } catch (error) {
                console.error("Failed to reset system data:", error);
                throw error;
            }
        },

        fetchStock: async () => {
            try {
                const stock = await apiFetch('/stock');
                set({ stockInventory: stock });
            } catch (error) {
                console.error('Failed to fetch stock:', error);
            }
        },

        // User Actions
        addUser: async (user) => {
            await apiFetch('/users', { method: 'POST', body: JSON.stringify(user) });
            set((state) => ({ users: [...state.users, user] }));
        },
        updateUser: async (nik, data) => {
            await apiFetch(`/users/${nik}`, { method: 'PUT', body: JSON.stringify(data) });
            set((state) => ({
                users: state.users.map((u) => (u.nik === nik ? { ...u, ...data } : u)),
            }));
        },
        deleteUser: async (nik) => {
            await apiFetch(`/users/${nik}`, { method: 'DELETE' });
            set((state) => ({
                users: state.users.filter((u) => u.nik !== nik),
            }));
        },

        // Store Actions
        addStore: async (store) => {
            await apiFetch('/stores', { method: 'POST', body: JSON.stringify(store) });
            set((state) => ({ stores: [...state.stores, store] }));
        },
        updateStore: async (code, data) => {
            await apiFetch(`/stores/${code}`, { method: 'PUT', body: JSON.stringify(data) });
            set((state) => ({
                stores: state.stores.map((s) => (s.code === code ? { ...s, ...data } : s)),
            }));
        },
        deleteStore: async (code) => {
            await apiFetch(`/stores/${code}`, { method: 'DELETE' });
            set((state) => ({
                stores: state.stores.filter((s) => s.code !== code),
            }));
        },

        // Vehicle Actions
        addVehicle: async (vehicle) => {
            await apiFetch('/vehicles', { method: 'POST', body: JSON.stringify(vehicle) });
            set((state) => ({ vehicles: [...state.vehicles, vehicle] }));
        },
        updateVehicle: async (id, data) => {
            // Mapping id to nopol in API
            await apiFetch(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
            set((state) => ({
                vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, ...data } : v)),
            }));
        },
        deleteVehicle: async (id) => {
            await apiFetch(`/vehicles/${id}`, { method: 'DELETE' });
            set((state) => ({
                vehicles: state.vehicles.filter((v) => v.id !== id),
            }));
        },


        // Inventory Actions
        updateStock: (denom, qty, mode) => {
            const state = get();
            const current = state.stockInventory[denom] || 0;
            let newQty = current;
            if (mode === 'set') newQty = qty;
            if (mode === 'add') newQty = current + qty;
            if (mode === 'remove') newQty = Math.max(0, current - qty);

            const newInventory = {
                ...state.stockInventory,
                [denom]: newQty
            };
            set({ stockInventory: newInventory });
        },

        saveStockToServer: async (stock) => {
            try {
                const updated = await apiFetch('/stock', {
                    method: 'PUT',
                    body: JSON.stringify(stock)
                });
                set({ stockInventory: updated });
            } catch (error) {
                console.error('Failed to save stock to server:', error);
                throw error;
            }
        },

        // Route Actions
        routes: [],
        assignRoute: async (route) => {
            await apiFetch('/assignments', { method: 'POST', body: JSON.stringify(route) });
            set((state) => ({ routes: [route, ...state.routes] }));
        },
        updateRouteProgress: (routeId, progressIndex, status) => set((state) => ({
            routes: state.routes.map(r => r.id === routeId ? { ...r, currentStopIndex: progressIndex, status } : r)
        })),
        deleteRoute: (routeId) => set((state) => ({
            routes: state.routes.filter(r => r.id !== routeId)
        })),

        // Reset
        resetToDefault: () => set({
            users: [],
            stores: [],
            vehicles: [],
            routes: [],
            stockInventory: {
                100: 0,
                200: 0,
                500: 0,
                1000: 0,
                2000: 0,
                5000: 0,
                10000: 0,
                20000: 0,
                50000: 0,
                100000: 0
            }
        })
    })
);
