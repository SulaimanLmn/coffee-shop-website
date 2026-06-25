# Bean & Bloom — Coffee Shop

A specialty coffee storefront with Stripe checkout, customer accounts, and an owner admin dashboard with analytics and order fulfilment. Built as a final project, going well beyond an MVP.

## Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS v4
- **Database:** PostgreSQL via Docker + Prisma ORM
- **Payments:** Stripe (one-time payment) with signature-verified webhooks
- **Cart:** Zustand (client-side, persisted to localStorage)
- **Auth:** Customer accounts via scrypt-hashed passwords + signed session cookies (no auth library); admin via env password
- **Charts:** Hand-rolled SVG (no chart library)

## Features

### Storefront
- **Home** — hero, trust strip, category browser, and a React Server Component product grid fed from the database.
- **Product detail pages** (`/products/[id]`) — full description, roast/origin specs, stock status, quantity selector, related products, SEO metadata + JSON-LD structured data.
- **Categories** (`/category/[slug]`) — beans, ready drinks, and brew gear, each with its own page.
- **Search** (`/search?q=`) — case-insensitive search across name, description, and origin.
- **Cart** (`/cart`) — quantity selectors, live totals, free shipping over $40, Stripe checkout. Prices in cents, displayed via `Intl.NumberFormat`.
- **Success** (`/success`) — verifies the Stripe session and shows the amount paid + order reference.
- Toast notifications on add-to-cart; loading skeletons; empty states; custom 404.

### Customer accounts
- **Sign up / log in** (`/signup`, `/login`) — email + password, scrypt-hashed, signed session cookie.
- **Account** (`/account`) — order history with status badges and totals.
- **Order tracking** (`/account/orders/[id]`) — items, fulfilment timeline, and shipping address (customers can only view their own orders).

### Admin dashboard (`/admin`, password-protected)
- **Analytics** — revenue-over-14-days SVG line chart, top-sellers bar chart, and aggregate stat cards (products, orders, revenue, low-stock) computed via proper Prisma aggregates.
- **Product CRUD** — add/edit/delete with category, roast level, and origin fields, via Server Actions.
- **Low-stock alerts** — products at ≤ 5 units surfaced prominently.
- **Order fulfilment** (`/admin/orders/[id]`) — advance an order through `PAID → ROASTING → SHIPPED → DELIVERED` with timestamps, or cancel (which restores stock). Per-order detail with items, totals, and shipping address.

### Commerce correctness
- **Stock enforcement** — checkout rejects oversold / sold-out carts (409); stock is decremented atomically when an order is paid.
- **Shipping** — a flat-rate shipping line item is added to the Stripe session under $40 (free over $40), so the charged amount always matches the cart total. Shipping address is collected at checkout.
- **Webhook hardening** — signature verification, idempotent order creation (P2002-safe), product re-fetch inside the transaction, async-payment handling (`async_payment_succeeded` / `async_payment_failed`), and stock restoration on cancellation.

## Getting started

### 1. Environment

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

- `DATABASE_URL` — already set to match `docker-compose.yml`.
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — from https://dashboard.stripe.com/test/apikeys
- `STRIPE_WEBHOOK_SECRET` — from the Stripe CLI (see below).
- `APP_URL` — the public base URL, used to build Stripe redirect URLs safely. Set to `https://your-domain.com` in production (defaults to `http://localhost:3000`).
- `CUSTOMER_SESSION_SECRET` — any long random string, used to sign customer session cookies.
- `ADMIN_PASSWORD` — the password for `/admin` (default `admin123`).

### 2. Database

```bash
docker compose up -d          # start Postgres on localhost:5432
npm run db:migrate            # create tables
npm run db:seed               # seed 12 sample products across categories
```

### 3. Run

```bash
npm run dev                   # http://localhost:3000
```

### 4. Stripe webhooks (local testing)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` secret into `STRIPE_WEBHOOK_SECRET`, then trigger test checkouts.

## Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Lint with ESLint |
| `npm run db:migrate` | Apply Prisma migrations (dev) |
| `npm run db:seed` | Seed sample products |
| `npm run db:studio` | Open Prisma Studio |

## Project structure

```
src/
  app/
    page.tsx                       # Storefront home (hero + categories + grid)
    products/[id]/page.tsx         # Product detail (SEO + JSON-LD + related)
    category/[slug]/page.tsx       # Category listing
    search/page.tsx                # Search results
    cart/page.tsx                  # Cart + checkout
    success/page.tsx               # Thank-you / order confirmation
    signup/page.tsx, login/page.tsx
    account/
      page.tsx                     # Order history
      orders/[id]/page.tsx         # Customer order tracking
      actions.ts                   # Auth server actions
    admin/
      page.tsx                     # Dashboard (charts + products + orders)
      orders/[id]/page.tsx         # Order fulfilment
      actions.ts                   # Admin server actions (CRUD + status)
    api/
      checkout/route.ts            # Create Stripe Checkout session
      webhooks/stripe/route.ts     # Verify + save orders, decrement stock
    sitemap.ts, robots.ts          # SEO
  components/                      # ProductCard, AddToCart, charts, forms, toasts…
  lib/                             # prisma, stripe, auth, cart store, pricing, catalog
prisma/
  schema.prisma                    # Product, Customer, Order, OrderItem
  seed.ts                          # 12 sample products
docker-compose.yml                # PostgreSQL
```
