import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiFetch } from '@/lib/api';

export interface CoinDenom {
    denom: number;
    qty: number;
}

export interface Transaction {
    id: string;
    timestamp: string;
    storeCode: string;
    storeName: string;
    storeAddress?: string;
    storeTeamName: string;
    storeTeamWa?: string;
    storeTeamPosition?: string;
    vehicle?: string;
    coins: CoinDenom[];
    bigMoney: CoinDenom[];
    totalCoin: number;
    totalBigMoney: number;
    signaturePetugas?: string;
    signatureToko?: string;
    photo?: string;
}

interface TransactionState {
    history: Transaction[];
    currentTransaction: Partial<Transaction> | null;

    startNewTransaction: (assignedStock?: Record<number, number>) => void;
    updateStep1: (storeCode: string, storeName: string, storeAddress: string, storeTeamName: string, storeTeamWa: string, storeTeamPosition: string, vehicle: string) => void;
    updateCoins: (coins: CoinDenom[]) => void;
    updateBigMoney: (bigMoney: CoinDenom[]) => void;
    completeTransaction: (signaturePetugas: string, signatureToko: string, photo: string) => void;
    clearCurrentTransaction: () => void;
    fetchHistory: () => Promise<void>;
}

export const useTransactionStore = create<TransactionState>()(
    persist(
        (set, get) => ({
            history: [],
            currentTransaction: null,

            startNewTransaction: (assignedStock) => {
                // If assignedStock is provided, only include denoms that have qty > 0
                const allCoinDenoms = [100, 200, 500, 1000, 2000, 5000, 10000, 20000];
                const coins = assignedStock
                    ? allCoinDenoms
                        .filter(d => (assignedStock[d] || 0) > 0)
                        .map(d => ({ denom: d, qty: 0 }))
                    : allCoinDenoms.map(d => ({ denom: d, qty: 0 }));

                set({
                    currentTransaction: {
                        coins,
                        bigMoney: [
                            { denom: 50000, qty: 0 },
                            { denom: 100000, qty: 0 },
                        ]
                    }
                });
            },

            updateStep1: (code, name, address, teamName, wa, position, vehicle) => set((state) => ({
                currentTransaction: {
                    ...state.currentTransaction,
                    storeCode: code,
                    storeName: name,
                    storeAddress: address,
                    storeTeamName: teamName,
                    storeTeamWa: wa,
                    storeTeamPosition: position,
                    vehicle
                }
            })),

            updateCoins: (coins) => set((state) => ({
                currentTransaction: { ...state.currentTransaction, coins }
            })),

            updateBigMoney: (bigMoney) => set((state) => ({
                currentTransaction: { ...state.currentTransaction, bigMoney }
            })),

            completeTransaction: async (sigP, sigT, photo) => {
                const { currentTransaction, history } = get();
                if (!currentTransaction) return;

                const totalCoin = (currentTransaction.coins || []).reduce((acc, c) => acc + (c.denom * c.qty), 0);
                const totalBigMoney = (currentTransaction.bigMoney || []).reduce((acc, c) => acc + (c.denom * c.qty), 0);

                const newTx: Transaction = {
                    ...currentTransaction as Transaction,
                    id: `TX-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    totalCoin,
                    totalBigMoney,
                    signaturePetugas: sigP,
                    signatureToko: sigT,
                    photo
                };

                // Sync with Backend (Only Metadata)
                try {
                    const { useAuthStore } = await import('./useAuthStore');
                    const authState = useAuthStore.getState();

                    await apiFetch('/transactions', {
                        method: 'POST',
                        body: JSON.stringify({
                            source: 'field', // Explicitly set to field to prevent double stock deduction
                            userNik: authState.user?.nik,
                            storeCode: currentTransaction.storeCode,
                            vehicleNopol: authState.vehicle, // Using Nopol from auth store
                            totalCoin,
                            totalBigMoney,
                            storeTeamName: currentTransaction.storeTeamName,
                            storeTeamWa: currentTransaction.storeTeamWa,
                            storeTeamPosition: currentTransaction.storeTeamPosition,
                            details: [
                                ...(currentTransaction.coins || []).map(c => ({ denom: c.denom, qty: c.qty, type: 'COIN' })),
                                ...(currentTransaction.bigMoney || []).map(c => ({ denom: c.denom, qty: c.qty, type: 'BIG_MONEY' }))
                            ]
                        })
                    });
                } catch (error) {
                    console.error('Failed to sync transaction to backend:', error);
                    // We still save locally even if backend fails
                }

                set({
                    history: [newTx, ...history]
                });
            },

            clearCurrentTransaction: () => set({ currentTransaction: null }),

            fetchHistory: async () => {
                try {
                    const data = await apiFetch('/transactions?source=field');

                    // Transform backend data to match Transaction interface if needed
                    // Assumes backend returns data matching the Transaction interface or close enough
                    // We might need to map fields if they differ significantly, but based on controller they look similar

                    const mappedHistory: Transaction[] = data.map((tx: any) => ({
                        id: tx.id,
                        timestamp: tx.timestamp,
                        storeCode: tx.storeCode,
                        storeName: tx.store?.name || 'Unknown Store', // Join with store
                        storeAddress: tx.store?.address,
                        storeTeamName: tx.storeTeamName,
                        storeTeamWa: tx.storeTeamWa,
                        storeTeamPosition: tx.storeTeamPosition,
                        vehicle: tx.vehicleNopol,
                        coins: tx.details?.filter((d: any) => d.type === 'COIN') || [],
                        bigMoney: tx.details?.filter((d: any) => d.type === 'BIG_MONEY') || [],
                        totalCoin: tx.totalCoin,
                        totalBigMoney: tx.totalBigMoney,
                        signaturePetugas: '', // Not stored in main tx object usually, might need adjustment if crucial
                        signatureToko: '',
                        photo: ''
                    }));

                    set({ history: mappedHistory });
                } catch (error) {
                    console.error('Failed to fetch transaction history:', error);
                }
            }
        }),
        {
            name: 'transaction-storage',
            partialize: (state) => ({ history: state.history }), // Only persist history, NOT currentTransaction
            version: 1, // Increment version to invalidate old 'ghost' data
            migrate: (persistedState: any, version: number) => {
                // If the version is old, just return a fresh state for the persisted parts
                if (version === 0) {
                    return { history: [] };
                }
                return persistedState;
            },
        }
    )
);
