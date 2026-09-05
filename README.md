# AI PRD Generator — OpenClaw Bridge

Ubah ide produk mentah jadi PRD lengkap, roadmap 4 fase, 40+ task, dan workspace siap-koding — via Cloud AI (Hermes lokal / Gemini / OpenRouter / OpenAI) dengan fallback lokal.

> Stack: Vanilla HTML/CSS/JS (frontend) + Node.js `http` (backend, tanpa Express). Hermes OpenAI-compatible gateway di `http://localhost:20128/v1`.

## Fitur

- **Landing Generator** — input ide, chip template (Padel, POS, Klinik, CRM), interview AI 3–4 pertanyaan klarifikasi.
- **PRD Document** — Overview, Requirements, Core Features (4 fase), Flowchart SOP swimlane, User Journey, Architecture, DB Schema, Tech Stack.
- **Roadmap Mind Map** — canvas interaktif + konektor SVG, panel Requirements ter-parse.
- **Kanban Board** — 4 kolom (Belum mulai / Dikerjakan / Selesai / Gagal), filter per fase, progress bar, SSE realtime.
- **Scope & Biaya** — KPI total biaya, breakdown modul, export PDF/CSV, dokumen SOW formal.
- **OpenClaw Autonomous Runner** — pre-scan dependencies → scaffold foundation (HTML / Next.js / Laravel / Decoupled) → loop eksekusi task via Cloud AI → tulis file ke workspace + SSE log.
- **Multi-archetype scaffold**: `html-prototype`, `nextjs-fullstack`, `laravel-monolith`, `decoupled-api` (React/Vue + Go Fiber / FastAPI).

## Struktur Proyek

```
ai-prd-generator/
├── index.html              # SPA 5 view (initial, prd, mindmap, tasks, scope)
├── css/style.css           # Design system dark cyber + glassmorphism
├── js/
│   ├── app.js              # Frontend logic, SSE, view switching, kanban
│   └── data.js             # PRD_DATA default (Padel Cepat)
├── img/example/            # Screenshot referensi UI
├── server/
│   ├── server.js           # HTTP server + AI gateway + workspace dispatcher
│   ├── package.json        # start + test (node:test)
│   ├── .env.example        # Contoh env Hermes
│   ├── .env                # (git-ignored) env lokal
│   └── test/ninerouter.test.js  # 19 test parser/gateway
└── .gitignore
```

## Prasyarat

- Node.js 20+ (disarankan 22/26)
- Hermes lokal jalan di `http://localhost:20128/v1` (atau provider lain)
- API key Hermes ada di `%LOCALAPPDATA%\hermes\.env` → `HERMES_CUSTOM_LOCALHOST_20128_API_KEY`

## Cara Menjalankan

### 1. Backend

```powershell
cd server
npm install
Copy-Item .env.example .env
# isi NINEROUTER_API_KEY di .env dengan nilai HERMES_CUSTOM_LOCALHOST_20128_API_KEY
npm start
# → http://localhost:4000
# Banner harus: 9Router Gateway: Active ✅ (http://localhost:20128/v1)
```

### 2. Frontend

Buka langsung `index.html` di browser (file://) — frontend memanggil `http://localhost:4000` via `OPENCLAW_API_URL` di `js/app.js`.

Atau serve statis:

```powershell
# dari root
npx serve .
# atau
python -m http.server 5500
```

Buka `http://localhost:3000` atau `http://localhost:5500`.

### 3. Verifikasi

```powershell
cd server
npm test          # 19/19 harus pass
node --check server.js
```

Probe manual:

```powershell
curl -X POST http://localhost:4000/api/generate-questions -H "Content-Type: application/json" -d "{\"prompt\":\"Aplikasi catatan pengeluaran UMKM\",\"language\":\"id\"}"
curl http://localhost:4000/api/status
```

## Konfigurasi Env

`server/.env.example` (Hermes lokal):

```ini
PORT=4000
NODE_ENV=development
OPENCLAW_WORKSPACE=E:/projek-ai/openclaw/workspace

NINEROUTER_API_BASE=http://localhost:20128/v1
NINEROUTER_API_KEY=YOUR_HERMES_LOCAL_API_KEY
NINEROUTER_PRD_MODEL=cx/gpt-5.6-terra
NINEROUTER_TASK_MODEL=cx/gpt-5.4-mini
NINEROUTER_MODEL=cx/gpt-5.6-terra
NINEROUTER_TIMEOUT_MS=240000

GEMINI_API_KEY=YOUR_GEMINI_API_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY
NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET
```

Catatan loader (`server.js:loadEnv`):
- Baca `server/.env`, `E:/projek-ai/.env`, `E:/projek-ai/openclaw/.env` berurutan.
- Nilai mengandung `YOUR_` diabaikan → gateway nonaktif, fallback ke provider lain / synthesizer lokal.
- `GET http://localhost:20128/v1/models` = daftar model valid.

### Model Hermes yang dipakai

| Kebutuhan | Env | Default |
|-----------|-----|---------|
| PRD + interview | `NINEROUTER_PRD_MODEL` | `cx/gpt-5.6-terra` |
| Generate task | `NINEROUTER_TASK_MODEL` | `cx/gpt-5.4-mini` |
| Shared fallback | `NINEROUTER_MODEL` | `cx/gpt-5.6-terra` |

Dropdown di `index.html` + fallback di `js/app.js` sudah sinkron ke ID di atas. Opsi tambahan (butuh parser hybrid): `inferhub/cbcn/deepseek-v4-flash`, `inferhub/cbcn/glm-5.3-flash`, `inferhub/cc/claude-sonnet-4-6`.

## API

Base: `http://localhost:4000`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/status` | Status, workspace, progress |
| POST | `/api/generate-questions` | 3–4 pertanyaan klarifikasi (body: `{prompt, language}`) |
| POST | `/api/generate-prd` | Generate PRD penuh |
| POST | `/api/projects` | Simpan project + tulis `tasks.json`/`prd.md` ke workspace |
| POST | `/api/tasks/run` | Mulai loop eksekusi (body: `{model, techStackConfig}`) |
| POST | `/api/tasks/pause` | Jeda loop |
| POST | `/api/tasks/resume` | Lanjut loop |
| GET | `/api/tasks` | List task + status |
| GET | `/api/events` | SSE stream (`log`, `task_updated`, `run_started`, `run_completed`) |

Workspace output: `OPENCLAW_WORKSPACE/<project-id>/` (fallback `server/workspace/<id>/`) berisi `tasks.json`, `prd.md`, `package.json`, scaffold foundation, dan file per-task + `task_<id>.log`.

## Testing

```powershell
cd server
npm test
```

19 test `node:test` tanpa dependensi tambahan:
- Parser: JSON biasa, JSON + `data: [DONE]` (newline & inline), SSE murni, `data:` di dalam konten bukan SSE, `reasoning_content` diabaikan.
- Gateway: header `Authorization` hanya jika key ada, model default PRD, timeout `NINEROUTER_TIMEOUT_MS` (default 240000).
- Integrasi stub upstream `http` untuk `callNineRouterApi`.

## Alur Kerja (End-to-End)

1. User ketik ide → `POST /api/generate-questions` (Hermes `cx/gpt-5.6-terra`).
2. Jawab interview + pilih Tech Stack (HTML / Next.js / Laravel / Decoupled).
3. `POST /api/generate-prd` → PRD 4 fase + 40+ task.
4. `POST /api/projects` → tulis workspace.
5. `POST /api/tasks/run` → pre-scan deps → scaffold → loop per-task (`cx/gpt-5.4-mini`) → SSE update Kanban.

## Troubleshooting

- **Gateway Disabled** di banner → cek `server/.env` ada dan `NINEROUTER_API_KEY` bukan `YOUR_...`, lalu restart server.
- **401 Missing/Invalid API key** → key salah; copy ulang `HERMES_CUSTOM_LOCALHOST_20128_API_KEY` dari `%LOCALAPPDATA%\hermes\.env`.
- **Timeout 240s** → PRD besar bisa >47s; naikkan `NINEROUTER_TIMEOUT_MS` di `.env`.
- **CORS / Offline di pill** → pastikan backend jalan di 4000 dan frontend fetch ke `http://localhost:4000`.
- **Model 404** → cek `GET /v1/models` Hermes; jangan pakai `coding-*` lama.

## Lisensi

Internal / belum dilisensikan. Tambahkan `LICENSE` jika akan dipublish.
