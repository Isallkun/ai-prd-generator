/**
 * Default Dataset for PRD Maker (matching the exact reference from the example images)
 */
const PRD_DATA = {
  project: {
    id: "padel-cepat-oc-go",
    title: "Padel Cepat oc go",
    tagline: "Platform Booking Lapangan Padel Cepat & Otomatis",
    version: "v1.0.0",
    status: "Perencanaan",
    totalFeatures: 4,
    totalSubFeatures: 12,
    totalTasks: 42,
    completedTasks: 0,
    problemStatement: "Pemilik (dan penyewa) lapangan padel saat ini masih memakai WhatsApp untuk konfirmasi ketersediaan dan pembayaran. Proses ini memakan waktu, rawan bentrok jadwal, dan kurang efisien bagi pelanggan maupun pengelola.\n\nSistem ini adalah webapp yang bertujuan menyelesaikan masalah tersebut dengan membuat proses booking menjadi otomatis: pelanggan dapat langsung melihat ketersediaan lapangan (Aha! moment mereka), memilih slot, dan membayar instan.",
    techStack: [
      { name: "Frontend", value: "Next.js 14 (App Router) + Tailwind CSS + Lucide Icons" },
      { name: "Backend / API", value: "Node.js / Next.js Server Actions & API Routes" },
      { name: "Database", value: "PostgreSQL with Prisma ORM" },
      { name: "Authentication", value: "NextAuth.js (Google OAuth & Magic Link)" },
      { name: "Payment Gateway", value: "Midtrans / Xendit Snap Integration" },
      { name: "Notifications", value: "WhatsApp API (Fonnte) & Email (Resend)" },
      { name: "Deployment", value: "Vercel + Supabase" }
    ]
  },

  phases: [
    {
      id: "phase-1",
      phaseNumber: 1,
      title: "Lihat Jadwal & Booking",
      priority: "high",
      priorityLabel: "Utama",
      color: "#f97316",
      summary: "Pengguna dapat melihat jadwal lapangan dan memesan slot kosong dengan cepat.",
      subFeatures: [
        {
          id: "sub-1-1",
          title: "Tampilan Jadwal",
          desc: "Menampilkan jadwal lengkap lapangan dalam bentuk kalender harian atau mingguan dengan status slot warna interaktif.",
          tasks: [
            { id: "task-101", title: "Buat halaman kalender mingguan dengan data tiruan (mock data)", status: "todo", priority: "Utama" },
            { id: "task-102", title: "Wujudkan filter pemilihan tanggal & navigasi minggu berikutnya/sebelumnya", status: "todo", priority: "Utama" },
            { id: "task-103", title: "Komponen visualisasi grid slot waktu (tersedia, dibooking, dipesan)", status: "todo", priority: "Sedang" },
            { id: "task-104", title: "Optimasi responsive view kalender untuk layar smartphone", status: "todo", priority: "Sedang" }
          ]
        },
        {
          id: "sub-1-2",
          title: "Cari Slot Kosong",
          desc: "Mencari dan menampilkan jam yang masih tersedia untuk tanggal tertentu dengan filter lapangan.",
          tasks: [
            { id: "task-105", title: "Endpoint API query slot kosong per tanggal & kategori lapangan", status: "todo", priority: "Utama" },
            { id: "task-106", title: "UI filter cepat (Pagi, Siang, Malam, Indoor/Outdoor)", status: "todo", priority: "Sedang" },
            { id: "task-107", title: "Penanganan konkurensi (mencegah double-booking pada detik bersamaan)", status: "todo", priority: "Utama" }
          ]
        },
        {
          id: "sub-1-3",
          title: "Konfirmasi Pemesanan",
          desc: "Formulir untuk memilih jam dan mengonfirmasi booking secara mandiri beserta kalkulasi harga.",
          tasks: [
            { id: "task-108", title: "Buat halaman ringkasan & kalkulasi harga booking", status: "todo", priority: "Utama" },
            { id: "task-109", title: "Integrasi sistem penahanan slot sementara (holding lock 10 menit)", status: "todo", priority: "Utama" },
            { id: "task-110", title: "Integrasi Payment Gateway popup checkout", status: "todo", priority: "Utama" }
          ]
        }
      ]
    },

    {
      id: "phase-2",
      phaseNumber: 2,
      title: "Dashboard Admin",
      priority: "medium",
      priorityLabel: "Utama",
      color: "#3b82f6",
      summary: "Panel untuk pengelola lapangan memantau booking, mengatur lapangan, dan jadwal.",
      subFeatures: [
        {
          id: "sub-2-1",
          title: "Daftar Pemesanan",
          desc: "Melihat semua pemesanan yang masuk dari pelanggan lengkap dengan status pembayaran dan check-in.",
          tasks: [
            { id: "task-201", title: "Buat halaman dashboard admin dengan layout dan navigasi ke tiga sub-fitur", status: "todo", priority: "Utama" },
            { id: "task-202", title: "Buat komponen daftar pemesanan dengan filter status (Lunas, Menunggu, Batal)", status: "todo", priority: "Utama" },
            { id: "task-203", title: "Fitur export data rekap booking ke format Excel/CSV", status: "todo", priority: "Sedang" }
          ]
        },
        {
          id: "sub-2-2",
          title: "Manajemen Lapangan",
          desc: "Menambah, mengubah, atau menonaktifkan data lapangan yang tersedia serta penetapan harga per jam.",
          tasks: [
            { id: "task-204", title: "Formulir CRUD lapangan (Nama, Foto, Tipe Lapangan, Harga Standar & Peak)", status: "todo", priority: "Utama" },
            { id: "task-205", title: "Modal upload gambar lapangan dan upload multi-foto", status: "todo", priority: "Sedang" },
            { id: "task-206", title: "Fitur toggle status maintenance/tutup sementara per lapangan", status: "todo", priority: "Sedang" }
          ]
        },
        {
          id: "sub-2-3",
          title: "Atur Jadwal Operasional",
          desc: "Mengatur jam buka, durasi per slot, dan slot waktu khusus / hari libur.",
          tasks: [
            { id: "task-207", title: "Panel konfigurasi jam operasional (Weekday vs Weekend)", status: "todo", priority: "Utama" },
            { id: "task-208", title: "Fitur pemblokiran slot manual untuk event/turnamen pengelola", status: "todo", priority: "Utama" },
            { id: "task-209", title: "Aturan diskon khusus jam sepi (Happy Hours)", status: "todo", priority: "Rendah" }
          ]
        }
      ]
    },

    {
      id: "phase-3",
      phaseNumber: 3,
      title: "Akun Pengguna",
      priority: "high",
      priorityLabel: "Utama",
      color: "#10b981",
      summary: "Fitur untuk mendaftar, masuk, dan mengelola profil serta riwayat pemesanan.",
      subFeatures: [
        {
          id: "sub-3-1",
          title: "Daftar Akun Baru",
          desc: "Membuat akun baru dengan email, nomor WhatsApp, atau Google One-Click Login.",
          tasks: [
            { id: "task-301", title: "Buat halaman register dengan formulir nomor HP & verifikasi OTP WhatsApp", status: "todo", priority: "Utama" },
            { id: "task-302", title: "Integrasi Google OAuth untuk pendaftaran 1-klik", status: "todo", priority: "Utama" },
            { id: "task-303", title: "Validasi form & debounce pengecekan email/telepon unik", status: "todo", priority: "Sedang" },
            { id: "task-304", title: "Handling terms of service & kebijakan privasi", status: "todo", priority: "Rendah" },
            { id: "task-305", title: "Email konfirmasi pendaftaran otomatis", status: "todo", priority: "Sedang" }
          ]
        },
        {
          id: "sub-3-2",
          title: "Masuk & Keluar",
          desc: "Autentikasi aman pengguna, remember me, dan pemulihan kata sandi.",
          tasks: [
            { id: "task-306", title: "Buat halaman login dengan fallback Magic Link dan Password", status: "todo", priority: "Utama" },
            { id: "task-307", title: "Alur Lupa Password dengan reset token via email", status: "todo", priority: "Sedang" },
            { id: "task-308", title: "Middleware proteksi route pengguna & admin", status: "todo", priority: "Utama" },
            { id: "task-309", title: "Sesi handling & auto-refresh JWT token", status: "todo", priority: "Sedang" }
          ]
        },
        {
          id: "sub-3-3",
          title: "Profil Saya",
          desc: "Melihat dan mengedit profil serta riwayat pesanan dan invoice digital.",
          tasks: [
            { id: "task-310", title: "Buat halaman profil saya & form edit data diri", status: "todo", priority: "Sedang" },
            { id: "task-311", title: "Halaman riwayat transaksi dengan tiket QR Code untuk check-in", status: "todo", priority: "Utama" },
            { id: "task-312", title: "Download e-receipt / invoice PDF resmi per booking", status: "todo", priority: "Sedang" },
            { id: "task-313", title: "Fitur pembatalan/reschedule sesuai batas kebijakan waktu", status: "todo", priority: "Utama" },
            { id: "task-314", title: "Statistik total main padel & jam bermain pengguna", status: "todo", priority: "Rendah" }
          ]
        }
      ]
    },

    {
      id: "phase-4",
      phaseNumber: 4,
      title: "Notifikasi",
      priority: "medium",
      priorityLabel: "Utama",
      color: "#8b5cf6",
      summary: "Pengiriman notifikasi otomatis via WhatsApp dan Email untuk konfirmasi dan pengingat.",
      subFeatures: [
        {
          id: "sub-4-1",
          title: "Konfirmasi Booking",
          desc: "Pengiriman pesan instan otomatis saat pembayaran berhasil diverifikasi.",
          tasks: [
            { id: "task-401", title: "Buat webhook handler penerima status sukses payment gateway", status: "todo", priority: "Utama" },
            { id: "task-402", title: "Template pesan WhatsApp konfirmasi booking lengkap info lapangan & QR", status: "todo", priority: "Utama" },
            { id: "task-403", title: "Template email HTML konfirmasi booking beserta lampiran kalender ICS", status: "todo", priority: "Sedang" },
            { id: "task-404", title: "Bangun komponen in-app toast notifikasi real-time", status: "todo", priority: "Sedang" }
          ]
        },
        {
          id: "sub-4-2",
          title: "Pengingat Jadwal",
          desc: "Sistem pengingat terjadwal (H-2 jam sebelum main) agar pelanggan tidak terlambat.",
          tasks: [
            { id: "task-405", title: "Setup Cron Job / Background worker untuk pengecekan jadwal mendatang", status: "todo", priority: "Utama" },
            { id: "task-406", title: "Dispatcher pesan pengingat WhatsApp otomatis (H-2 jam & H-24 jam)", status: "todo", priority: "Utama" },
            { id: "task-407", title: "Notifikasi ke Admin bila ada booking baru masuk", status: "todo", priority: "Sedang" },
            { id: "task-408", title: "Fitur broadcast pengumuman darurat jika lapangan sedang maintenance", status: "todo", priority: "Rendah" },
            { id: "task-409", title: "Log history pengiriman notifikasi untuk audit pengelola", status: "todo", priority: "Rendah" }
          ]
        }
      ]
    }
  ],

  prdSections: [
    {
      id: "overview",
      title: "1. Overview",
      content: `### 1. Overview Proyek\n\n**Nama Produk:** Padel Cepat oc go  \n**Tujuan Utama:** Mengotomatiskan proses pemesanan lapangan padel dari alur manual berbasis chat WhatsApp menjadi pengalaman mandiri instan kurang dari 60 detik.\n\n#### Masalah yang Diselesaikan:\n- Sering terjadi jadwal bentrok (*double booking*) karena admin lambat membalas chat.\n- Pelanggan frustrasi harus menanyakan jadwal kosong satu per satu secara berulang.\n- Rekap pembayaran manual rawan selisih dan bukti transfer palsu.\n\n#### Target Pengguna:\n1. **Pemain Padel (End-User):** Orang yang ingin cepat menemukan slot lapangan kosong dan booking instan.\n2. **Pengelola / Owner Lapangan (Admin):** Membutuhkan visibilitas real-time terhadap okupansi lapangan dan pendapatan otomatis.`
    },
    {
      id: "requirements",
      title: "2. Requirements",
      content: `### 2. Kebutuhan Sistem & Spesifikasi Fungsional\n\n#### Functional Requirements:\n- **FR-01:** Pengguna dapat melihat ketersediaan slot lapangan secara real-time berdasarkan tanggal dan rentang jam.\n- **FR-02:** Sistem harus mengunci slot selama 10 menit ketika pengguna memulai proses checkout untuk menghindari pemesanan ganda.\n- **FR-03:** Sistem harus menerima pembayaran melalui QRIS, Virtual Account, dan E-Wallet dengan auto-verifikasi.\n- **FR-04:** Sistem wajib mengirim tiket digital dan link lokasi via WhatsApp segera setelah pembayaran sukses.\n- **FR-05:** Admin memiliki wewenang untuk mengatur harga khusus (peak hours), jadwal operasional, dan blokir slot manual.\n\n#### Non-Functional Requirements:\n- **NFR-01 (Performance):** Respon loading kalender jadwal < 500ms.\n- **NFR-02 (Reliability):** Uptime sistem minimal 99.8%.\n- **NFR-03 (Security):** Semua data sensitif terenkripsi SSL/TLS dan integrasi gateway berstandar PCI-DSS.`
    },
    {
      id: "core-features",
      title: "3. Core Features",
      isPhased: true
    },
    {
      id: "user-flow",
      title: "4. User Flow",
      content: `### 4. Alur Pengguna (User Flow)\n\n\`\`\`\n[ Pengunjung Web ]\n       │\n       ▼\n[ Pilih Tanggal & Lihat Kalender Lapangan ]\n       │\n       ▼\n[ Pilih Slot Kosong & Durasi Main ]\n       │\n       ▼\n[ Slot Terkunci (Holding 10m) ➔ Isi No. WhatsApp ]\n       │\n       ▼\n[ Pilih Pembayaran QRIS / VA / E-Wallet ]\n       │\n       ▼\n[ Pembayaran Terverifikasi Otomatis ]\n       ├──► [ Tampilkan Tiket Digital & QR Code di Web ]\n       └──► [ Bot WhatsApp Otomatis Kirim Tiket & Kalender ke User ]\n\`\`\``
    },
    {
      id: "architecture",
      title: "5. Architecture",
      content: `Aplikasi ini akan menggunakan pendekatan *Full-stack Monolith* secara modern menggunakan sistem Server-Side Rendering (SSR) dan API *routes* terpadu dalam satu wadah (*framework*).`
    },
    {
      id: "db-schema",
      title: "6. Database Schema",
      content: `Berikut adalah struktur dasar tabel yang diperlukan untuk menunjang kebutuhan aplikasi:

- **Users** (Tabel Pengguna): Menyimpan data admin dan pelanggan.  
\`id\` (String/UUID) - Identifier unik pengguna. \`name\` (String) - Nama lengkap. \`email\` (String) - Email untuk login dan notifikasi. \`phone\` (String) - Nomor telepon / WA pelanggan. * \`role\` (String) - Penentu hak akses ('ADMIN' atau 'CUSTOMER').

- **Courts** (Tabel Lapangan): Menyimpan informasi lapangan padel.  
\`id\` (String/UUID) - Identifier unik lapangan. \`name\` (String) - Nama lapangan (Misal: Lapangan A, Lapangan B). * \`status\` (String) - Status lapangan ('AKTIF', 'PERAWATAN').

- **Bookings** (Tabel Pemesanan): Menyimpan data transaksi/booking.  
\`id\` (String/UUID) - Identifier unik booking. \`userId\` (String) - Relasi ke tabel Users (Pemesan). \`courtId\` (String) - Relasi ke tabel Courts (Lapangan). \`date\` (Date) - Tanggal bermain. \`startTime\` (Time) - Jam mulai main. \`endTime\` (Time) - Jam selesai bermain. * \`status\` (String) - Status booking ('TERKONFIRMASI', 'DIBATALKAN').`
    },
    {
      id: "tech-stack",
      title: "7. Tech Stack",
      content: `Berikut adalah rekomendasi tumpukan teknologi (tech stack) yang sangat modern, ringan, hemat biaya, dan cepat dikembangkan:

- **Frontend:** Next.js (App Router), React, Tailwind CSS untuk *styling* cepat.
- **UI Components:** shadcn/ui (Library komponen yang ringan, bersih, dan mudah diakses).
- **Backend:** Next.js (Server Actions / API Routes bersatu dengan Frontend).
- **Autentikasi:** Better Auth (Mudah untuk mengelola pendaftaran, login, sesi, hingga pembedaan antara admin & kustomer).
- **Database:** SQLite (Sangat cepat dan simpel untuk menyimpan data tahap awal hingga menengah).
- **ORM:** Drizzle ORM (Memberikan kontrol basis data yang kokoh via *TypeScript*).
- **Deployment:** Vercel (Otomasi perilisan, dioptimalkan secara langsung untuk Next.js dengan gratis/murah).`
    }
  ]
};

// Expose globally
window.PRD_DATA = PRD_DATA;
