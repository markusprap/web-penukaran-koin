import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Hook that waits for Zustand persist to hydrate from localStorage.
 * This prevents auth guards from redirecting to login before the store
 * has had a chance to load persisted state (which causes logout on refresh).
 */
export function useHydration() {
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        // Check if already hydrated
        const unsub = useAuthStore.persist.onFinishHydration(() => {
            setHydrated(true);
        });

        // If hydration already happened before this effect ran
        if (useAuthStore.persist.hasHydrated()) {
            setHydrated(true);
        }

        return () => {
            unsub();
        };
    }, []);

    return hydrated;
}
