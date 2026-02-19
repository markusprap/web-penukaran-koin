# Product Requirements Document (PRD): Penukaran Koin Web

## 1. Product Overview
Aplikasi berbasis web (Mobile-Friendly) yang mengintegrasikan operasional gudang logistik dengan petugas lapangan untuk manajemen distribusi koin secara *end-to-end*.

## 2. User Stories
- **Sebagai Finance Admin**, saya ingin membuat penugasan rute (Route Assignment) agar Driver/Kasir tahu toko mana saja yang harus dikunjungi.
- **Sebagai Kasir Lapangan**, saya ingin melakukan input detail penukaran koin agar saldo stok modal saya ter-update otomatis.
- **Sebagai Driver**, saya ingin melihat sisa koin di dalam kendaraan agar saya tahu kapan harus kembali ke gudang untuk isi ulang (refill).
- **Sebagai Manager**, saya ingin melihat daftar transaksi harian untuk memastikan semua target penukaran tercapai.

## 3. Functional Requirements
### 3.1. User Management & Auth
- Login menggunakan NIK dan Password yang aman.
- Role-based Access: Finance Admin (Full Access), Field (Input & View Personal Stock).

### 3.2. Transaction Module
- Input Denominasi: Input nominal Rupiah, sistem hitung Qty keping/lembar otomatis.
- Validasi "Uang Besar": Sistem memvalidasi kesamaan total koin yang diberikan dengan uang besar yang diterima (reconcile).
- Bukti Digital: Integrasi Kamera (Foto) dan Canvas (Signature).

### 3.3. Assignment & Route
- Admin dapat memilih daftar toko untuk satu penugasan rute.
- Status rute: Active, Completed.

### 3.4. Stock Inventory
- Warehouse Stock: Update manual oleh Finance Admin atau otomatis saat transaksi *walk-in*.
- User Stock: Berkurang otomatis saat input penukaran di toko, bertambah saat Finance Admin memberi modal.

## 4. Non-Functional Requirements
- **Performance**: Halaman dashboard harus load dalam < 3 detik.
- **Security**: Data sensitif (NIK, Password) terenkripsi di database.
- **Mobile First**: UI harus fully responsive untuk digunakan di smartphone petugas.

## 5. Technical Stack Summary
- **Frontend**: Next.js 16 (App Router), React 19.
- **State Management**: Zustand (Client-side sync).
- **Backend**: Express.js (Node.js).
- **ORM**: Prisma (PostgreSQL).
- **Storage**: Supabase (untuk simpan foto bukti).

## 6. Post-Launch Plan
- Iterasi Offline Sync: Memastikan petugas tetap bisa input meski sinyal hilang.
- Push Notification: Notifikasi ke HP admin jika ada penukaran dengan selisih nominal.

---
*Drafted by Sarah (Product Manager)*
