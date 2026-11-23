<p align="center">
  <img src="workout-tracker/build/icon.png" width="112" alt="Workout Log">
</p>

<h1 align="center">Workout Log</h1>

<p align="center">
  Pelacak latihan desktop yang <strong>sepenuhnya offline</strong>.<br>
  Kalender, jadwal mingguan, catatan, dan riwayat — semua tersimpan lokal di perangkat Anda.
</p>

<p align="center">
  <a href="https://github.com/Bim-git-hub/WorkOut-Plan/releases/latest"><strong>Unduh versi terbaru</strong></a>
</p>

---

## Fitur

- **Dashboard** — streak, total workout, konsistensi bulan ini, grafik 7 hari, jadwal hari ini, dan riwayat terbaru.
- **Kalender** — grid bulanan dengan judul sesi, tandai sesi selesai, dan buka lembar harian lewat popup.
- **Jadwal** — atur template latihan per hari (Senin–Minggu) beserta judul sesi seperti *Upper Body*, *Lower Body*, atau *Cardio*.
- **Riwayat** — daftar workout selesai per bulan, lengkap dengan catatan.
- **Catatan** — simpan beban, rasa badan, atau rekor baru di setiap tanggal.
- **Dua tema** — Kertas (terang) dan Tinta (gelap).
- **Backup** — ekspor/impor JSON yang kompatibel dengan backup prototipe.
- **Offline penuh** — tanpa CDN, tanpa telemetri, tanpa koneksi internet.

## Unduh & Pasang

Buka halaman [Releases](https://github.com/Bim-git-hub/WorkOut-Plan/releases/latest), lalu pilih salah satu:

| Berkas | Keterangan |
| --- | --- |
| `Workout-Log-Setup-1.0.0.exe` | Installer (pilih folder instalasi, membuat shortcut) |
| `Workout-Log-1.0.0-portable.exe` | Portable — jalankan langsung tanpa instalasi |

> Build belum ditandatangani secara digital. Jika Windows SmartScreen muncul, pilih **More info → Run anyway**.

## Cara Pakai

1. Buka menu **Jadwal**, isi latihan untuk tiap hari dan beri judul sesi.
2. Buka **Kalender**, klik tanggal untuk membuka lembar harian.
3. Di lembar harian: tandai **selesai**, tulis catatan, atau edit jadwal hari tersebut.
4. Pantau progres di **Dashboard** dan tinjau workout lama di **Riwayat**.
5. Gunakan tombol tema di kanan atas untuk beralih Kertas/Tinta.

Navigasi keyboard di kalender: `←` / `→` ganti bulan, `Esc` menutup popup.

## Data & Backup

Semua data disimpan sebagai JSON di:

```
%APPDATA%\workout-tracker\data.json
```

- Penulisan atomik + file cadangan `data.bak.json`.
- **Pengaturan → Ekspor backup** untuk menyimpan salinan JSON.
- **Pengaturan → Impor backup** untuk memulihkan data.
- Format backup sama dengan prototipe `workout-tracker.html`.

## Pengembangan

Prasyarat: **Node.js 18+** dan Windows.

```bash
cd workout-tracker
npm install

npm run dev      # mode pengembangan (hot reload)
npm test         # unit test
npm run build    # build renderer/main/preload
npm run dist     # buat installer + portable di folder release/
```

## Struktur Proyek

```
workout-tracker/
├── electron/          # main process + preload (IPC, penyimpanan atomik)
├── src/
│   ├── lib/           # tipe data, tanggal, storage, migrasi
│   ├── modules/       # dashboard, kalender, jadwal, riwayat, notepad
│   ├── assets/        # logo aplikasi
│   ├── main.ts        # routing, tema, modal
│   └── styles.css     # tema Kertas & Tinta
├── build/             # ikon aplikasi (SVG + PNG)
├── tests/             # unit test (vitest)
└── index.html
```

## Teknologi

- [Electron](https://www.electronjs.org/) 30
- [electron-vite](https://electron-vite.org/) + TypeScript
- [Vitest](https://vitest.dev/) untuk unit test
- [electron-builder](https://www.electron.build/) untuk paket Windows (NSIS + portable)
- Vanilla TypeScript — tanpa framework UI

Keamanan: `contextIsolation: true`, `nodeIntegration: false`, akses file hanya lewat IPC.

---

<p align="center"><sub>Dibuat untuk latihan yang konsisten. Data tetap milik Anda.</sub></p>
