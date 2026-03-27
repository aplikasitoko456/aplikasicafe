# Blueprint Aplikasi Cafe Bajibun (POS & Accounting System)

Blueprint ini dirancang untuk memberikan instruksi lengkap kepada AI atau pengembang agar dapat membangun kembali aplikasi dengan struktur, logika, dan fitur yang identik.

## 1. Konsep Utama
Aplikasi manajemen cafe "All-in-One" yang mengintegrasikan:
- **Point of Sale (POS)**: Pencatatan pesanan dan antrian.
- **Accounting (Akuntansi)**: Pencatatan jurnal otomatis dari penjualan, manajemen aset, dan laporan keuangan (Laba Rugi & Neraca).
- **Inventory & Assets**: Simulasi penyusutan aset tetap dan penyesuaian persediaan.

## 2. Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion (untuk animasi), Lucide React (untuk ikon).
- **Backend**: Node.js dengan Express.
- **Database**: PostgreSQL (direkomendasikan menggunakan Neon Serverless).
- **Timezone Handling**: Menggunakan waktu lokal (Local Time) untuk semua pencatatan transaksi agar sesuai dengan waktu operasional toko.

## 3. Struktur Database (Schema)

### Tabel `items` (Menu)
- `id`: SERIAL PRIMARY KEY
- `name`: TEXT
- `category`: TEXT (Makanan/Minuman)
- `price_per_portion`: NUMERIC

### Tabel `accounts` (Bagan Akun / COA)
- `id`: SERIAL PRIMARY KEY
- `category`: TEXT (Aset, Kewajiban, Ekuitas, Pendapatan, Beban)
- `sub_category`: TEXT (Aset Lancar, Aset Tetap, dll)
- `account_name`: TEXT (Unique)

### Tabel `orders` (Transaksi & Antrian)
- `id`: SERIAL PRIMARY KEY
- `queue_number`: TEXT
- `total_amount`: NUMERIC
- `items_json`: TEXT (JSON string berisi detail item)
- `customer_name`: TEXT
- `table_number`: TEXT
- `status`: TEXT (processing/completed)
- `created_at`: TIMESTAMP (Disimpan dalam waktu lokal)

### Tabel `journal_entries` (Buku Besar)
- `id`: SERIAL PRIMARY KEY
- `transaction_id`: TEXT (ID unik untuk mengelompokkan debit/kredit)
- `account_name`: TEXT
- `description`: TEXT
- `debit`: NUMERIC
- `credit`: NUMERIC
- `date`: TIMESTAMP (Disimpan dalam waktu lokal)

### Tabel `assets` (Aset Tetap)
- `id`: SERIAL PRIMARY KEY
- `name`: TEXT
- `kelompok`: TEXT (1, 2, 3, 4, Bangunan Permanen/Tidak)
- `purchase_date`: DATE
- `acquisition_cost`: NUMERIC
- `jenis`: TEXT

## 4. Logika Bisnis Utama

### A. Point of Sale (POS)
1. **Pencatatan Pesanan**: Saat transaksi diproses, sistem harus:
   - Membuat record di tabel `orders`.
   - Membuat record jurnal otomatis di `journal_entries`:
     - **Debit**: Kas (Aset Lancar)
     - **Kredit**: Penjualan (Pendapatan Usaha)
2. **Nomor Antrian**: Dihitung berdasarkan jumlah transaksi pada hari yang sama (reset setiap hari).

### B. Antrian (Queue)
- **Proses**: Menampilkan semua order dengan status `processing`.
- **Selesai**: Menampilkan order status `completed` **hanya untuk hari ini saja**.

### C. Akuntansi & Laporan
1. **Double-Entry**: Setiap input jurnal manual harus divalidasi agar total Debit = total Kredit.
2. **Laporan Laba Rugi**: 
   - Pendapatan = Total Kredit di akun Pendapatan.
   - Beban = Total Debit di akun Beban.
   - Laba Bersih = Pendapatan - Beban.
3. **Laporan Neraca**:
   - Aset = (Debit - Kredit) untuk kategori Aset.
   - Kewajiban = (Kredit - Debit) untuk kategori Kewajiban.
   - Ekuitas = (Kredit - Debit) untuk kategori Ekuitas + Laba Bersih.
   - Rumus: Aset = Kewajiban + Ekuitas.

### D. Manajemen Aset (Penyusutan)
Menggunakan metode Garis Lurus (Straight Line) dengan tarif pajak Indonesia:
- Kelompok 1: 25% per tahun
- Kelompok 2: 12.5% per tahun
- Kelompok 3: 6.25% per tahun
- Kelompok 4: 5% per tahun
- Bangunan Permanen: 5% per tahun
- Bangunan Tidak Permanen: 10% per tahun

## 5. Desain UI/UX (Visual Identity)

### Tema Warna (Tailwind Config)
- `cafe-cream`: `#FDFCF7` (Background utama)
- `cafe-olive`: `#5A5A40` (Warna brand/primer)
- `cafe-accent`: `#D4A373` (Warna aksen/harga)
- `cafe-ink`: `#1A1A1A` (Warna teks gelap)

### Komponen Kunci
- **Sticky Header**: Header tetap terlihat saat scroll, berisi Nama Cafe, Alamat, dan background image dengan overlay gradient.
- **Bottom Navigation**: Navigasi utama (Kasir, Antrian, Omset, Laporan, Admin) yang menempel di bawah.
- **Bento Grid**: Layout menu kasir menggunakan grid 2 kolom yang responsif.
- **Typography**: Menggunakan font Serif untuk judul (Playfair Display/Georgia) dan Sans-Serif untuk data (Inter/Helvetica).

## 6. Instruksi Implementasi untuk AI
"Buatlah aplikasi Full-stack menggunakan React dan Express. Gunakan Tailwind CSS untuk styling dengan palet warna cafe (cream, olive, accent). Implementasikan sistem POS yang terintegrasi langsung dengan jurnal akuntansi double-entry. Pastikan semua pencatatan tanggal menggunakan waktu lokal (GMT+8 atau sesuai input user) dan simpan sebagai string atau timestamp yang konsisten. Gunakan PostgreSQL untuk database dengan tabel items, accounts, journal_entries, orders, dan assets. Tambahkan fitur laporan Laba Rugi dan Neraca yang dihitung secara real-time dari tabel jurnal."
