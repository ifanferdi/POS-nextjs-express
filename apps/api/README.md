# @pos/api — Express backend

Backend API for the POS application: Express 4 + TypeScript + Prisma 7, organized in a layered (clean) architecture and versioned under `/api/v1`.

## Stack

| Category       | Technology                                        |
| -------------- | ------------------------------------------------- |
| Runtime        | Bun (dev + prod)                                  |
| Framework      | Express 4                                         |
| Language       | TypeScript                                        |
| ORM            | Prisma 7 + PostgreSQL (via `@prisma/adapter-pg`)  |
| Cache          | Redis (me cache, permission cache, order counter) |
| Message queue  | RabbitMQ (`amqplib`)                              |
| Object storage | S3-compatible API (private bucket)                |
| Auth           | JSON Web Tokens + argon2                          |
| Payments       | Midtrans (Snap)                                   |
| Realtime       | SSE, bridged across instances via Redis           |
| Docs           | Swagger UI + OpenAPI                              |
| Observability  | Sentry (errors + tracing), morgan                 |

## Architecture

Requests flow through four layers:

```
adapters/http        controllers, routes, middleware, SSE   (entry)
        │
domain/use-cases     application services — one class per operation
        │
domain/entities      domain model + repository interfaces
        │
infrastructure       Prisma, Redis, RabbitMQ, S3, event stream
```

Dependency injection is done by hand in `bootstrap.ts`: it constructs every use case (passing the Redis client) and every controller, then mounts them through `adapters/http/webserver/express.ts`.

### Folder map

```
src/
├── adapters/
│   ├── http/               # controller/, routes/, webserver/ (Express, middleware)
│   └── events/             # event adapters
├── domain/
│   ├── entities/           # models/, enums/, types/
│   ├── repositories/       # repository INTERFACES
│   └── use-cases/          # use-case INTERFACES (per feature)
├── use-cases/              # use-case IMPLEMENTATIONS (auth/, product/, order/, ...)
├── repositories/           # repository IMPLEMENTATIONS (database/, redis/, filesystem/, midtrans/, ...)
├── infrastructure/         # database (Prisma), redis, rabbitmq, event-stream, nodemailer
├── validations/            # Zod schemas (per feature)
├── helpers/                # jwt, password, paginate, error, axios, ...
├── config/                 # config.ts + auth/database/storage/midtrans configs
├── constants/              # HTTP status codes + messages
└── logging/                # Sentry
```

The split between `domain/use-cases` + `domain/repositories` (interfaces) and `use-cases/` + `repositories/` (implementations) is the dependency-rule boundary: the domain defines _what_ operations and persistence look like; the outer layers implement them.

## Domain model

`User`, `Profile`, `Role`, `Permission`, `RoleHasPermission`, `Category`, `Product`, `ProductHasCategory`, `Order`, `OrderItem`, `Payment`, `MidtransPaymentDetail`.

Schema: `src/infrastructure/database/prisma/schemas/schema.prisma`.

## API surface

All routes are prefixed `/api/v1` and protected by JWT middleware unless noted. The authoritative contract is the Swagger UI and `docs/openapi.yaml`.

| Resource    | Verbs / endpoints                                                                                                                                                                                 | Notes                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Auth        | `POST /auth/sign-in`, `/sign-out`, `/refresh-token`                                                                                                                                               | Public                           |
| Users       | `GET /users`, `POST /users/get`, `GET /users/:id`, `POST /users`, `PUT /users/:id`, `DELETE /users/:id`, `DELETE /users/:id/permanently`, `POST /users/:id/restore`, `POST /users/profile/upload` | Soft + hard delete, restore      |
| Users       | `GET /users/me`                                                                                                                                                                                   | Current user                     |
| Roles       | list/get + `POST /roles`, `PUT /roles/:id`, `DELETE /roles/:id`, `POST /roles/assign-permissions`                                                                                                 |                                  |
| Permissions | list/get + `POST /permissions`, `PUT /permissions/:id`, `DELETE /permissions/:id`, `POST /permissions/check-valid-permissions`                                                                    |                                  |
| Categories  | CRUD (`POST /categories`, `PUT /categories/:id`, `DELETE /categories/:id`)                                                                                                                        |                                  |
| Products    | CRUD + `DELETE /products/:id/permanently`, `POST /products/:id/restore`, `POST /products/upload`                                                                                                  | Soft + hard delete, image upload |
| Orders      | list/get + `POST /orders`, `PUT /orders/:id/status`, `POST /orders/:id/cancel`                                                                                                                    |                                  |
| Payments    | list/get + `GET /payments/:orderId/order`                                                                                                                                                         |                                  |
| Dashboard   | `GET /dashboard`                                                                                                                                                                                  | POS aggregate                    |
| Uploads     | `POST /uploads/generate-presign-url`                                                                                                                                                              | S3 presigned PUT                  |
| Webhooks    | `POST /webhooks/midtrans`, `POST /webhooks/midtrans/mock`                                                                                                                                         | Public                           |
| SSE         | `GET /sse`                                                                                                                                                                                        | Realtime stream                  |

## Penyimpanan file terkelola

API menyimpan file produk dan profil yang dikelola aplikasi melalui S3 privat. AWS S3 dan endpoint yang kompatibel dengan S3 didukung. API tidak menyediakan backend filesystem/local atau endpoint file `/public/files`.

`POST /api/v1/uploads/generate-presign-url` mengembalikan `key`, `presignUrl`, dan `expiresIn`. Client mengunggah bytes dengan PUT ke `presignUrl`, lalu menyimpan nilai `key` sebagai referensi permanen. Jangan menyimpan `presignUrl` sebagai `imagePath` atau referensi file yang stabil.

Upload multipart produk melalui `POST /api/v1/products/upload` mengembalikan `message` dan `imagePath`; untuk file terkelola, `imagePath` adalah object key. Object key produk berada di prefix `products/`, sedangkan object key profil berada di `profiles/`.
- Respons baca produk dan pengguna menampilkan `imagePath` dan `imageUrl`. Untuk file terkelola, `imagePath` adalah object key yang stabil dan `imageUrl` adalah signed GET URL sementara. Tampilkan `imageUrl`; setelah expiry, ambil ulang resource produk atau pengguna terkait agar API memberikan URL baru. Jangan membuat signature di client atau menyimpan signed URL sebagai referensi permanen.
- URL gambar produk pihak ketiga tetap didukung. URL local API dan URL absolut endpoint S3 tidak diteruskan sebagai URL gambar tanpa signing.

Client yang memakai Next.js Image perlu mengizinkan host pada `S3_PUBLIC_ENDPOINT`. Cart atau cache yang menyimpan `imageUrl` harus mengambil ulang produk ketika URL kedaluwarsa; menyimpan object key saja tidak memperbarui URL secara otomatis. Perubahan client ini belum diterapkan di repository API.

Saat beralih dari penyimpanan local, tidak ada migrasi otomatis untuk file atau referensi lama. Rencanakan pemindahan file terkelola ke S3 dan penggantian referensinya dengan object key sebelum memakai API tanpa endpoint local. Jangan pindahkan URL gambar pihak ketiga ke S3 sebagai bagian dari perubahan ini.

Bucket S3 harus privat. Akses anonim tidak didukung. Masa berlaku signed URL saat diperiksa adalah `config.storage.expiredTime`, sebesar 3600 detik; respons upload menyertakan `expiresIn`. Tidak ada environment variable khusus expiry yang tercatat.

**Permission gating:** every resource's `showRoutes` is gated by a `"Show X"` permission and `manageRoutes` by `"Manage X"` via the `Authorization` middleware (see `routes/*.routes.ts`). Permission strings live in the frontend (`apps/app/lib/permission.ts`) and are seeded through `src/infrastructure/database/seeders/`.

## Auth

- **Modes** — `AUTH_MODE` is `stateless` (JWT only) or `stateful` (session persisted in Redis).
- **Tokens** — short-lived access token (JWT, stateless: no Redis lookup) + refresh token stateful Redis session, rotates automatically when used.
- **2FA** — optional (`AUTH_USE_2FA`); an OTP is emailed via SMTP and verified before access, with rate limiting.
- **Middleware chain** — `ExtractJwtToken` reads/validates the token, `Authorization` enforces permissions; managed-file reads use signed S3 GET URLs, not local-file signatures.

## Setup

### Docker (from repo root)

```bash
export HASH_SECRET="$(openssl rand -hex 64)"
docker compose up -d --build
docker compose --profile setup run --rm api-init   # push Prisma schema + seed
```

Keep the generated value in an untracked `.env` file or a deployment secret store for later Compose commands.

### Manual

```bash
bun install
bun run dev                     # bun --watch src/app.ts (port 8000)
```

Database scripts:

```bash
bun run db:migrate              # prisma migrate dev
bun run db:seed                 # seed
bun run db:fresh:seed           # reset + migrate + seed
```

Swagger UI: http://localhost:8000/docs

## Environment variables

Defaults live in `src/config/` (grouped below); override via `.env` or the `x-api-env` anchor in the root `docker-compose.yml`.

| Group | Key variables | Notes |
| --- | --- | --- |
| App | `APP_NAME`, `APP_ENV`, `APP_PORT`, `APP_URL`, `APP_VERSION` | |
| Database | `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_HOST`, `DB_PORT`, `DB_USE_SSL` | |
| Auth | `AUTH_MODE`, `AUTH_USE_2FA`, `AUTH_TOKEN_TIMEOUT`, `AUTH_REFRESH_TOKEN_TIMEOUT`, `AUTH_OTP_*`, `HASH_SECRET` | Required; provide a unique value from the environment or a secret store (`openssl rand -hex 64`). |
| Redis | `REDIS_URL`, `ME_CACHE_TTL`, `ORDER_COUNTR_REDIS_TIMEOUT` | |
| RabbitMQ | `RABBITMQ_URL`, `RABBITMQ_EXCHANGE` | |
| Storage | `S3_REGION`, `S3_BUCKET`, `S3_ACCESS`, `S3_SECRET`, `S3_ENDPOINT`, `S3_PUBLIC_ENDPOINT` | Bucket/region required; static keys are a pair or use the AWS credential provider chain. `S3_PUBLIC_ENDPOINT` is optional and must be reachable by clients. Use a private bucket. |
| Midtrans | `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION`, `MIDTRANS_EXPIRY_MINUTES` | |
| SMTP | `SMTP_USER`, `SMTP_PASS` | Used for 2FA OTP. |
| Sentry | `SENTRY_DSN` | |
| SSE | `SSE_CHANNEL` | |

Some entries in `config.ts` (Elasticsearch host/key, `GRPC_PORT`, `SCHEDULE_SERVICE_URL`, `AXIOS_TIMEOUT`) are scaffolding not used by the current stack.

## How to add a feature/endpoint

Use `category` (the smallest complete feature) as the reference. The wiring order, end to end:

1. **Entity** — add a model/enum in `src/domain/entities/{models,enums}/`.
2. **Repository interface** — declare it in `src/domain/repositories/`, implement it in `src/repositories/database/` (Prisma).
3. **Use case** — declare the interface in `src/domain/use-cases/`, implement it as one class per operation in `src/use-cases/<feature>/`.
4. **Validation** — add a Zod schema in `src/validations/`.
5. **Controller** — add `src/adapters/http/controller/<feature>-controller.ts`.
6. **Route** — add `src/adapters/http/routes/<feature>.routes.ts`, gating routes with `auth.authorize(...)`.
7. **Wire it** — register the use case and controller in `bootstrap.ts`, then mount the route in `src/adapters/http/routes/index.ts`.
8. **Permissions** — seed the `"Show X"` / `"Manage X"` permission strings and mirror them in the frontend's `lib/permission.ts`.

See the `docs/openapi.yaml` for the full request/response contract and `docs/postman-collection.json` for a ready-to-import Postman collection.
