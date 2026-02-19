'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AppEntry() {
    const router = useRouter();

    useEffect(() => {
        // Basic redirect to login as the entry point for Field App
        router.replace('/app/login');
    }, [router]);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[var(--indomaret-blue)] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
}
