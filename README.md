# Ecoo — Ecommerce SaaS

Multi-tenant ecommerce platform with SEO-optimized storefront, admin panel, and NestJS API.

## Stack

| App | Tech |
|-----|------|
| Storefront | Next.js 15, Tailwind 4, mobile-first UI |
| Admin | React 19 + Vite, responsive sidebar |
| API | NestJS, MongoDB, GraphQL + REST, JWT auth |

## Quick start

```bash
# 1. Start databases (or: docker compose up -d)
pnpm db:up

# 2. Copy & sync env across all apps
cp .env.example .env   # first time only
pnpm setup:env

# 3. Add Razorpay test keys to .env (both root and apps/api/.env)
#    Get keys: https://dashboard.razorpay.com/app/keys
#    RAZORPAY_KEY_ID=rzp_test_...
#    RAZORPAY_KEY_SECRET=...

# 4. Install & run
pnpm install
pnpm dev:api
pnpm dev:storefront
pnpm dev:admin
```

| Service | URL |
|---------|-----|
| Storefront | http://localhost:3000 |
| Admin | http://localhost:5173 |
| API | http://localhost:4000 |
| GraphQL | http://localhost:4000/graphql |

> Run `pnpm migrate` to sync env and start databases. All store content is managed via the admin panel.

## Production deploy

| App | Host |
|-----|------|
| Storefront + Admin | Vercel |
| API (`apps/api`) | Render |

API deploys from Render after you connect this GitHub repo (`render.yaml`).

1. Render Dashboard → **New** → **Blueprint** (or Web Service) → this repo, branch `main`.
2. Set API env vars in Render (`MONGODB_URI`, JWT, CORS, Razorpay, Cloudinary).
3. Point Vercel `NEXT_PUBLIC_API_URL` and `VITE_API_URL` at the Render URL (or `https://api.bambooecohub.com`).
4. Include Vercel storefront/admin origins in Render `CORS_ORIGINS`.

## Docs

See [docs/MASTER_SPEC.md](docs/MASTER_SPEC.md) for full architecture, DB schema, SEO plan, and build sequence.

## Project structure

```
ecoo/
├── apps/
│   ├── api/          # NestJS — multi-tenant REST + GraphQL
│   ├── storefront/   # Next.js 15 — customer-facing
│   └── admin/        # Vite — internal admin
└── docs/
    └── MASTER_SPEC.md
```
