<div align="center">

# <img src="public/favicon.svg" width="36" height="36" style="vertical-align: middle; margin-right: 4px;" /> Job Tracker

![React](https://img.shields.io/badge/React-19-20d5fd?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=flat-square&logo=supabase&logoColor=white)

</div>

- - -

## Deskripsi Proyek

Job Tracker adalah aplikasi web modern dan profesional yang dirancang khusus untuk mempermudah pencari kerja dalam mengelola, melacak, dan menganalisis seluruh proses lamaran pekerjaan mereka secara terpusat. Aplikasi ini dibangun di atas arsitektur Single Page Application (SPA) berbasis React, TypeScript, dan Tailwind CSS, dengan dukungan integrasi database serta autentikasi kustom melalui serverless backend Supabase Edge Functions. Sistem ini didesain menggunakan pendekatan Notion-inspired paper design yang monokromatis dan berestetika premium untuk memberikan kenyamanan navigasi yang optimal tanpa beban kognitif tinggi bagi penggunanya.

- - -

## Fitur Utama

- Manajemen Lamaran Kerja: Pencatatan posisi, perusahaan, status lamaran, prioritas, jenis pekerjaan, gaji, tautan lowongan portal eksternal, nama perekrut, tenggat waktu, hingga catatan terperinci.
- Laporan Analitik Interaktif: Dashboard visual yang menampilkan metrik total lamaran aktif, grafik persentase respon wawancara, rasio penawaran kerja, daftar perusahaan impian, dan perkembangan tahapan lamaran secara langsung.
- Kanban Board: Pengelompokan status lamaran secara visual untuk memudahkan penelusuran tahapan (Wishlist, Applied, HR Screening, Technical Test, User Interview, HR Interview, Final Interview, Offer, Accepted, Rejected, Withdrawn).
- Kalender Penjadwalan: Visualisasi tenggat waktu pengiriman berkas serta jadwal wawancara kerja terintegrasi.
- Manajemen Kontak Perekrut: Penyimpanan data jaringan profesional seperti email, nomor telepon, dan tautan profil LinkedIn perekrut yang terhubung langsung dengan setiap entitas lamaran.
- Manajemen Dokumen Pendukung: Pemuatan berkas portofolio, CV, surat lamaran, serta preview dokumen terintegrasi (PDF, Gambar, dan Teks) tanpa perlu mengunduh file terlebih dahulu.
- Sistem Keamanan & Autentikasi Kustom: Autentikasi aman yang diproses melalui Supabase Edge Functions dengan validasi ketat dan hash enkripsi kata sandi menggunakan Bcrypt.
- Lokalisasi Penuh (Multi-bahasa): Dukungan pergantian bahasa secara langsung (Bahasa Indonesia dan Bahasa Inggris) dengan pengaturan tersimpan.
- Desain Responsif & Premium: Tampilan yang sepenuhnya dioptimalkan baik untuk perangkat desktop beresolusi tinggi maupun perangkat seluler dengan animasi transisi yang sangat halus menggunakan Framer Motion.

- - -

## Struktur Proyek

Berikut adalah struktur direktori utama proyek yang bersih dari file penunjang yang diabaikan oleh Git:

```text
job-tracker/
├── public/                   # Aset statis aplikasi (Favicon, logo, gambar)
├── src/                      # Direktori utama kode sumber aplikasi
│   ├── app/                  # Entry point routing dan inisialisasi aplikasi
│   ├── components/           # Komponen antarmuka pengguna (UI) reusable
│   │   ├── common/           # Komponen dasar (Avatar, badge, dialog, logo)
│   │   ├── layout/           # Komponen tata letak (AppShell, sidebar, topbar)
│   │   └── ui/               # Komponen dasar Radix UI dan elemen primitif
│   ├── constants/            # Berkas penyimpanan variabel konstanta global
│   ├── contexts/             # React Context untuk manajemen state global
│   │   ├── AuthContext.tsx   # Manajemen sesi autentikasi dan otorisasi pengguna
│   │   └── ThemeContext.tsx  # Manajemen pergantian mode tema aplikasi
│   ├── hooks/                # Kustom React hooks untuk logika terbagi
│   ├── i18n/                 # Konfigurasi lokalisasi dan file terjemahan
│   │   └── locales/          # Kamus terjemahan (en.json, id.json)
│   ├── integrations/         # Penghubung client dengan server eksternal
│   │   └── supabase/         # Konfigurasi instansiasi Supabase client SDK
│   ├── lib/                  # Fungsi pembantu utilitas eksternal (toast, format, utils)
│   ├── pages/                # Halaman utama aplikasi berbasis rute
│   │   └── applications/     # Halaman daftar dan detail manajemen lamaran
│   ├── routes/               # Konfigurasi routing modular aplikasi
│   ├── services/             # Deklarasi fungsi layanan API (CRUD data)
│   ├── types/                # Pendefinisian tipe data TypeScript
│   ├── routeTree.gen.ts      # Berkas routing otomatis hasil generate TanStack Router
│   ├── router.tsx            # Konfigurasi router utama aplikasi
│   ├── server.ts             # Integrasi server-side rendering
│   ├── start.ts              # Konfigurasi bootstrap awal aplikasi
│   └── styles.css            # Berkas CSS global utama dan konfigurasi Tailwind
├── supabase/                 # Konfigurasi lokal Supabase Edge Functions
│   └── functions/            # Direktori serverless function
│       └── auth/             # Fungsi serverless penanganan autentikasi (index.ts)
├── .env.example              # Contoh konfigurasi variabel lingkungan
├── .gitignore                # Berkas pengecualian pelacakan Git
├── .prettierignore           # Pengecualian pemformatan Prettier
├── .prettierrc               # Konfigurasi pemformatan kode Prettier
├── components.json           # Konfigurasi eksternal komponen UI
├── eslint.config.js          # Konfigurasi aturan linter proyek
├── package-lock.json         # Log penguncian versi dependensi npm
├── package.json              # Daftar dependensi dan perintah kerja npm
├── tsconfig.json             # Konfigurasi compiler TypeScript
└── vite.config.ts            # Konfigurasi build tool Vite
```

- - -

## Kebutuhan Sistem & Requirement

- Node.js versi 18.0 atau yang lebih baru
- npm versi 9.0 atau yang lebih baru
- Akun atau instansi Supabase lokal/cloud yang aktif

- - -

## Petunjuk Setup Environment

1. Salin repositori proyek ke komputer lokal Anda:
   ```bash
   git clone https://github.com/azharangga/job-tracker.git
   ```

2. Buat berkas konfigurasi variabel lingkungan di direktori utama dengan menyalin contoh yang telah disediakan:
   ```bash
   cp .env.example .env
   ```

3. Buka berkas `.env` dan isi variabel lingkungan yang dibutuhkan menggunakan kredensial proyek Supabase Anda:
   ```env
   VITE_SUPABASE_URL=https://proyek-supabase-anda.supabase.co
   VITE_SUPABASE_ANON_KEY=kunci-anon-proyek-supabase-anda
   ```

4. Instal seluruh dependensi perangkat lunak yang dideklarasikan pada proyek menggunakan npm:
   ```bash
   npm install
   ```

- - -

## Cara Menjalankan Aplikasi

### Mode Pengembangan (Development)

Untuk menjalankan server pengembangan lokal dengan fitur Hot Module Replacement (HMR) aktif, jalankan perintah berikut:
```bash
npm run dev
```
Setelah berjalan, Anda dapat mengakses antarmuka aplikasi melalui browser di tautan `http://localhost:5173`.

### Mode Produksi (Production Build)

1. Lakukan kompilasi seluruh kode sumber TypeScript dan React menjadi bundel produksi yang dioptimalkan:
   ```bash
   npm run build
   ```

2. Pratinjau hasil build produksi secara lokal sebelum melakukan deployment akhir:
   ```bash
   npm run preview
   ```

### Penyelarasan Standar Kode (Linting & Formatting)

Untuk memeriksa potensi kesalahan penulisan kode sumber dan merapikan format berkas secara otomatis, jalankan perintah:
```bash
# Memeriksa standar kode
npm run lint

# Merapikan format penulisan berkas
npm run format
```

- - -

## Pengujian (Testing)

Proyek ini telah dikonfigurasi untuk memvalidasi tipe data statis secara ketat menggunakan compiler TypeScript. Guna menguji keabsahan tipe data di seluruh codebase tanpa melakukan proses emit berkas, jalankan perintah pengujian statis berikut:
```bash
npx tsc --noEmit
```

- - -

## Kontribusi

Proyek ini bersifat open source dan menerima kontribusi dari pengembang mana pun demi peningkatan fungsionalitas aplikasi. Jika Anda ingin berkontribusi:
1. Lakukan Fork pada repositori ini.
2. Buat branch fitur baru (`git checkout -b fitur/fitur-baru`).
3. Lakukan commit terhadap perubahan Anda (`git commit -m 'Menambahkan fitur baru yang bermanfaat'`).
4. Lakukan push ke branch tersebut (`git push origin fitur/fitur-baru`).
5. Buat Pull Request baru pada repositori utama untuk ditinjau oleh pemelihara proyek.

- - -

## Lisensi

Proyek ini dilisensikan di bawah lisensi Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0). Anda diizinkan untuk menyalin, membagikan, dan memodifikasi kode program ini untuk keperluan non-komersial saja. Penggunaan untuk tujuan komersial dalam bentuk apa pun sangat dilarang.

- - -

Dibuat oleh [Azharangga Kusuma](https://github.com/azharangga)
