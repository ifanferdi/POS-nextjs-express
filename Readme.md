# POS — Point of Sale (Next.js + Express monorepo)

A full-stack **Point of Sale (POS)** application: a Next.js frontend and an Express API, managed as a Bun workspace monorepo with a Docker Compose stack (PostgreSQL, Redis, RabbitMQ, MinIO/S3).

## What it does

A POS system with role-based access control (RBAC) and Midtrans payment integration.

- **Auth & RBAC** — sign-in with optional 2FA (OTP), refresh token, and permission-based access control via roles and permissions.
- **Catalog** — products, categories, and product images (uploaded to S3/MinIO).
- **Sales** — orders, order items, and order status updates.
- **Payments** — Midtrans Snap integration with automatic sync back to the database.
- **Real-time** — server-sent events (SSE) for live updates (products, users, orders, POS dashboard).

## Built with

| Layer           | Technology                                               |
| --------------- | -------------------------------------------------------- |
| Frontend        | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Backend         | Express 4, TypeScript, Prisma 7                          |
| Database        | PostgreSQL 16                                            |
| Cache           | Redis 7                                                  |
| Message queue   | RabbitMQ                                                 |
| Object storage  | MinIO (S3-compatible)                                    |
| Payment         | Midtrans                                                 |
| Auth            | NextAuth v5 (frontend), JWT + argon2 (backend)           |
| UI              | Tailwind CSS v4 + shadcn/ui                              |
| Package manager | Bun                                                      |

## Architecture

Monorepo with two apps and a shared Docker Compose network:

```
apps/
├── app/   # Next.js frontend (port 3000)
└── api/   # Express backend (port 8000)

              ┌─────────────┐
  browser ───▶│  Next.js    │──HTTP──▶┌─────────────┐
              │  (app:3000) │          │  Express    │
              └─────────────┘          │  (api:8000) │
                                       └──────┬──────┘
                     ┌──────────┬───────┬─────┼─────────┬─────────┐
                 PostgreSQL    Redis  RabbitMQ  MinIO   Midtrans
                     :5432     :6379   :5672    :9000
```

**Frontend** (Server Components first):

- Reads run as Server Components; mutations run as Server Actions — backend endpoints and tokens are never exposed to the browser.
- NextAuth v5 JWT session holds access/refresh tokens in an httpOnly cookie; refresh is proactive in the `jwt` callback.
- Feature-based modules under `features/` (auth, users, roles, permissions, products, categories, orders, payments, uploads).

**Backend** (layered / clean architecture):

- `adapters/http` (controllers, routes) → `use-cases` (application services) → `domain` (entities, repositories) → `infrastructure` (Prisma, Redis, RabbitMQ, S3, SSE).
- Every use case is a single-purpose class wired in `bootstrap.ts`.

See `apps/app/README.md` and `apps/api/README.md` for the details.

## Design system

The frontend uses **shadcn/ui** (style `radix-nova`, base Radix) on **Tailwind CSS v4**, defined in `apps/app/app/globals.css` and `apps/app/components.json`:

- **Color** — `oklch` tokens; a neutral base with a teal-green primary (`oklch(0.55 0.14 175)`), plus semantic `success` / `warning` / `info` tokens on top of the shadcn defaults.
- **Dark mode** — `class` strategy via the `.dark` selector, toggled with `next-themes`.
- **Typography** — Inter (sans) and Geist Mono.
- **Radius** — a `--radius` scale (`sm`…`4xl`) derived from a single base token.
- **Component sizing** — consistent control heights (button/input/select) overridden in a `@layer components` block without touching the primitives.
- **Centralized config** — all env vars resolve through `apps/app/config/config.ts` (typed, single source of truth).

## Installation

### Docker (recommended)

```bash
# 1. Start the full stack (Postgres, Redis, RabbitMQ, MinIO, API, app)
docker compose up -d --build

# 2. One-time: push the Prisma schema and seed the database
docker compose --profile setup run --rm api-init
```

- Frontend: http://localhost:3000
- API: http://localhost:8000 (Swagger UI at `/docs`)

All service credentials default to safe local values and can be overridden with env vars (see `docker-compose.yml`).

### Manual development

```bash
# 1. Install workspace dependencies
bun install

# 2. Start the infrastructure you need (or use Docker for just the infra)
docker compose up -d postgres redis rabbitmq minio minio-init

# 3. Run the apps
bun run dev:api   # http://localhost:8000
bun run dev:app   # http://localhost:3000
```

Other scripts: `bun run build:api`, `bun run build:app`, `bun run lint`.

## Repo layout

```
.
├── apps/
│   ├── app/      # Next.js frontend
│   └── api/      # Express + Prisma backend
├── docs/
│   ├── observability-backend.md
│   └── observability-frontend.md
├── docker-compose.yml
└── package.json  # Bun workspace scripts
```

## Recommendations

1. **Adopt Prisma Migrate** — the API currently uses `prisma db push`; generate and commit real migrations (`migrate dev` / `migrate deploy`) for production safety.
2. **Idempotent, environment-aware seeders** — split dev/demo seed data from prod-only seed data.
3. **Backup/restore** — the Postgres and MinIO volumes have no backup strategy.
4. **Migration drift check in CI** — add `prisma migrate diff` to catch schema drift.

## Docs

- `apps/app/README.md` — frontend details (architecture, folder structure, conventions)
- `apps/api/README.md` — backend details (layers, domain model, endpoints)
- `apps/api/docs/openapi.yaml` — OpenAPI spec · `apps/api/docs/postman-collection.json` — Postman collection
- `docs/observability-backend.md` / `docs/observability-frontend.md` — observability notes
