# Undangan Digital

Platform undangan pernikahan digital untuk pasangan Indonesia. Desain eksklusif, mudah dibagikan, tanpa kertas.

## Fitur

- 3 tema eksklusif: Javanese Malam Emas, Taman Bunga, Minimalis Putih
- Konfirmasi RSVP online dengan rate limiting
- Dinding ucapan & doa real-time (polling 30 detik)
- Countdown menuju hari pernikahan
- Integrasi Google Maps
- Amplop digital (transfer bank dengan satu klik salin)
- Pemutar musik latar
- Dashboard RSVP untuk pasangan (JWT auth)
- Export data RSVP ke CSV
- Watermark opsional

## Tech Stack

- **Backend**: Python 3.12, Django 5.0, DRF, SimpleJWT, PostgreSQL 16
- **Frontend**: React 18.3, Vite 5.2, Framer Motion 11, Axios 1.7
- **Infrastructure**: Docker, Docker Compose, Nginx 1.25

## Setup & Menjalankan

### 1. Clone dan konfigurasi

```bash
git clone <repo-url>
cd undangan
cp .env.example .env
# Edit .env dengan nilai yang sesuai (terutama SECRET_KEY dan DB_PASSWORD untuk produksi)
```

### 2. Jalankan services

```bash
docker compose up --build
```

### 3. Jalankan migrasi

```bash
docker compose exec backend python manage.py migrate
```

### 4. Buat superuser (admin)

```bash
docker compose exec backend python manage.py createsuperuser
```

### 5. Akses

| Service | URL |
|---------|-----|
| Admin panel | http://localhost:8000/admin/ |
| Frontend | http://localhost:5173/ |
| API | http://localhost:8000/api/ |

## Membuat Undangan Pertama

1. Buka **Admin panel** → http://localhost:8000/admin/
2. Masuk dengan akun superuser
3. Klik **Invitations → Add**
4. Isi data:
   - **Slug**: misal `budi-sari-2025` (akan jadi URL undangan)
   - **Theme**: pilih salah satu
   - **Wedding date**: tanggal pernikahan
   - **Is active**: centang ✓
5. Di bagian **Couple**, isi nama pengantin pria & wanita
6. Di bagian **Events**, tambahkan akad nikah dan/atau resepsi
7. Opsional: tambahkan foto, cerita, rekening bank, musik
8. Buat **User** baru untuk pasangan (Auth → Users → Add)
9. Kembali ke undangan, set **Couple user** ke user yang baru dibuat
10. Simpan

### Mengakses undangan

- **Publik**: `http://localhost:5173/{slug}`
- **Dengan greeting tamu**: `http://localhost:5173/{slug}?to=Nama+Tamu`
- **Dashboard RSVP**: `http://localhost:5173/dashboard` → login dengan akun couple_user → `/dashboard/{slug}`

## Struktur API

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/invitations/{slug}/` | — | Data undangan lengkap |
| POST | `/api/invitations/{slug}/rsvp/` | — | Kirim RSVP (max 5/IP/jam) |
| GET | `/api/invitations/{slug}/rsvps/` | JWT | Daftar RSVP + statistik |
| GET | `/api/invitations/{slug}/wishes/` | — | Dinding ucapan publik |
| POST | `/api/auth/login/` | — | Login, dapatkan JWT |
| POST | `/api/auth/refresh/` | — | Refresh JWT |

## Produksi

```bash
# Pastikan .env sudah dikonfigurasi untuk produksi:
# DEBUG=False
# SECRET_KEY=<key-yang-kuat>
# ALLOWED_HOSTS=domain-anda.com
# CORS_ALLOWED_ORIGINS=https://domain-anda.com

docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```
