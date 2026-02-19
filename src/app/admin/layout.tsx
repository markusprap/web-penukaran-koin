'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    History,
    Layers,
    FileText,
    Users,
    Store,
    Truck,
    LogOut,
    Bell,
    ClipboardList,
    User,
    ChevronDown,
    Building2
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useMasterDataStore } from '@/store/useMasterDataStore';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [txMenuOpen, setTxMenuOpen] = useState(false);

    // Auto-open transaction dropdown when on transaction pages
    useEffect(() => {
        if (pathname?.startsWith('/admin/transactions') || pathname?.startsWith('/admin/walk-in')) {
            setTxMenuOpen(true);
        }
    }, [pathname]);

    useEffect(() => {
        // Allow access to login page
        if (pathname === '/admin/login') {
            setIsAuthorized(true);
            return;
        }

        // Normalize roles for comparison
        const userRole = user?.role?.toUpperCase();
        const isAdminRole = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

        if (!isAuthenticated || !user || !isAdminRole) {
            router.replace('/admin/login');
        } else if (pathname === '/admin/users' && userRole !== 'SUPER_ADMIN') {
            // Protect USERS page from regular admin
            router.replace('/admin');
        } else {
            setIsAuthorized(true);
            // Sync Master Data
            useMasterDataStore.getState().fetchMasterData();
        }
    }, [pathname, isAuthenticated, user, router]);

    // Prevent flashing content before redirect
    if (!isAuthorized && pathname !== '/admin/login') {
        return null;
    }

    // Special layout for login page (full screen, no sidebar)
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    const isTransactionActive = pathname === '/admin/transactions';
    const isWalkInActive = pathname === '/admin/walk-in';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col sticky top-0 h-screen hidden lg:flex">
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[var(--indomaret-blue)] rounded-lg flex items-center justify-center text-white font-bold">C</div>
                        <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white">COIN<span className="text-[var(--indomaret-red)]">ADMIN</span></span>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1 mt-4">
                    <NavLink href="/admin" icon={<LayoutDashboard size={20} />} label="Dashboard" active={pathname === '/admin'} />

                    {/* Transaksi Dropdown */}
                    <div>
                        <button
                            onClick={() => setTxMenuOpen(!txMenuOpen)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${isTransactionActive || isWalkInActive
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-[var(--indomaret-blue)]'
                                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <History size={20} />
                            <span className="flex-1 text-left">Transaksi</span>
                            <ChevronDown size={16} className={`transition-transform duration-200 ${txMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {txMenuOpen && (
                            <div className="mt-1 ml-7 pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-1">
                                <Link
                                    href="/admin/transactions"
                                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-[13px] font-semibold ${isTransactionActive
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-[var(--indomaret-blue)]'
                                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    <History size={16} />
                                    Transaksi Lapangan
                                </Link>
                                <Link
                                    href="/admin/walk-in"
                                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-[13px] font-semibold ${isWalkInActive
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-[var(--indomaret-blue)]'
                                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    <Building2 size={16} />
                                    Transaksi Kantor
                                </Link>
                            </div>
                        )}
                    </div>

                    <NavLink href="/admin/stock" icon={<Layers size={20} />} label="Manajemen Stok" active={pathname === '/admin/stock'} />
                    <NavLink href="/admin/assignments" icon={<ClipboardList size={20} />} label="Manajemen Penugasan" active={pathname === '/admin/assignments'} />

                    <div className="pt-4 pb-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Data</div>
                    <NavLink href="/admin/stores" icon={<Store size={20} />} label="Master Toko" active={pathname === '/admin/stores'} />
                    <NavLink href="/admin/vehicles" icon={<Truck size={20} />} label="Master Armada" active={pathname === '/admin/vehicles'} />

                    {user?.role?.toUpperCase() === 'SUPER_ADMIN' && (
                        <>
                            <div className="pt-4 pb-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-50 dark:border-slate-800/50 mt-4">Sistem</div>
                            <NavLink href="/admin/users" icon={<Users size={20} />} label="Manajemen User" active={pathname === '/admin/users'} />
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <Link href="/" className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-bold text-sm">
                        <LogOut size={20} />
                        <span>Keluar Panel</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="flex-1"></div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <div className="h-8 w-px bg-slate-200 dark:border-slate-800 mx-2"></div>
                        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                        </button>
                        <div className="h-8 w-px bg-slate-200 dark:border-slate-800 mx-2"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{user?.role?.toUpperCase() === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin Finance'}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-70">{user?.full_name || 'Staff'}</p>
                            </div>
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500">
                                <User size={24} />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

function NavLink({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${active
                ? 'bg-blue-50 dark:bg-blue-900/30 text-[var(--indomaret-blue)]'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
        >
            {icon}
            <span>{label}</span>
        </Link>
    );
}

