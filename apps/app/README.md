# @pos/app — Next.js frontend

Boilerplate Next.js (App Router) for applications with authentication, proactive refresh-token handling, and RBAC (Role-Based Access Control). Designed to be reused as a starter: the generic parts (auth mechanism) are separated from the project-specific parts (RBAC fields).

## Stack

| Category | Library |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (preset Nova, base Radix) |
| Auth | NextAuth v5 (`5.0.0-beta.31`, Credentials provider) |
| Form & validation | React Hook Form + Zod |
| Data fetching (client) | TanStack Query — limited, for interactive scenarios (search/filter/pagination) |
| State management | Zustand — UI state only (modal, sidebar, POS cart), NOT tokens/session |
| HTTP client | Axios — server-side (auth callback, refresh token, server API client) |
| Realtime | SSE (server-sent events) via an API route proxy |
| Package manager | Bun |

## Architecture philosophy

1. **Server Components first** — all reads (GET) run in Server Components. Requests happen server-to-server, so endpoints, headers, and tokens are never visible in the browser's Network tab.
2. **Server Actions for mutations** — Create/Update/Delete use Server Actions (`'use server'`), hidden from the client, without separate API routes.
3. **Tokens never reach the browser** — access and refresh tokens live inside the NextAuth JWT session, encrypted in an httpOnly cookie. No tokens in localStorage or Zustand state.
4. **Proactive refresh** — checked in the NextAuth `jwt()` callback every time the session is accessed, before the token is used, rather than reacting to a 401.

## Folder structure

```
apps/app/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx           # Login page
│   ├── (protected)/
│   │   ├── layout.tsx               # Session guard — redirects to /login if unauthenticated
│   │   ├── dashboard/               # POS dashboard
│   │   ├── users/                   # + _components/ (tables, dialogs)
│   │   ├── products/
│   │   ├── categories/
│   │   └── orders/
│   ├── (pos)/
│   │   └── pos/                     # POS cart screen
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # NextAuth handler (re-exported from auth.ts)
│   │   └── sse/route.ts             # SSE proxy to the backend
│   ├── layout.tsx
│   └── page.tsx                     # Landing — redirects to /dashboard or /login
│
├── features/                        # Feature-based modules
│   ├── auth/                        # schema.ts, dto.ts, api.ts, action.ts
│   ├── users/
│   ├── products/
│   ├── categories/
│   ├── orders/
│   ├── payments/
│   ├── roles/
│   └── uploads/
│
├── domain/                          # Shared domain types (*.types.ts) + barrel index
├── components/
│   ├── ui/                          # shadcn/ui components (Button, Dialog, Table, ...)
│   └── shared/                      # table-server, top-bar, filter, status-page, error, ...
├── lib/                             # api-server, permission, sse-proxy, utils, base.schema, helper
├── store/                           # Zustand — pos-cart-store (UI/cart state only)
├── config/config.ts                 # Centralized env resolution (typed)
├── types/next-auth.d.ts             # NextAuth Session & JWT module augmentation
└── auth.ts                          # Root NextAuth config — exports { handlers, signIn, signOut, auth }
```

## Feature file convention

Each feature module holds flat, consistently named files:

| File | Purpose | Runs on |
|---|---|---|
| `schema.ts` | Zod validation schema | Server (action) and client (React Hook Form resolver) |
| `api.ts` | Fetch functions for reads | Server (called from Server Components/actions) |
| `action.ts` | Server Actions (mutations) | Server (called from Client Components) |
| `dto.ts` | Request/response DTO types | Universal |

Not every feature has all four files — add them as needed. Feature-specific UI components live in `app/(protected)/<feature>/_components/`.

## Generic vs project-specific

Because this is meant to be reused, some parts are deliberately separated:

| Part | Nature | Notes |
|---|---|---|
| Refresh-token mechanism (`jwt()` callback) | Generic | Reusable in other projects without major changes |
| Server Component / Server Action pattern | Generic | Base architecture, not domain-bound |
| `createServerApiClient()` (`lib/api-server.ts`) | Generic | Injects the bearer token from the session |
| `role` / `permissions` fields on the session (`next-auth.d.ts`) | Project-specific | RBAC-specific; remove/adjust for non-RBAC projects |
| `PERMISSION` constants (`lib/permission.ts`) | Project-specific | Must match the backend routes |
| Feature modules (`users`, `products`, ...) | Reference implementation | Pattern to copy when adding a new feature |

## Setup

```bash
# 1. Install dependencies
bun install

# 2. Configure environment
#    Defaults live in config/config.ts; override via .env
#    Required: NEXTAUTH_SECRET, API_BASE_URL

# 3. Generate NEXTAUTH_SECRET
openssl rand -base64 32

# 4. Run the development server
bun run dev
```

Open `http://localhost:3000`.

## Environment variables

See `config/config.ts` and the root `docker-compose.yml` (`x-app-env`) for the full list and defaults. Key variables:

- `NEXTAUTH_SECRET` — secret for JWT session encryption, **must be set**
- `API_BASE_URL` — the Express backend URL (default `http://localhost:8000/api`)
- `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` / `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` — Midtrans Snap

## Adding a new feature

Follow the existing pattern (e.g. `features/products/`):

1. Create `features/<feature>/` with `schema.ts`, `api.ts`, and `action.ts` (add `dto.ts` if needed).
2. Define the Zod schema in `schema.ts`.
3. Write fetch functions (for Server Components) in `api.ts`.
4. Write Server Actions (for mutations) in `action.ts`.
5. Create the page under `app/(protected)/<feature>/page.tsx` and any components in `_components/`.
