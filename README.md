<div align="center">

# <img src="public/favicon.svg" width="36" height="36" style="vertical-align: middle; margin-right: 4px;" /> Job Tracker

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-20d5fd?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white)
![Turbopack](https://img.shields.io/badge/Turbopack-Bundler-FF4154?style=flat-square&logo=nextdotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=flat-square&logo=supabase&logoColor=white)

</div>

- - -

## Deskripsi Proyek

Job Tracker adalah aplikasi web modern dan profesional yang dirancang khusus untuk mempermudah pencari kerja dalam mengelola, melacak, dan menganalisis seluruh proses lamaran pekerjaan mereka secara terpusat. Aplikasi ini dibangun di atas arsitektur Next.js App Router dengan React 19, TypeScript, dan Tailwind CSS 4, dengan dukungan integrasi database serta autentikasi kustom melalui serverless backend Supabase Edge Functions. Sistem ini didesain menggunakan pendekatan Notion-inspired paper design yang monokromatis dan berestetika premium untuk memberikan kenyamanan navigasi yang optimal tanpa beban kognitif tinggi bagi penggunanya.

- - -

## Fitur Utama

- Manajemen Lamaran Kerja: Pencatatan posisi, perusahaan, status lamaran, prioritas, jenis pekerjaan, gaji, tautan lowongan portal eksternal, nama perekrut, tenggat waktu, hingga catatan terperinci.
- Laporan Analitik Interaktif: Dashboard visual yang menampilkan metrik total lamaran aktif, grafik persentase respon wawancara, rasio penawaran kerja, daftar perusahaan impian, dan perkembangan tahapan lamaran secara langsung.
- Kanban Board: Pengelompokan status lamaran secara visual untuk memudahkan penelusuran tahapan (Wishlist, Applied, HR Screening, Technical Test, User Interview, HR Interview, Final Interview, Offer, Accepted, Rejected, Withdrawn).
- Kalender Penjadwalan: Visualisasi tenggat waktu pengiriman berkas serta jadwal wawancara kerja terintegrasi.
- Manajemen Kontak Perekrut: Penyimpanan data jaringan profesional seperti email, nomor telepon, dan tautan profil LinkedIn perekrut yang terhubung langsung dengan setiap entitas lamaran.
- Manajemen Dokumen Pendukung: Pemuatan berkas portofolio, CV, surat lamaran, serta preview dokumen terintegrasi (PDF, Gambar, dan Teks) tanpa perlu mengunduh file terlebih dahulu.
- Sistem Keamanan & Autentikasi Kustom: Autentikasi aman yang diproses melalui Supabase Edge Functions dengan validasi ketat dan hash enkripsi kata sandi menggunakan Bcrypt.
- Pemendek URL (URL Shortener): Alat bawaan untuk memperpendek tautan apa pun secara bebas dengan dukungan custom alias dan kontrol status tautan (aktif/nonaktif).
- Lokalisasi Penuh (Multi-bahasa): Dukungan pergantian bahasa secara langsung (Bahasa Indonesia dan Bahasa Inggris) dengan pengaturan tersimpan.
- Desain Responsif & Premium: Tampilan yang sepenuhnya dioptimalkan baik untuk perangkat desktop beresolusi tinggi maupun perangkat seluler dengan animasi transisi yang sangat halus menggunakan Framer Motion.

- - -

## Struktur Proyek

Berikut adalah struktur direktori utama proyek yang bersih dari file penunjang yang diabaikan oleh Git:

```text
job-tracker/
├── public/
│   └── favicon.svg                         # Ikon aplikasi (SVG)
├── src/
│   ├── app/                                # Next.js App Router — definisi seluruh rute
│   │   ├── (app)/                          # Route group: halaman utama (dilindungi auth)
│   │   │   ├── analytics/                  # Halaman analitik & statistik lamaran
│   │   │   ├── applications/               # Halaman daftar & detail lamaran kerja
│   │   │   ├── calendar/                   # Halaman kalender tenggat & wawancara
│   │   │   ├── companies/                  # Halaman manajemen data perusahaan
│   │   │   ├── contacts/                   # Halaman manajemen kontak perekrut
│   │   │   ├── documents/                  # Halaman manajemen dokumen (CV, porto)
│   │   │   ├── kanban/                     # Halaman kanban board status lamaran
│   │   │   ├── notes/                      # Halaman catatan bebas
│   │   │   ├── settings/                   # Halaman pengaturan akun & preferensi
│   │   │   ├── shortlinks/                 # Halaman manajemen URL shortener mandiri
│   │   │   ├── tasks/                      # Halaman daftar tugas (to-do)
│   │   │   ├── layout.tsx                  # Layout dengan AppShell (Sidebar + Topbar)
│   │   │   └── page.tsx                    # Root redirect ke /applications
│   │   ├── (auth)/                         # Route group: halaman autentikasi
│   │   │   └── login/                      # Halaman login
│   │   ├── error.tsx                       # Global error boundary Next.js
│   │   ├── layout.tsx                      # Root layout (font, metadata, providers)
│   │   ├── loading.tsx                     # Global loading skeleton
│   │   └── not-found.tsx                   # Halaman 404
│   ├── components/
│   │   ├── common/                         # Komponen reusable berbagai fitur
│   │   ├── layout/                         # Komponen tata letak (AppShell, Sidebar, Topbar)
│   │   └── ui/                             # Komponen primitif berbasis Radix UI (shadcn/ui)
│   ├── constants/                          # Variabel konstanta & enum domain aplikasi
│   ├── contexts/
│   │   ├── AuthContext.tsx                 # Manajemen sesi autentikasi & otorisasi
│   │   ├── CommandPaletteContext.tsx       # State command palette global (Ctrl+K)
│   │   └── ThemeContext.tsx                # Manajemen pergantian tema (light / dark)
│   ├── features/                           # Komponen halaman per fitur (dirender App Router)
│   │   ├── applications/                   # Sub-komponen halaman lamaran (form, detail)
│   │   ├── AnalyticsPage.tsx               # Komponen halaman analitik
│   │   ├── CalendarPage.tsx                # Komponen halaman kalender
│   │   ├── CompaniesPage.tsx               # Komponen halaman perusahaan
│   │   ├── ContactsPage.tsx                # Komponen halaman kontak
│   │   ├── DashboardPage.tsx               # Komponen halaman dashboard utama
│   │   ├── DocumentsPage.tsx               # Komponen halaman dokumen
│   │   ├── LoginPage.tsx                   # Komponen halaman login
│   │   ├── NotesPage.tsx                   # Komponen halaman catatan
│   │   ├── SettingsPage.tsx                # Komponen halaman pengaturan
│   │   ├── ShortlinksPage.tsx              # Komponen halaman manajemen shortlinks
│   │   └── TasksPage.tsx                   # Komponen halaman tugas
│   ├── hooks/                              # Custom React hooks (data fetching, UI)
│   ├── i18n/
│   │   ├── index.ts                        # Konfigurasi & inisialisasi i18next
│   │   └── locales/                        # Kamus terjemahan (en.json, id.json)
│   ├── integrations/
│   │   └── supabase/                       # Konfigurasi & instansiasi Supabase client SDK
│   ├── lib/                                # Fungsi utilitas umum (toast, format, utils)
│   ├── providers/
│   │   ├── ProtectedLayout.tsx             # Guard autentikasi redirect ke /login
│   │   └── RootProviders.tsx               # Provider root (React Query, Theme, Auth)
│   ├── services/                           # Lapisan akses data (Repository / Service)
│   │   ├── demo.ts                         # Akses data offline untuk Mode Demo (Local Storage)
│   │   ├── index.ts                        # Selector / proxy data source (Demo vs Live)
│   │   └── live.ts                         # Akses data online untuk Mode Live (Supabase)
│   ├── types/                              # Definisi tipe data TypeScript global
│   ├── demoData.json                       # Dataset dummy statis awal untuk Mode Demo
│   └── styles.css                          # CSS global & konfigurasi Tailwind CSS 4
├── supabase/
│   └── functions/
│       └── auth/                           # Serverless Edge Function autentikasi (Bcrypt)
├── .env.example                            # Contoh konfigurasi variabel lingkungan
├── .gitignore                              # Daftar file & folder yang diabaikan Git
├── .prettierignore                         # Pengecualian pemformatan Prettier
├── .prettierrc                             # Konfigurasi aturan pemformatan Prettier
├── components.json                         # Konfigurasi komponen shadcn/ui
├── eslint.config.js                        # Konfigurasi aturan linter ESLint
├── next-env.d.ts                           # Deklarasi tipe otomatis Next.js (jangan diedit)
├── next.config.ts                          # Konfigurasi build & runtime Next.js
├── package.json                            # Daftar dependensi & skrip npm
├── postcss.config.mjs                      # Konfigurasi PostCSS (@tailwindcss/postcss)
└── tsconfig.json                           # Konfigurasi compiler TypeScript
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
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. Instal seluruh dependensi perangkat lunak yang dideklarasikan pada proyek menggunakan npm:
   ```bash
   npm install
   ```

- - -

## Mode Demo (Offline)

Aplikasi menyediakan **Mode Demo** untuk mencoba seluruh fitur interaktif aplikasi tanpa memerlukan database Supabase (offline/lokal).

- **Cara Mengakses**: Pada halaman login, klik tombol **"Coba Demo"** (atau **"Continue as Demo"**).
- **Penyimpanan Data**: Seluruh operasi tambah, edit, dan hapus data berjalan menggunakan Local Storage di browser Anda. Perubahan ini **tidak** akan memengaruhi data database produksi.
- **Data Awal**: Pada login pertama, aplikasi akan memuat data dummy simulasi yang kaya (beberapa pipelines lamaran, jadwal wawancara, catatan, kontak perekrut, dan tugas).
- **Reset Data**: Anda dapat mengembalikan data demo ke kondisi semula kapan saja dengan menekan tombol **"Reset Data"** pada banner kuning di bagian atas aplikasi.

- - -

## Cara Menjalankan Aplikasi

### Mode Pengembangan (Development)

Untuk menjalankan server pengembangan lokal dengan fitur Fast Refresh aktif menggunakan Turbopack, jalankan perintah berikut:
```bash
npm run dev
```
Setelah berjalan, Anda dapat mengakses antarmuka aplikasi melalui browser di tautan `http://localhost:3000`.

### Mode Produksi (Production Build)

1. Lakukan kompilasi seluruh kode sumber TypeScript dan React menjadi bundel produksi yang dioptimalkan:
   ```bash
   npm run build
   ```

2. Jalankan server produksi secara lokal setelah proses build selesai:
   ```bash
   npm run start
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