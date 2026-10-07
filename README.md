# Beyond Brawn

E-commerce platform for the Beyond Brawn sports nutrition brand.

| Part | Stack | Status |
| --- | --- | --- |
| `backend/` | Node.js, Express, MongoDB (Mongoose), JWT cookies, Razorpay, Nodemailer, Cloudinary | Complete |
| `frontend/` | Next.js 16 (App Router, JavaScript), Tailwind CSS 4 | Storefront and admin panel complete |

## Requirements

- Node.js 18.17 or newer
- MongoDB 6 or newer (local, or MongoDB Atlas)
- Razorpay account (test keys are enough for development)
- SMTP account for email (optional in development: mails and OTPs print to the server console)
- Cloudinary account (optional in development: uploads fall back to local disk)

## Backend setup

```bash
cd backend
cp .env.example .env        # then fill JWT_SECRET, MONGODB_URI, Razorpay keys
npm install
npm run seed                # permissions, roles, admin, catalogue, coupons, FAQ, blog, pages
npm run dev                 # http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health`

### Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | API with auto-reload (nodemon) |
| `npm start` | API for production |
| `npm run seed` | Adds missing seed data and syncs indexes. Safe to re-run, never overwrites your edits |
| `npm run seed:fresh` | Drops the database and seeds from scratch. Refuses to run in production without `--force` |

### Local admin login

| | |
| --- | --- |
| URL | `http://localhost:3000/admin/login` |
| API | `POST /api/admin/auth/login` |
| Email | `admin@beyondbrawn.in` |
| Password | `Admin@12345` |

Both values come from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`. Change the password before going live.

### Database setup

Local: install MongoDB Community, start `mongod`, keep `MONGODB_URI=mongodb://127.0.0.1:27017/beyond_brawn`.

Atlas: create a cluster and a database user, allow your server IP, and paste the connection string into `MONGODB_URI`.

Indexes are created automatically in development. In production they are created when you run `npm run seed` (it calls `syncIndexes`), or set `AUTO_INDEX=1`.

### Razorpay

1. Put `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env` (test keys start with `rzp_test_`).
2. In the Razorpay dashboard add a webhook to `https://api.yourdomain.com/api/payments/webhook` with events `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`, `refund.failed`. Put its secret in `RAZORPAY_WEBHOOK_SECRET`.

The webhook is what confirms an order when the customer closes the browser before the callback runs, so set it up before launch.

### Email

Set the `SMTP_*` variables. Without `SMTP_HOST`, development mode prints every email (including OTP codes) to the server console so all flows still work.

### Images

Set the `CLOUDINARY_*` variables for production. Without them, uploads are written to `backend/src/uploads` and served from `/uploads`.

Seed products point at `/placeholders/product.svg`, which the frontend will serve. Replace them by uploading real images in the admin product form.

## Frontend setup

Start the backend first, then:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

| Variable | Purpose |
| --- | --- |
| `API_URL` | Express API, used by the Next.js server and the `/api` proxy |
| `NEXT_PUBLIC_SITE_URL` | Public storefront URL for canonical links, sitemap and Open Graph |

The browser only ever calls `/api/*` on the storefront's own origin; Next.js proxies it to Express. Auth cookies are therefore first-party, and `CLIENT_URL` in the backend `.env` must be the storefront URL.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build. Run it with the API up, so pages are pre-rendered with real data |
| `npm start` | Serve the production build |

### Admin panel

Open `/admin/login`. It is a separate login from the customer one, with its own cookie.

| Section | What you do there |
| --- | --- |
| Dashboard | Sales today, this month and overall, orders by stage, revenue and order charts, low stock, top sellers |
| Products | Add and edit products in tabs (basics, pricing and stock, images, variants, details, SEO), bulk actions, CSV export; categories, subcategories, brands, attributes |
| Inventory | Stock per SKU, low and out-of-stock filters, adjust stock with a reason, full movement history |
| Orders | Tabs per stage, search, date filter, bulk status change. Open an order, pick the next status, add courier and tracking number, save: the customer is emailed. Refunds and invoice are on the same page |
| Customers | Search, order history and spend, block or unblock |
| Coupons, Reviews, Banners | Create coupons and see usage; approve or reject reviews; homepage hero and promo banners |
| Content | Policy and About pages, FAQ, blog (with an editor), contact messages |
| Marketing | Newsletter list with CSV export; preview, test-send and re-subject the 15 emails |
| Reports | Sales, orders, products and customers for any date range, with CSV export |
| Settings | Store details and logo, contact, social links, shipping methods and pincodes, tax, payment status, SEO, homepage text, footer |
| Admin users | Add staff and assign roles; edit what each role may do |

Menu items and buttons a role cannot use are hidden, and the API enforces the same permissions.

### Logo

No logo file was supplied, so the header, footer, emails and invoice use a type-set wordmark and the favicon is a placeholder (`frontend/app/icon.svg`). Upload the real logo in Admin > Settings > General (one version for white backgrounds, one for black), then replace `app/icon.svg`. If the logo's green differs from `#a8e61d`, change `--color-lime` in `frontend/app/globals.css` and `C.lime` in `backend/src/templates/layout.js`.

### Product images

Seed products use `frontend/public/placeholders/product.svg`. Upload real photos in each product's Images tab.

## Production deployment (VPS, Nginx, PM2)

```bash
# API
cd backend && npm ci --omit=dev
NODE_ENV=production npm run seed       # first deploy only
pm2 start src/server.js --name bb-api

# Storefront (API must be running)
cd ../frontend && npm ci && npm run build
pm2 start npm --name bb-web -- start
pm2 save
```

Backend `.env` essentials:

```
NODE_ENV=production
CLIENT_URL=https://www.beyondbrawn.in
API_PUBLIC_URL=https://api.beyondbrawn.in
TRUST_PROXY=1
JWT_SECRET=<64+ random chars>
JWT_ADMIN_SECRET=<different 64+ random chars>
```

Frontend `.env.local`:

```
API_URL=http://127.0.0.1:5000
NEXT_PUBLIC_SITE_URL=https://www.beyondbrawn.in
```

Nginx:

```nginx
server {
  server_name www.beyondbrawn.in;
  client_max_body_size 30m;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
server {
  # Needed for the Razorpay webhook and for locally stored uploads
  server_name api.beyondbrawn.in;
  client_max_body_size 30m;
  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Add TLS with `certbot --nginx`. Cookies are `Secure` in production, so HTTPS is required.

Notes:

- Because requests reach the API through the Next.js proxy, set `TRUST_PROXY=2` if rate limits should see the shopper's IP (Nginx, then Next.js).
- Run a single PM2 instance of the API, or move rate limiting to a shared store before using cluster mode. The unpaid-order clean-up job is safe to run in several processes.
- Back up MongoDB daily (Atlas does this for you).

## Documentation

- `docs/ARCHITECTURE.md`: system design, data model, payment and order flows, security, frontend plan
- `docs/API.md`: every REST endpoint

## How this build was verified

Backend: run end to end against a MongoDB-compatible test database with Razorpay stubbed. 128 checks covering registration and OTP, login, cart, coupons, guest and logged-in checkout, signature and amount verification, webhook confirmation, duplicate-order guard, stock reservation and release, order emails, refunds, reviews, admin CRUD, inventory, reports and role permissions.

Storefront: production build served against that API. 38 page checks confirmed server-rendered data, JSON-LD, sitemap, robots and correct 404 status, plus register, OTP verify and add-to-cart through the `/api` proxy.

Admin panel: 35 checks sent the same request bodies the admin forms produce (coupon, product with variants, shipping settings, email subjects, roles, admin users) through the proxy with the admin cookie, and read every list, report and export the pages load.

Not exercised, so check these once on your machine:

- Both the storefront and the admin panel in a real browser. No browser was available in the build environment, so every screen was compiled and its API calls were tested, but nothing was seen or clicked. Expect some layout and interaction fixes on first run.
- A real Razorpay test payment from the checkout page, a refund from the admin order page, and the webhook.
- Real SMTP delivery and Cloudinary uploads (including drag-and-drop in the product form).
- Unique and TTL indexes on real MongoDB, and the two filters that compare fields (`offers=1` on the storefront, `stock=low` in the admin product list).
