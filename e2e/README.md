# E2E Testing — POS App & API

Workspace Playwright untuk E2E app (Next.js, deploy: https://pos-app-ifan.vercel.app)
dan API (Express, deploy: https://pos-ifan.duckdns.org/api). Suites:

- `tests/ui/` — UI E2E terhadap app terdeploy (auth, navigasi, konten halaman, POS, RBAC, CRUD).
- `tests/api/` — API tests terhadap backend produksi (auth, RBAC matrix, validasi, security probes, CRUD).

## Run

```bash
npm i -D @playwright/test
npx playwright install chromium
npx playwright test --project=ui
npx playwright test --project=api
npx playwright test             # keduanya
```

Env opsional:

| Var | Default |
|---|---|
| `E2E_APP_URL` | `https://pos-app-ifan.vercel.app` |
| `E2E_API_URL` | `https://pos-ifan.duckdns.org/api` |
| `E2E_USERNAME` / `E2E_PASSWORD` | `admin` / `password` (kredensial seed) |

## Catatan penting

- Test berjalan serial (`workers: 1`); sebagian tes membuat data di backend
  produksi lalu membersihkannya (delete/cancel). Order tunai yang dibuat UI test
  (1 item) tidak dibatalkan — nomornya tercetak di log test.
- Kredensial seed produksi: `developer`, `admin`, `user1`..`user100`, semua password `password`.
- Laporan lengkap: `REPORT.md` (hasil test) dan `security-audit.md` (audit keamanan).
- Laporan HTML Playwright: `npx playwright show-report`.
