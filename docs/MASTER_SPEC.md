# Ecommerce SaaS — Master Spec

Full combined version — architecture, frontend, backend, DB, UI/3D, SEO.

## 1. System architecture overview

### Storefront (customer-facing, SEO-critical)

- **Next.js 15** (App Router + React Server Components) — server-rendered HTML on first request, required for SEO since Google delays JS rendering and AI crawlers (GPTBot, PerplexityBot, ClaudeBot) often skip JS entirely.
- **Rendering mix:** SSG for static/landing/guide pages, ISR for product/category pages (revalidate on price/stock webhook), SSR only for personalized pages (cart, account — all noindex).
- **Island architecture** — hydrate only interactive components (cart, filters, 3D viewer) to keep INP low.

### Admin panel (internal, not indexed)

- React 18 + Vite + TailwindCSS, separate subdomain (`admin.yourdomain.com`), blocked in robots.txt, noindex.

### Backend

- Node.js + NestJS — REST for admin/mobile, GraphQL for storefront (fetch exact fields per page, faster TTFB).
- Multi-tenant via `tenantId` on every document/collection + tenant-aware middleware.
- Auth: JWT + refresh tokens.

### Database

- **MongoDB (Atlas)** — primary datastore, schema detailed in Section 4.
- **Redis (ElastiCache)** — sessions, cart, hot product cache.
- **MongoDB Atlas Search (or Algolia)** — faceted product search/autocomplete.

### AWS infrastructure

- ECS Fargate + ALB — NestJS API containers, auto-scaling, blue/green deploys.
- S3 + CloudFront — static assets, product images, 3D models (.glb/.usdz), Next.js static output.
- SQS + Lambda — async jobs: order emails, invoice PDFs, image/3D-asset processing.
- Route 53 + ACM — DNS + SSL.
- CloudWatch — monitoring, latency/error alarms.

---

## 2. Storefront pages (full list)

| # | Page | Render mode | Notes |
|---|------|-------------|-------|
| 1 | Homepage `/` | SSG, revalidate 1h | Hero (3D scene), featured categories, best sellers |
| 2 | Category `/category/[slug]` | ISR, 10m | Filters, sort, pagination. Canonical to unfiltered base URL |
| 3 | Subcategory `/category/[slug]/[subslug]` | ISR | Breadcrumb required |
| 4 | Product `/product/[slug]` | ISR, webhook revalidate | Static hero image first (LCP), 3D/AR toggle, JSON-LD |
| 5 | Search `/search?q=` | SSR, noindex | |
| 6 | Cart `/cart` | CSR, noindex | |
| 7 | Checkout `/checkout` | CSR, noindex, nofollow | |
| 8 | Order confirmation `/order/[id]/confirmation` | SSR, noindex | |
| 9 | Account `/account` | CSR | |
| 10 | Order history `/account/orders/[id]` | CSR | |
| 11 | Wishlist `/account/wishlist` | CSR | |
| 12 | Login/Register/Reset | SSR, noindex | |
| 13 | Brand `/brand/[slug]` | ISR | Programmatic SEO |
| 14 | Guides `/guides/[slug]` | SSG | Buying guides, comparisons |
| 15 | Guides index `/guides` | ISR | Paginated, categorized |
| 16 | Collections `/collections/[slug]` | SSG | GSAP scroll storytelling |
| 17 | Static `/pages/[slug]` | SSG | About, Contact, FAQ, etc. |
| 18 | Store locator `/stores` | SSG | LocalBusiness schema |
| 19 | 404 | Static | Real 404 status |
| 20 | Sitemaps | Auto-generated | Split by type |

**Programmatic SEO (build later):** `/compare/...`, `/best-[category]-for-[use-case]`, `/[category]-in-[city]`

---

## 3. Admin panel pages

Login (2FA), Dashboard, Products (3D upload), Variants, Categories, Inventory, Orders, Customers, Discounts, Reviews moderation, Content manager, SEO manager, Media library, Analytics, Multi-tenant settings, Team & RBAC, Settings (payment, shipping, tax).

---

## 4. Database — MongoDB (multi-tenant)

See `apps/api/src/schemas/` for live Mongoose implementations.

**Embed vs reference:** embed variants/images/order items; reference reviews, users, content pages.

**Indexes (create before launch):**

```javascript
db.products.createIndex({ tenantId: 1, status: 1, slug: 1 }, { unique: true })
db.products.createIndex({ tenantId: 1, categoryId: 1 })
db.products.createIndex({ title: "text", description: "text" })
db.orders.createIndex({ tenantId: 1, status: 1, createdAt: -1 })
db.reviews.createIndex({ productId: 1, status: 1 })
db.contentPages.createIndex({ tenantId: 1, slug: 1 }, { unique: true })
```

---

## 5. UI, 3D/animation, theme

| Use case | Library |
|----------|---------|
| Product 360°/AR | `<model-viewer>` |
| Homepage hero 3D | React Three Fiber + drei |
| Scroll-pinned stories | GSAP ScrollTrigger + Lenis |
| Micro-interactions | Framer Motion |

### Color system

**Light:** Background `#FAFAF8`, Surface `#FFFFFF`, Text `#1A1A1A` / `#6B6B6B`, Accent Gold `#B8926A`, Border `#E5E3DE`

**Dark:** Background `#0E0E0F`, Surface `#1A1A1C`, Text `#F2F0EC` / `#A0A0A0`, Accent lightened ~10–15%

**UI:** Tailwind + shadcn/ui + next-themes + Embla Carousel. Mobile-first (65%+ traffic).

---

## 6. SEO plan

- Unique titles, H1, alt text, price/availability in initial HTML
- JSON-LD: Product, BreadcrumbList, Organization, Article
- SSR/ISR for indexable routes; canonical tags; robots.txt allows AI crawlers
- Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1
- 3D never LCP; crawlers can't read WebGL

---

## 7. Build sequence

1. MongoDB schema + multi-tenant auth ✅
2. Admin: products, categories, orders, customers, content, media, settings, analytics ✅ (discounts/team RBAC pending)
3. Storefront: homepage, category, product, cart, checkout, account, guides, stores, track-order ✅
4. Scroll-driven collection pages (GSAP + Lenis) ✅
5. Checkout + orders flow ✅ (Razorpay + mock dev mode; stock decrements on payment confirm)
6. GSC verification + sitemap submission 🔄 (meta tag + sitemap ready; submit in GSC dashboard)
7. Blog/guides + first 10 SEO guides ✅
8. Redirects manager, review moderation, SEO overrides 🔄 (redirects + reviews done; per-page meta overrides pending)
9. Lighthouse performance pass on 3D pages 🔄 (lazy 3D viewer — product page JS 441kB → 140kB; collections pending)
10. Programmatic SEO pages 🔄 (`/brand/[slug]` live per category; compare/city pages pending)
