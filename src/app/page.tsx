'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { Smartphone, Monitor } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Sistem Manajemen Penukaran Koin
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Pilih portal untuk melanjutkan aktivitas Anda
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* Field App Access */}
          <button
            onClick={() => router.push('/app')}
            className="flex flex-col items-center p-10 bg-white dark:bg-slate-800 rounded-3xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all border-b-8 border-[var(--indomaret-blue)] group"
          >
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-6 group-hover:bg-[var(--indomaret-blue)] group-hover:text-white transition-colors text-[var(--indomaret-blue)]">
              <Smartphone size={64} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Aplikasi Penukaran Koin</h2>
            <p className="text-slate-500 text-center">
              Khusus Tim Lapangan (Driver & Kasir) untuk input data di toko.
            </p>
          </button>

          {/* Admin Dashboard Access */}
          <button
            onClick={() => router.push('/admin/login')}
            className="flex flex-col items-center p-10 bg-white dark:bg-slate-800 rounded-3xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all border-b-8 border-[var(--indomaret-red)] group"
          >
            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl mb-6 group-hover:bg-[var(--indomaret-red)] group-hover:text-white transition-colors text-[var(--indomaret-red)]">
              <Monitor size={64} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Dashboard Manajemen</h2>
            <p className="text-slate-500 text-center">
              Khusus Tim Admin untuk monitoring, stok, dan manajemen user.
            </p>
          </button>
        </div>

        <div className="pt-12">
          <p className="text-sm text-slate-400">Indomaret Finance Management System • v1.0.0-prototype</p>
        </div>
      </div>
    </main>
  );
}
