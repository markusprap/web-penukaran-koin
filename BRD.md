# Business Requirements Document (BRD): Penukaran Koin Web

## 1. Executive Summary
Proses penukaran koin (pecahan kecil) antara gudang pusat dan jaringan toko saat ini masih menghadapi tantangan dalam hal transparansi, akurasi stok, dan risiko fraud. **Penukaran Koin Web** hadir sebagai solusi digital untuk mengotomatisasi pencatatan, pemantauan stok secara real-time, dan penguatan bukti serah terima.

## 2. Business Objectives
- **Akurasi Stok 100%**: Menghilangkan selisih antara koin yang keluar dari gudang dengan yang diterima oleh toko.
- **Fraud Prevention**: Mengurangi risiko kehilangan uang dengan bukti foto dan tanda tangan digital.
- **Efisiensi Operasional**: Mempercepat proses admin dalam melakukan rekonsiliasi harian.
- **Data-Driven Decision**: Memberikan visibilitas kepada manajemen mengenai pola kebutuhan koin di setiap wilayah.

## 3. Stakeholders
| Stakeholder | Role | Responsibility |
| :--- | :--- | :--- |
| **Finance Admin / Team** | Operations & Audit | Mengelola stok koin, membuat penugasan Driver/Kasir, dan melakukan audit aliran kas/stok. |
| **Field Team (Driver/Kasir)** | Primary User | Melakukan eksekusi penukaran koin di lokasi toko. |
| **Store Team** | Secondary User | Melakukan verifikasi penerimaan koin di sisi toko. |

## 4. Business Requirements
### 4.1. Inventory Management
- Sistem harus mampu melacak stok koin berdasarkan denominasi (100, 200, 500, dst).
- Sistem harus memisahkan saldo stok Gudang (Warehouse) dan stok Modal Jalan (User Stock).

### 4.2. Transaction Flow (Digital Proof)
- Setiap transaksi wajib dilampirkan bukti foto serah terima di lokasi.
- Kasir dan perwakilan toko wajib membubuhkan tanda tangan digital di aplikasi.

### 4.3. Reporting & Audit Trail
- Sistem harus mencatat log setiap perubahan stok secara detail (siapa, kapan, denominasi apa).
- Tersedianya fitur export data transaksi untuk keperluan audit eksternal.

## 5. Success Metrics (KPIs)
1. **Zero Variance**: Tidak ada selisih saldo koin dari gudang sampai ke toko.
2. **Adoption Rate**: 100% rute penukaran tercatat secara digital (tidak ada lagi nota manual).
3. **Reconciliation Speed**: Proses setoran akhir hari yang 2x lebih cepat dibanding proses manual.

---
*Drafted by Sarah (Product Manager)*
