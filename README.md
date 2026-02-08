# Undangan Digital – Glassmorphism Elegant (Final)

## Fitur
- Cover gate + custom nama tamu dari URL `?to=Nama+Tamu`
- Background berbeda: cover/home/closing
- Musik latar + mute (aktif setelah klik “Buka Undangan”)
- Countdown
- Acara hanya 2: (Akad & Resepsi), (Ngunduh Mantu)
- Galeri: foto + prewedding film (tile video sama seperti foto)
- Kado digital 3 opsi + logo
- RSVP & Ucapan: preview semua ucapan (scroll)
- Ucapan + RSVP tersimpan ke Google Spreadsheet (Apps Script)

## Deploy GitHub Pages
Repo → Settings → Pages → Deploy from branch → main → /(root)

Contoh link tamu:
`https://username.github.io/repo/?to=Nama+Tamu`

## Setup Google Spreadsheet (Wishes & RSVP)
Lihat file Apps Script pada instruksi di chat:
- Buat sheet `Wishes` dan `RSVP`
- Deploy Apps Script sebagai Web App
- Copy URL Web App → isi ke `data/config.json` pada `sheet.postEndpoint` & `sheet.readEndpoint`
