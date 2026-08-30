# Alur Pengguna — Dear Guest

Panduan lengkap: dari calon pengantin mendaftar sampai undangannya aktif dan
tamu bisa RSVP — plus apa saja yang dikerjakan admin di sisi belakang.

Dokumen ini menjelaskan sistem **apa adanya** (sesuai kode saat ini), bukan
rencana. Kalau ada yang belum ada, ditulis terus terang di bagian
[Yang belum ada](#yang-belum-ada).

---

## Ringkasan alur

```
CALON PENGANTIN                          ADMIN
───────────────                          ─────
1. Daftar akun
2. Onboarding (slug, tema, tanggal)
3. Isi editor + pratinjau
4. Klik "Minta Aktivasi" ───────────────► Email masuk ke ADMIN_EMAIL
5. Kirim bukti bayar via WhatsApp ──────► Cek pembayaran
                                          6. Admin panel → Permintaan Aktivasi
                                             → "Konfirmasi lunas → Premium"
                                             → sistem membuat kode (mis. A7K2QX)
7. Terima kode via WhatsApp ◄──────────── Admin kirim kodenya manual
8. Masukkan kode → Aktifkan
9. Undangan LIVE
10. Tambah daftar tamu → sebar link/QR
11. Tamu RSVP → masuk dashboard
```

Poin penting: **tidak ada payment gateway.** Pembayaran dikonfirmasi manual oleh
admin, dan kode aktivasi adalah "kunci" yang menandakan pembayaran sudah lunas.

---

## Bagian 1 — Alur Calon Pengantin (User)

### Langkah 1: Daftar akun

**Halaman:** `/register`

Isi tiga kolom:

| Kolom | Wajib | Catatan |
|---|---|---|
| Username | ✅ | mis. `dinda.raka` |
| Nomor WhatsApp | ✅ | mis. `081234567890`. Format `+62`/`62`, spasi, dan tanda hubung boleh — otomatis dirapikan jadi `08xx` |
| Email | ❌ | opsional, tapi **isi kalau mau bisa reset password sendiri** |
| Kata Sandi | ✅ | minimal 8 karakter, tidak boleh angka semua atau kata sandi yang terlalu umum |

Nomor WhatsApp inilah yang dipakai admin untuk **mengirim kode aktivasi**, jadi
pastikan nomornya aktif. Satu nomor hanya bisa dipakai satu akun.

Kolom kata sandi punya tombol **Lihat/Sembunyikan** — pakailah, karena akun
tanpa email hanya bisa dipulihkan lewat admin.

Setelah daftar, user **langsung login otomatis** (token JWT dikirim balik) dan
dilempar ke halaman onboarding. Tidak ada verifikasi email.

> Lupa password? `/forgot-password` → link reset dikirim ke email.
> Di mode development email tidak benar-benar terkirim, hanya tercetak di
> `docker compose logs backend`.
> **Kalau daftar tanpa email**, reset mandiri tidak bisa — hubungi admin lewat
> WhatsApp untuk dibantu.

Sudah punya akun? Login di `/dashboard` — kolom pertama menerima **username,
email, atau nomor WhatsApp**, mana saja yang paling gampang diingat. Setelah
masuk, mendarat di `/my` (daftar semua undangan miliknya).

> Sesi bertahan sampai 7 hari. Token akses diperbarui otomatis di belakang
> layar, jadi tidak akan tiba-tiba ter-logout di tengah mengedit.

---

### Langkah 2: Onboarding — buat undangan

**Halaman:** `/onboarding` (otomatis setelah daftar, atau tombol
**+ Buat Undangan Baru** di `/my`)

Satu layar, tiga isian:

1. **Alamat undangan (slug)**
   Jadi alamat publiknya: `dearguest.com/dinda-raka`.
   Ketikan otomatis dirapikan (huruf kecil, spasi → tanda hubung).
   Ketersediaan dicek langsung saat mengetik:
   - ✓ Tersedia → boleh lanjut
   - ✕ Sudah dipakai / Format tidak valid → tombol simpan terkunci

2. **Pilih tema**
   35 tema, ditampilkan sebagai kartu pratinjau kecil.

3. **Tanggal pernikahan**

Klik **Buat & Mulai Edit**.

**Yang terjadi di balik layar:**
- Undangan dibuat dengan status **draft** (`is_active = false`) — belum bisa
  dibuka publik.
- Masa aktif otomatis diisi: tanggal nikah **+ 90 hari**.
- Satu akun gratis hanya boleh punya **1 undangan**. Kalau mau buat yang kedua,
  muncul pesan *"Batas undangan tercapai — upgrade ke paket Bisnis"*.

> Semua pilihan di sini (slug, tema, tanggal) **masih bisa diubah nanti**
> di editor. Tidak ada yang permanen.

---

### Langkah 3: Isi konten di editor

**Halaman:** `/dashboard/{slug}/edit`

Enam bagian, masing-masing punya tombol simpan sendiri:

| Bagian | Isinya |
|---|---|
| **Pengaturan** | Slug, tema, tanggal, teks pembuka & penutup, dress code, musik |
| **Mempelai** | Nama, nama orang tua, foto, bio pengantin pria & wanita |
| **Acara** | Akad & resepsi: waktu, tempat, alamat, link Google Maps |
| **Kisah** | Perjalanan cinta (timeline, bisa diurutkan) |
| **Galeri** | Upload foto-foto |
| **Amplop** | Rekening bank untuk amplop digital / link wishlist |

Fitur bantu di editor:
- **Pratinjau Langsung** — panel di samping yang menampilkan undangan asli dan
  ikut berubah tiap kali menyimpan.
- **Checklist kelengkapan** — mencentang otomatis: nama mempelai, acara, foto
  mempelai, foto galeri, amplop/wishlist.
- **Peringatan keluar halaman** kalau masih ada perubahan yang belum disimpan.

> Draft boleh dipratinjau kapan saja oleh pemiliknya, walaupun belum aktif.
> Orang lain yang membuka linknya akan melihat "Undangan belum aktif".

---

### Langkah 4–8: Aktivasi (kartu "Publikasikan Undangan")

Selama masih draft, di atas editor ada kartu berisi 3 langkah:

**Langkah 1 — Minta aktivasi**
Klik tombol **Minta Aktivasi**. Ini menandai undangan sebagai "meminta
aktivasi" dan **mengirim email otomatis ke admin**. Tampilan berubah jadi
*"✓ Permintaan aktivasi terkirim"* dan *"⏳ Menunggu konfirmasi admin"*.

**Langkah 2 — Konfirmasi pembayaran**
Klik tombol hijau **WhatsApp Admin**. Chat terbuka dengan pesan siap kirim:

> *"Halo admin, saya ingin mengaktifkan undangan "{slug}". Saya sudah melakukan
> pembayaran (bukti terlampir). Mohon kode aktivasinya 🙏"*

User melampirkan bukti transfer di chat itu.

**Langkah 3 — Masukkan kode**
Admin membalas dengan kode 6 karakter (mis. `A7K2QX`). User mengetiknya di
kolom **Kode aktivasi** → klik **Aktifkan**.
Huruf besar/kecil tidak masalah.

Kalau salah: *"Kode aktivasi tidak valid."*

---

### Langkah 9: Undangan aktif 🎉

Begitu kode benar:
- Kartu berubah jadi hijau: **"🎉 Undangan Kamu Sudah Aktif"**
- Label di kanan atas berubah dari **Draft** → **Aktif**
- Link `dearguest.com/{slug}` bisa dibuka siapa saja, tanpa login

**Editor tetap bisa dipakai setelah aktif.** Ganti foto, ubah jam acara,
tambah cerita — semua langsung tayang, tidak perlu minta persetujuan lagi.

---

### Langkah 10: Sebar undangan ke tamu

**Halaman:** `/dashboard/{slug}` → tab **Daftar Tamu & QR**

1. Ketik nama tamu, **satu nama per baris** (boleh sekaligus banyak).
   Bisa diberi nama grup, mis. "Keluarga Besar" / "Kantor".
2. Tiap tamu otomatis dapat **link personal + QR code**.
3. Per tamu tersedia dua tombol:
   - **Link** — salin link personalnya
   - **WhatsApp** — buka chat dengan undangan berbahasa Indonesia yang sudah
     jadi, tinggal kirim

Link personal berbentuk:
`.../{slug}?to=Nama%20Tamu&g=KODE`

- `to=` membuat undangan menyapa tamu dengan namanya
- `g=` menghubungkan RSVP tamu itu ke barisnya di daftar tamu

Link ini sengaja lewat halaman `/share/` backend supaya **muncul preview
gambar yang bagus saat dikirim di WhatsApp**.

Ada juga penanda **check-in** per tamu, untuk dipakai di meja penerima tamu
pada hari-H.

---

### Langkah 11: Memantau RSVP

**Halaman:** `/dashboard/{slug}` → tab **Konfirmasi RSVP**

- 4 kartu ringkasan: Total Konfirmasi · Hadir · Tidak Hadir · Total Tamu
- Tabel: Nama, WhatsApp, Hadir, Jumlah Tamu, Ucapan, Waktu
- Tombol **Export CSV** (dibuat langsung di browser)

Ucapan/doa dari tamu juga tampil otomatis di **dinding ucapan** pada halaman
undangan, diperbarui tiap 30 detik.

Batas anti-spam: satu alamat IP maksimal **5 kali kirim RSVP per jam**.

> ⚠️ **Tidak ada notifikasi otomatis saat ada RSVP baru.** Tidak ada email,
> tidak ada WhatsApp ke pengantin. Mereka harus membuka dashboard sendiri
> untuk melihat konfirmasi yang masuk.

---

## Bagian 2 — Yang Bisa Dikerjakan Admin

Semua pekerjaan admin ada di **Django admin panel**: `http://localhost:8010/admin/`
(atau domain produksi + `/admin/`).

Butuh akun staff:
```bash
docker compose exec backend python manage.py createsuperuser
```

### Menu utama: Permintaan Aktivasi (pending)

Ini **kotak masuk pekerjaan admin** — isinya hanya undangan yang sudah meminta
aktivasi tapi belum aktif. Kolom yang tampil: slug, nama mempelai, paket, kode
aktivasi, waktu permintaan.

Cara kerja sehari-hari:

1. Ada email masuk / chat WhatsApp berisi bukti transfer.
   Email pemberitahuan sekarang memuat **username, nomor WhatsApp, dan email**
   pemiliknya — jadi admin bisa menghubungi duluan tanpa menunggu dichat.
2. Cek pembayaran benar-benar masuk.
3. Buka menu ini, centang undangannya, pilih salah satu aksi:

| Aksi | Efeknya |
|---|---|
| **✓ Konfirmasi lunas → Premium + terbitkan kode** | Paket jadi Premium (watermark hilang) **dan** kode aktivasi dibuat otomatis |
| **✓ Konfirmasi lunas → Bisnis (2 undangan) + terbitkan kode** | Paket jadi Bisnis, kode dibuat, **dan** jatah undangan akun dinaikkan jadi 2 |
| **Terbitkan kode aktivasi saja** | Hanya membuat kode, paket tidak diubah (untuk paket gratis) |

4. Kode 6 karakter muncul di kolom `activation_code` — mis. `A7K2QX`.
5. **Kirim kode itu ke pasangan via WhatsApp.** Klik nomor di kolom
   **WhatsApp** pada baris yang sama: chat langsung terbuka dengan pesan berisi
   kode yang sudah jadi, tinggal kirim. Pengiriman tetap manual — sistem tidak
   mengirimkannya sendiri.

> Terbitkan kodenya **dulu**, baru klik nomor WhatsApp-nya. Kalau diklik
> sebelum kode ada, pesannya tertulis "(terbitkan dulu)".

### Menu: Invitations

Daftar **semua** undangan (aktif maupun draft). Bisa disaring per status,
paket, atau tema. Di sini admin bisa:

- **Mengaktifkan langsung** tanpa kode — centang → aksi *"Aktifkan undangan
  yang dipilih"*. Berguna untuk demo, atau kalau pasangan kesulitan memasukkan
  kode.
- **Menonaktifkan** undangan (mis. masa aktif habis atau bermasalah).
- **Mengubah paket** (`free` / `premium` / `bisnis`) langsung dari daftar.
- **Mengedit seluruh isi undangan** — mempelai, acara, kisah, foto, rekening —
  semuanya tersedia sebagai form di dalam halaman undangan. Berguna untuk
  membantu pelanggan yang gagap teknologi.

### Menu lainnya

| Menu | Fungsi |
|---|---|
| **Couple profiles** | Nomor WhatsApp pemilik akun + `max_invitations` (1 = gratis/Premium, 2 = Bisnis). Bisa dicari lewat nomor |
| **RSVPs** | Lihat semua konfirmasi tamu (read-only, tidak bisa diubah admin) |
| **Guests** | Daftar tamu + kode personal + status check-in |
| **Coupons** | Buat kode diskon (persentase, masa berlaku). Hanya dipakai di kotak kupon halaman depan untuk menampilkan harga setelah diskon — tidak otomatis terpakai saat aktivasi |
| **Music presets** | Kelola pilihan lagu latar yang bisa dipakai pasangan |

### Beda paket

| Paket | Watermark "Dear Guest" | Jumlah undangan |
|---|---|---|
| **Gratis** | Tampil | 1 |
| **Premium** | Hilang | 1 |
| **Bisnis** | Hilang | 2 |

---

## Untuk Testing (lingkungan development)

Kalau ingin mencoba alur lengkap sendiri tanpa repot:

**Cara tercepat — buat kode aktivasi lewat terminal:**
```bash
docker compose exec backend python manage.py shell -c "
from apps.invitations.models import Invitation
i = Invitation.objects.get(slug='SLUG-KAMU')
i.activation_code = 'TEST01'; i.save()
print(i.slug, i.activation_code)"
```
Lalu ketik `TEST01` di kartu aktivasi.

**Cara paling singkat — langsung aktifkan, lewati kode:**
```bash
docker compose exec backend python manage.py shell -c "
from apps.invitations.models import Invitation
Invitation.objects.filter(slug='SLUG-KAMU').update(is_active=True)"
```

**Cara paling mirip aslinya** — buat superuser, lalu kerjakan sendiri langkah
admin di atas.

Catatan development:
- Email (permintaan aktivasi, reset password) **tidak terkirim sungguhan**,
  hanya tercetak di `docker compose logs backend`.
- Undangan demo (`demo-clouds-3d`, `demo-floral`, dst.) dibuat dengan:
  `docker compose exec backend python manage.py seed_demos`

Skenario uji end-to-end yang disarankan:
1. Daftar akun baru → onboarding → isi nama mempelai + 1 acara + 1 foto
2. Aktifkan (salah satu cara di atas)
3. Tab **Daftar Tamu** → tambah 2 nama → salin link personal salah satunya
4. Buka link itu di jendela **incognito** → isi RSVP
5. Kembali ke tab **Konfirmasi RSVP** → konfirmasi tadi harus sudah terhitung

---

## Yang belum ada

Supaya tidak salah paham saat mencoba:

- **Tidak ada payment gateway.** Pembayaran manual (transfer + bukti via
  WhatsApp), kode aktivasi adalah penggantinya.
- **Kode aktivasi tidak terkirim otomatis.** Admin mengirimnya sendiri lewat
  WhatsApp (sudah dibantu tombol satu klik di admin panel).
- **Tidak ada notifikasi RSVP baru** ke pasangan — baik email maupun WhatsApp.
  Harus dicek manual di dashboard.
- **Tidak ada verifikasi email maupun OTP WhatsApp** saat pendaftaran — nomor
  yang dimasukkan dipercaya apa adanya.
- **Tidak ada penonaktifan otomatis** saat masa aktif (`expires_at`) lewat —
  undangan kedaluwarsa akan menolak pengunjung, tapi tidak ada proses terjadwal
  yang membersihkannya.
