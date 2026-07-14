**Absensiku — Sistem Absensi Berbasis QR Code**

---

Bagian I: Bahasa Indonesia

## 1. Judul & Deskripsi Proyek

**Absensiku (AbsensiPro)** — Aplikasi web untuk manajemen absensi karyawan berbasis QR Code. Aplikasi ini menyediakan dua peran utama: **admin** dan **karyawan**. Admin dapat mengelola data karyawan, membuat sesi QR untuk absensi, serta melihat rekap dan laporan. Karyawan melakukan absensi dengan memindai QR yang dihasilkan, dan data absensi tersimpan di Firestore.

Alur singkat (input → proses → output):
- Input: admin membuat sesi QR melalui antarmuka `GenerateQR` (mengisi nama sesi, jam mulai/selesai, durasi berlaku, batas terlambat).
- Proses: sistem menyimpan sesi pada koleksi `qr_sessions` di Firestore; fungsi util membuat data QR (JSON: `sessionId`, `qrId`, `sessionName`) dan ditampilkan sebagai gambar data URL.
- Output: karyawan memindai QR melalui halaman `ScanQR`; aplikasi memverifikasi payload QR, memeriksa sesi (status `aktif`, `expiresAt`, `qrId`), lalu menulis/ memperbarui dokumen pada koleksi `attendance`. Admin dapat mengekspor rekap sebagai PDF/Excel.

Komponen dan alur teknis utama berdasarkan kode:
- Routing utama: [src/App.jsx](src/App.jsx) — rute untuk `/admin` (AdminLayout) dan `/user` (UserLayout), halaman login di `/`.
- Auth: Firebase Authentication (`src/firebase/config.js` dan hooks `useCurrentAdmin`, `useCurrentEmployee`) untuk memetakan akun auth ke dokumen `users` di Firestore.
- Realtime data: hook `useFirestoreCollection` berlangganan koleksi Firestore (onSnapshot).
- Koleksi Firestore penting: `users`, `attendance`, `qr_sessions`, `leave_requests`.
- Utility utama: `src/utils/qr.js` (membangun QR, download), `src/utils/export.js` (export PDF/XLSX), `src/utils/date.js`, `src/utils/adminData.js`, `src/utils/employeeData.js`.

## 2. Daftar Isi

- [1. Judul & Deskripsi Proyek](#1-judul--deskripsi-proyek)
- [2. Daftar Isi](#2-daftar-isi)
- [3. Cara Instalasi](#3-cara-instalasi)
- [4. Panduan Penggunaan](#4-panduan-penggunaan)

## 3. Cara Instalasi

Persyaratan:
- Node.js (LTS) dan npm terpasang.
- Akun Firebase (untuk Authentication, Firestore, Storage jika ingin menyimpan asset).

Langkah singkat:

1. Clone repository dan masuk ke folder proyek:

```bash
cd absensiku
npm install
```

2. Konfigurasi Firebase:
- Buat proyek Firebase dan aktifkan **Email/Password** Authentication.
- Buat Firestore (mode yang sesuai) dan Storage bila perlu.
- Salin konfigurasi web Firebase dan letakkan di file [src/firebase/config.js](src/firebase/config.js). File ini saat ini berisi contoh konfigurasi — ganti dengan milik Anda jika diperlukan.

3. Menjalankan aplikasi dalam mode development:

```bash
npm run dev
```

4. Build produksi:

```bash
npm run build
npm run preview
```

5. Deployment (Firebase Hosting):
- Build akan menghasilkan folder `dist`. Konfigurasi [firebase.json](firebase.json) sudah diatur untuk menghidangkan `dist`.
- Jalankan `firebase deploy --only hosting` setelah login dan inisialisasi hosting pada proyek Firebase.

## 4. Panduan Penggunaan

Menjalankan proyek:

```bash
npm install
npm run dev
```

Masuk (login):
- Buka `http://localhost:5173` (atau port Vite yang muncul di terminal).
- Halaman login di `Login.jsx` meminta peran (Administrator atau Karyawan). Autentikasi menggunakan Firebase Email/Password. Setelah berhasil login, user diarahkan ke ` /admin` atau `/user` sesuai role.

Fitur admin (UI & koleksi terkait):
- `Karyawan` — mengelola koleksi `users` (tambah/edit/hapus) ↔ [src/pages/admin/Karyawan.jsx](src/pages/admin/Karyawan.jsx).
- `Generate QR` — membuat dokumen di `qr_sessions` (mengatur `qrId`, `expiresAt`, `durationMinutes`, `lateLimit`) ↔ [src/pages/admin/GenerateQR.jsx](src/pages/admin/GenerateQR.jsx). QR di-render menggunakan `src/utils/qr.js`.
- `Rekap Absensi`, `Izin Cuti`, `Laporan` — halaman rekap dan laporan yang membaca koleksi `attendance` dan `leave_requests`.

Fitur karyawan:
- `Scan QR` — halaman yang memanfaatkan `@zxing/browser` untuk membaca QR dari kamera. Payload QR di-parse (harus berisi `sessionId` dan `qrId`) lalu disimpan ke koleksi `attendance`.
- `Riwayat Absensi` — menampilkan kalender, statistik, dan menyediakan ekspor PDF/XLSX (utils di [src/utils/export.js](src/utils/export.js)).

Skema penulisan absensi (ringkasan):
- ID dokumen attendance: kombinasi `profile.id` + tanggal (deterministic) atau dokumen existing untuk hari itu.
- Field utama: `userId`, `email`, `userName`, `division`, `date`, `checkIn`, `checkOut`, `status`, `sessionId`, `qrId`, `createdAt`, `updatedAt`.

Best practices & catatan keamanan:
- Pastikan aturan Firestore membatasi operasi tulis/ubah hanya untuk user yang berwenang.
- Konfigurasi `src/firebase/config.js` aman untuk publik (ini adalah konfigurasi klien), tetapi aturan keamanan backend (Firestore Rules) harus melindungi data sensitif.
- Untuk produksi, gunakan HTTPS dan validasi sisi server bila perlu untuk proses kritis.

---

Bagian II: English

## 1. Project Title & Description

**Absensiku (AbsensiPro)** — A QR Code based employee attendance web application. The app supports two main roles: **admin** and **employee**. Admins can manage employees, create QR attendance sessions, and view/export reports. Employees check in/out by scanning a QR displayed by the admin. All attendance data is stored in Firebase Firestore.

Short flow (input → process → output):
- Input: admin creates a QR session via the `GenerateQR` page (session name, start/end time, active duration, late limit).
- Process: session is saved to the `qr_sessions` Firestore collection; a QR payload (JSON with `sessionId`, `qrId`, `sessionName`) is generated and rendered as an image data URL.
- Output: employee scans the QR on the `ScanQR` page; the app validates the QR payload, checks session status and expiry, then writes/updates a document in the `attendance` collection. Admins can export attendance summaries as PDF/Excel.

Key components & technical flow (from source code):
- Routing: [src/App.jsx](src/App.jsx) — registers routes for `/admin` (AdminLayout) and `/user` (UserLayout) and the login route `/`.
- Authentication: Firebase Authentication with mapping to Firestore `users` documents via hooks `useCurrentAdmin` and `useCurrentEmployee`.
- Realtime: `useFirestoreCollection` subscribes to Firestore collections using `onSnapshot`.
- Important Firestore collections: `users`, `attendance`, `qr_sessions`, `leave_requests`.
- Utilities: [src/utils/qr.js](src/utils/qr.js) (QR creation & download), [src/utils/export.js](src/utils/export.js) (PDF/XLSX export), date helpers, admin/employee helper functions.

## 2. Table of Contents

- [1. Project Title & Description](#1-project-title--description)
- [2. Table of Contents](#2-table-of-contents)
- [3. Installation](#3-installation)
- [4. Usage Guide](#4-usage-guide)

## 3. Installation

Prerequisites:
- Node.js (LTS) and npm.
- A Firebase project (Authentication, Firestore, Storage if needed).

Steps:

1. Install dependencies:

```bash
npm install
```

2. Firebase configuration:
- Create a Firebase web app and enable Email/Password Authentication.
- Create Firestore and Storage if required.
- Place your Firebase config in [src/firebase/config.js](src/firebase/config.js).

3. Start development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
npm run preview
```

5. Deploy to Firebase Hosting:
- The project builds to `dist` and [firebase.json](firebase.json) is configured to serve that directory.
- Use `firebase deploy --only hosting` after initializing hosting for your Firebase project.

## 4. Usage Guide

Run locally:

```bash
npm install
npm run dev
```

Authentication & roles:
- Visit the app (Vite dev server) and log in using Email/Password. Choose the correct role (Administrator or Employee) on the login screen. The app maps the authenticated email to a Firestore `users` document to determine authorization.

Admin workflows:
- Manage employees at [src/pages/admin/Karyawan.jsx](src/pages/admin/Karyawan.jsx) — creates/edits/deletes documents in `users`.
- Create QR sessions at [src/pages/admin/GenerateQR.jsx](src/pages/admin/GenerateQR.jsx) — creates documents in `qr_sessions`, sets `status: aktif`, `expiresAt`, and `qrId`.
- Admin UI shows stats and allows downloading generated QR images.

Employee workflows:
- Scan a QR via camera at [src/pages/user/ScanQR.jsx](src/pages/user/ScanQR.jsx). The scanner uses `@zxing/browser` to decode QR. The QR payload is validated (must contain `sessionId` and `qrId`) and then `attendance` is created/updated.
- View attendance history and export via [src/pages/user/RiwayatAbsensi.jsx](src/pages/user/RiwayatAbsensi.jsx).

Data shape highlights:
- `attendance` documents include `userId`, `email`, `userName`, `userName`, `date`, `checkIn`, `checkOut`, `status`, `sessionId`, `qrId`, `createdAt`, `updatedAt`.

Troubleshooting & tips:
- Camera access: grant camera permission in the browser; mobile browsers may behave differently.
- Firestore rules: misconfigured rules can cause read/write failures — check Firestore logs and browser console for permission errors.
- Common auth errors are mapped in [src/pages/auth/Login.jsx](src/pages/auth/Login.jsx) with friendly messages.

Contact / Next steps:
- If you want, I can help: add stricter Firestore Rules, add server-side verification for QR payloads, or create a CI/CD pipeline for automated deployments.

---

End of README

