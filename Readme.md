# POS — Point of Sale (Next.js + Express monorepo)

A Point of Sale (POS) application with a Next.js frontend and an Express API. Both apps use a Bun workspace monorepo and a Docker Compose stack with PostgreSQL, Redis, and MinIO/S3. RabbitMQ integration is available, but the Compose service is disabled by default.

## What it does

The application supports role-based access control (RBAC) and Midtrans payments:

- Sign-in, refresh tokens, and access control through roles and permissions. The API supports optional 2FA (OTP), but the frontend does not yet support its verification flow.
- Products, categories, and images uploaded to S3/MinIO.
- Orders, order items, and status updates.
- Midtrans Snap payments with database synchronization.
- Server-sent events (SSE) for product, user, order, and POS dashboard updates.

## Built with

| Layer           | Technology                                               |
| --------------- | -------------------------------------------------------- |
| Frontend        | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Backend         | Express 4, TypeScript, Prisma 7                          |
| Database        | PostgreSQL 16                                            |
| Cache           | Redis 7                                                  |
| Object storage  | S3-compatible (Minio / SILO)                                    |
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

The frontend uses Server Components for reads and Server Actions for mutations. NextAuth v5 stores access and refresh tokens in an httpOnly JWT session cookie and checks whether to refresh them in the `jwt` callback. Feature modules live under `src/features/` (auth, users, roles, permissions, products, categories, orders, payments, uploads).

Server Actions are reachable through HTTP requests and need their own authentication and authorization checks. Server-only environment variables are not exposed by default; variables prefixed with `NEXT_PUBLIC_` are embedded in the browser bundle at build time. See the [Next.js authentication guide](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/02-guides/authentication.mdx) and [self-hosting guide](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/02-guides/self-hosting.mdx).

The backend uses a layered architecture:

- `adapters/http` (controllers, routes) → `use-cases` (application services) → `domain` (entities, repositories) → `infrastructure` (Prisma, Redis, RabbitMQ, S3, SSE).
- Each use case is a single-purpose class wired in `bootstrap.ts`.

See `apps/app/README.md` and `apps/api/README.md` for the details.

## Design system

The frontend uses shadcn/ui (style `radix-nova`, base Radix) and Tailwind CSS v4. Its theme is defined in `apps/app/src/app/globals.css` and `apps/app/components.json`:

- Colors use `oklch` tokens with a neutral base, a teal-green primary (`oklch(0.55 0.14 175)`), and `success` / `warning` / `info` tokens alongside the shadcn defaults.
- Dark mode uses the `class` strategy via the `.dark` selector and `next-themes`.
- Typography uses Inter for sans and Geist Mono for monospace.
- A single base token defines the `--radius` scale (`sm`…`4xl`).
- Control heights for buttons, inputs, and selects are overridden in a `@layer components` block without changing the primitives.
- Environment variables resolve through the typed configuration in `apps/app/src/config/config.ts`.

## Installation

### Prerequisites

- [Bun](https://bun.sh) (package manager & runtime)
- Docker with Docker Compose v2 (full stack, or infra only for manual dev)

### Docker (recommended)

The Compose defaults are for local development. Set unique secrets and credentials before deployment; the default values are not production-safe. The MinIO initialization service enables anonymous downloads, while the API requires a private bucket. Change that policy before storing private data.

```bash
# 1. Start the full stack (Postgres, Redis, RabbitMQ, MinIO, API, app)
docker compose up -d --build

# 2. One-time: push the Prisma schema and seed the database
docker compose --profile setup run --rm api-init
```

- Frontend: http://localhost:3000
- API: http://localhost:8000 (Swagger UI at `/docs`)

Service credentials can be overridden with env vars (see `docker-compose.yml`). Midtrans requires its keys to be configured.

### Manual development

Configure the frontend and API environments as described in `apps/app/README.md` and `apps/api/README.md`. Initialize the database schema and seed data before using the apps. RabbitMQ is commented out in the current Compose file, so omit it from the infrastructure command below unless you enable the service.

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
├── docker-compose.yml
└── package.json  # Bun workspace scripts
```

## Recommendations

1. Adopt Prisma Migrate. The API currently uses `prisma db push`; generate and commit migrations with `migrate dev`, then apply them with `migrate deploy` in production. Existing databases need a migration baseline. See the [Prisma migration guide](https://github.com/prisma/web/blob/main/apps/blog/content/blog/from-local-to-production-with-prisma-postgres/index.mdx).
2. Make seeders idempotent and environment-aware; separate dev/demo data from prod-only data.
3. Establish a backup and restore strategy for the Postgres and MinIO volumes.
4. Add `prisma migrate diff` to CI to check for schema drift.

## Docs

- `apps/app/README.md`: frontend architecture, folder structure, and conventions.
- `apps/api/README.md`: backend layers, domain model, and endpoints.
- `apps/api/docs/openapi.yaml`: OpenAPI spec.
- `apps/api/docs/postman-collection.json`: Postman collection.

## License

Released under the [MIT License](LICENSE), including for commercial use.
