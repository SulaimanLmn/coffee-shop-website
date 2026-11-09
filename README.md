# Brew Haven: Coffee Shop Ordering and Order Management System

CPP400 final project. A web-based ordering system for a café: customers browse the menu, pay online with **Midtrans (Sandbox)** and collect their order at the counter; administrators manage products, categories and the order queue. Prices are whole **IDR**.

**Stack:** Next.js 16 (App Router, Server Actions), React 19, PostgreSQL 16 (Docker), Prisma, Tailwind CSS 4, Midtrans Snap (Sandbox).

## Features

**Customer**
- Register, log in/out, forgot/reset password, profile (name, email, phone, avatar), change password
- Menu with search by name, category filter, sort by price/name, availability, product detail with recommendations
- Cart (add, change quantity, remove, clear), pickup-time selection, Midtrans Snap checkout
- Payment success/failed pages, order history (status filter, order-ID search, details modal)
- Cancel an order while **Pending**; **Confirm Received** when **Ready for Pickup** (-> Completed)
- Printable receipt for every paid order (`/orders/[id]/receipt`, use *Print / Save as PDF*)

**Administrator** (`/admin`, pre-configured account)
- Dashboard: Total Orders, Total Sales, Pending, Completed, Total Products, Total Categories, 14-day sales chart, top sellers, low-stock list
- Orders: view all paid orders, move Pending -> Preparing -> Ready for Pickup
- Products: add/edit/delete, image by URL or upload (PNG/JPEG/WebP, 2 MB, stored in the database)
- Categories: add/edit/delete (blocked while products use them)

## Order lifecycle

```
checkout -> order PENDING + payment UNPAID (stock reserved)
  Midtrans paid     -> payment PAID           (visible to admin)
  Midtrans failed / expired / cancelled -> order CANCELLED, stock released
admin:    PENDING -> PREPARING -> READY
customer: PENDING -> CANCELLED (paid orders are flagged REFUND_DUE)
customer: READY   -> COMPLETED
```

Payment confirmation works two ways, both idempotent: the Midtrans notification webhook (`/api/webhooks/midtrans`, signature verified) and a status sync with the Midtrans API whenever the customer views the result/orders pages. So it works on `localhost` without a public webhook URL.

## Setup

```bash
npm install
cp .env.example .env        # then edit .env
docker compose up -d db     # PostgreSQL on localhost:5433
npx prisma migrate deploy   # or: npm run db:migrate
npm run db:seed             # categories, 12 menu items, admin account
npm run dev                 # http://localhost:3000
```

Environment (`.env`):
- `DATABASE_URL`: matches `docker-compose.yml` (host port 5433)
- `MIDTRANS_SERVER_KEY`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`: from the [Midtrans Sandbox dashboard](https://dashboard.sandbox.midtrans.com) > Settings > Access Keys
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: the admin account created by the seed (re-run the seed to change the password)
- `SESSION_SECRET`: long random string used to sign session cookies
- `APP_URL`: public base URL

**Admin login:** `/admin/login` with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` values from `.env`.

### Midtrans notification URL (automatic)
When `APP_URL` is an `https://` address, every Snap request sends `X-Override-Notification: <APP_URL>/api/webhooks/midtrans`, so nothing has to be set in the Midtrans dashboard. Locally (`http://localhost`) the payment status is polled instead.

### Sandbox test payments
In the Snap window choose **Card Payment**: card `4811 1111 1111 1114` (success) or `4911 1111 1111 1113` (denied), any future expiry (e.g. `12/30`), CVV `123`, OTP `112233` if a 3D Secure page appears. Bank transfer / e-wallet payments can be simulated from the Midtrans Sandbox simulator. The same steps are shown in the app: on the cart, in a panel beside the Snap window, and on the "payment not completed" page (`src/components/sandbox-guide.tsx`).

## Deployment (Vercel + Neon, free plans)

Live demo: https://brew-haven-sable.vercel.app

- Vercel Hobby project `brew-haven`, region `sin1`; Neon Postgres (free) added from the Vercel Marketplace, which sets `DATABASE_URL`, `DATABASE_URL_UNPOOLED` and `POSTGRES_PRISMA_URL`.
- Other production variables: `MIDTRANS_SERVER_KEY`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `APP_URL`. No SMTP, so password reset runs in demo mode.
- Admin login: https://brew-haven-sable.vercel.app/admin/login (not linked from the shop; `/admin` redirects there). The seed resets the admin password to `ADMIN_PASSWORD` on every deploy.
- `vercel.json` runs `npm run vercel-build`: `prisma migrate deploy` and a first-time seed (only into an empty database) over the unpooled URL, then `next build`.
- Uploaded images are stored in the database (`uploads` table), because serverless hosting has no permanent disk. Menu photos ship with the app in `public/menu/`.
- Deploy: `npx vercel deploy --prod`.

### Forgot password
With `SMTP_HOST` set, the reset link is emailed and the page gives the same answer whether or not the email is registered. Without a mail server (local development and the deployed demo) password reset runs in **demo mode**: a registered customer email opens the new-password page directly, and an unregistered email gets an error. Administrator accounts can never be reset from this page.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm test` | Unit tests (Vitest): order transitions, Midtrans mapping/signature, pickup slots, receipts, catalog queries, validation |
| `npm run lint` | ESLint |
| `npm run db:migrate` / `db:seed` / `db:studio` | Prisma |

## Project layout

```
prisma/            schema, migrations, seed
src/proxy.ts       optimistic route redirects (real checks are in pages/actions)
src/lib/           auth, orders (state machine), order-service, midtrans, pickup, receipt, catalog, uploads, actions/
src/app/           pages, route handlers (checkout, webhook, uploads, cart validate)
src/components/    UI components
public/menu/       seeded menu photos (from Unsplash, bundled so they always load)
```
