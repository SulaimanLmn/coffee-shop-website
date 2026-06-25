# Bean & Bloom — Coffee Shop MVP

A customer-facing storefront for a specialty coffee shop, with Stripe checkout and a password-protected admin dashboard. Built as a final-project MVP.

## Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS v4
- **Database:** PostgreSQL via Docker + Prisma ORM
- **Payments:** Stripe (one-time payment)
- **Cart:** Zustand (client-side, persisted to localStorage)
- **Admin:** password-protected (env variable) using Server Actions

## Features

- **Storefront (`/`):** Hero, trust strip, and a React Server Component product grid fed from the database. Each card has an "Add to Cart" button (client interactivity only where needed).
- **Cart (`/cart`):** Quantity selectors, live totals, free-shipping over $40, and a Checkout button that creates a Stripe Checkout session.
- **Success (`/success`):** Verifies the Stripe session and shows the amount paid + order reference.
- **Admin (`/admin`):** Password gate, then a dashboard with product CRUD (Server Actions) and an order-history table.
- **`/api/checkout`:** Validates the cart against the DB (authoritative prices), then creates a Stripe Checkout session.
- **`/api/webhooks/stripe`:** Verifies the Stripe signature, then saves the order + line items in an atomic, idempotent transaction.

Prices are stored as integers in cents and displayed via `Intl.NumberFormat`. All Stripe logic stays server-side.

## Getting started

### 1. Environment

Copy `.env.example` to `.env` and fill in your Stripe keys and admin password:

```bash
cp .env.example .env
```

You need:

- `DATABASE_URL` — already set to match `docker-compose.yml`.
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — from https://dashboard.stripe.com/test/apikeys
- `STRIPE_WEBHOOK_SECRET` — from the Stripe CLI (see below).
- `APP_URL` — the public base URL of the app, used to build Stripe redirect URLs safely. Set to `https://your-domain.com` in production (defaults to `http://localhost:3000` for local dev).
- `ADMIN_PASSWORD` — the password for `/admin` (default `admin123`).

### 2. Database

Start PostgreSQL and run the migration + seed:

```bash
docker compose up -d          # start Postgres on localhost:5432
npm run db:migrate            # create tables
npm run db:seed               # seed 6 sample products
```

### 3. Run

```bash
npm run dev                   # http://localhost:3000
```

### 4. Stripe webhooks (local testing)

In a separate terminal, forward Stripe events to the webhook route:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` secret it prints into `STRIPE_WEBHOOK_SECRET` in your `.env`, then trigger test checkouts.

## Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Lint with ESLint |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed sample products |
| `npm run db:studio` | Open Prisma Studio |

## Project structure

```
src/
  app/
    page.tsx              # Storefront (RSC hero + product grid)
    cart/page.tsx         # Cart (client) + checkout
    success/page.tsx      # Thank-you page (verifies Stripe session)
    admin/
      page.tsx            # Admin dashboard (auth gate + products + orders)
      actions.ts          # Server Actions: login, CRUD, logout
    api/
      checkout/route.ts   # Create Stripe Checkout session
      webhooks/stripe/route.ts  # Verify + save orders
  components/             # ProductCard, AddToCart, cart, admin forms
  lib/                    # prisma client, stripe client, cart store, format
prisma/
  schema.prisma           # Product, Order, OrderItem
  seed.ts                 # Sample products
docker-compose.yml        # PostgreSQL
```
