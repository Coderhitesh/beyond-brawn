# Architecture

## System

```
Browser ── Next.js (SSR + client components) ── /api proxy ──► Express API ──► MongoDB
                                                                  │
                                              Razorpay ◄──────────┤ (orders, verify, refunds, webhook)
                                              SMTP     ◄──────────┤ (OTP, order mails)
                                              Cloudinary ◄────────┘ (images)
```

The Next.js app will proxy `/api/*` to the Express API so auth cookies are first-party. Server components read catalogue data directly from the API and forward the customer cookie when a page is personalised.

## Backend layout

```
backend/src
  config/        env, db, razorpay, cloudinary, permission list
  models/        Mongoose schemas
  validators/    zod schemas for every request body
  middlewares/   auth (customer + admin), validate, rate limiters, upload, error handler
  services/      business logic: pricing, coupon, inventory, order, payment, shipping, otp, email, settings, upload, invoice
  controllers/   thin HTTP handlers; controllers/admin for the admin API
  routes/        route tables
  templates/     15 responsive email templates on one branded layout
  jobs/          releases stock held by unpaid orders
  seed/          demo data
  uploads/       local image fallback for development
```

Rule of thumb: controllers parse and respond, services decide. Stock only changes in `inventory.service`, prices are only calculated in `pricing.service`, order state only changes in `order.service` / `payment.service`.

## Data model

| Model | Purpose | Key relations |
| --- | --- | --- |
| User | Customer account | |
| Admin, Role, Permission | Admin users with role-based permissions | Admin → Role; Role holds permission keys |
| Category, SubCategory, Brand, Attribute | Catalogue structure | SubCategory → Category |
| Product | Catalogue item, content, SEO, flags, mirrored price and stock | → Category, SubCategory, Brand |
| ProductVariant | Flavour / size options with own SKU, price, stock | → Product |
| Inventory | Ledger of every stock movement | → Product, Variant, Order, Admin |
| Cart, Wishlist | One per customer | → User, Product, Variant |
| Address | Saved addresses | → User |
| Order | Order header, address snapshot, pricing snapshot, status history | → User, OrderItem[], Payment |
| OrderItem | Price snapshot of each purchased line | → Order, Product, Variant |
| Payment | Razorpay order, payment id, refunds | → Order |
| Coupon, CouponUsage | Discount rules and per-order usage | CouponUsage → Coupon, User, Order |
| Review | Verified-purchase reviews with moderation | → Product, User, Order |
| Banner, Blog, BlogCategory, FAQ, Page | CMS content | |
| Setting | One document per settings group | |
| EmailOTP | Hashed OTP, attempts, send-rate window | |
| Notification | Customer and admin notifications | |
| Newsletter, ContactMessage, SearchTerm, Counter | Supporting data | |

Indexes: unique on email, SKU, slug, orderNumber, coupon code, Razorpay order id; compound indexes for listing (`isActive + category/brand/price/soldCount`), weighted text index for product search, `createdAt` on high-volume collections, TTL on OTP records.

## Checkout and payment flow

1. `POST /orders/checkout`. The server loads the cart (or the guest's item ids), fetches every price from MongoDB, validates stock, coupon and pincode, and calculates subtotal, discount, shipping, GST and total.
2. Stock is reserved with atomic conditional updates. If any line fails, the earlier lines are released.
3. A Razorpay order is created for the server-calculated amount. A `Pending` order, its items and a `created` payment are stored.
4. The browser opens Razorpay Checkout with the returned order id.
5. `POST /payments/verify`. The server checks `HMAC_SHA256(order_id|payment_id, key_secret)` in constant time, then fetches the payment from Razorpay and matches order id, amount and currency.
6. The payment row is claimed atomically (`created → paid`). Only the winner of that update confirms the order, records coupon usage, updates sold counts, clears the cart and sends emails. The Razorpay webhook runs the same step, so a closed browser tab still produces a confirmed order and a late duplicate does nothing.
7. Unpaid orders expire after 30 minutes (configurable); a job marks them `Failed` and returns the stock.

Safeguards: prices and totals never come from the client; the same cart submitted twice inside the payment window reuses the pending order; order numbers come from an atomic counter (`BB-2026-000001`).

## Security

- Helmet, strict CORS allow-list, origin check on state-changing requests, SameSite HTTP-only cookies
- bcrypt (cost 12) for passwords; OTPs stored as HMAC, single use, 10 minute expiry, 5 attempts, resend cooldown and hourly cap
- Separate JWT secret, cookie and login for admins; lockout after 5 failed admin logins; token version invalidates sessions on password change or block
- zod validation on every body, Mongo operator sanitisation, HPP, body size limits
- Role permissions checked per route; Super Admin cannot be removed or demoted if it is the last one
- Rich text from the admin is sanitised before storage; CSV exports neutralise formula injection
- Razorpay, SMTP and Cloudinary secrets live only in environment variables

## Frontend

```
frontend/
  app/
    layout.js, globals.css          fonts, design tokens, providers
    (store)/                        header + footer shell
      page.js                       home
      shop, category/[slug], search listing pages (filters live in the URL, rendered on the server)
      products/[slug]               product page
      cart, checkout, checkout/success, track-order, wishlist
      login, register, verify-email, forgot-password, reset-password
      account/                      dashboard, orders, orders/[orderNumber], addresses, wishlist, profile, change-password
      about, contact, faq, blog, blog/[slug], five policy pages (CMS driven)
    admin/                          admin panel (see below)
    not-found.js, error.js, sitemap.js, robots.js, icon.svg
  components/  ui, layout, home, product, cart, checkout, account, admin
  context/     Toast, Auth, Cart, Wishlist
  services/    one module per API area (browser side)
  lib/         api client, server fetch with ISR, SEO + JSON-LD builders, Razorpay loader
  hooks/, utils/, public/
```

Rendering: catalogue, content and SEO pages are server components with ISR (30 to 300 seconds). Cart, checkout, auth and account are client components that call the `/api` proxy with the session cookie.

Cart: logged-in customers use the server cart. Guests keep item ids and quantities in `localStorage`, priced by `POST /api/cart/price`; the guest cart merges into the account on login. The browser never calculates a price.

Checkout: one page with contact, address, shipping and payment. `Pay` creates the order on the server, opens Razorpay Checkout, then sends the result to `/api/payments/verify`. Only a verified response leads to the confirmation page. `?buy=productId:variantId:qty` checks out a single item without touching the cart.

SEO: per-page metadata with canonical URLs, Open Graph and Twitter tags; JSON-LD for Organization, WebSite, BreadcrumbList, Product, Article and FAQPage; `sitemap.xml` and `robots.txt` generated from live data; filtered listing URLs are `noindex`.

Design system: black, lime and white. Big Shoulders Display (condensed, uppercase) for headings and buttons, Hanken Grotesk for text, both self-hosted. The recurring device is the "facts panel", the ruled box from a supplement label, used for the hero promises, nutrition facts, order totals and contact details. Corners are square and lime appears as solid blocks only.

### Admin panel (`/admin`)

```
app/admin/layout.js                 toast + admin session providers (the store's cart and customer session are not loaded here)
app/admin/login/page.js
app/admin/(panel)/layout.js         AdminShell: session guard, sidebar, top bar, notifications
app/admin/(panel)/...               dashboard, products, orders, customers, coupons, reviews, banners,
                                    content, marketing, reports, settings, admin-users
components/admin/
  ResourceManager.js                list + drawer form + delete, driven by a field config
  FormFields.js, form-utils.js      field renderer (text, select, image, rich text, rows ...) and form <-> API mapping
  ProductForm.js                    tabbed product editor with variant builder
  ImageUpload.js, RichText.js, Charts.js, ui.js, AdminShell.js, nav.js
```

Ten of the resource screens (categories, subcategories, brands, attributes, coupons, banners, FAQ, blog, blog categories, pages) are a single `ResourceManager` with a different config, so adding a field or a new simple resource is a few lines. Settings uses the same field renderer per settings group. Charts are plain SVG with no chart library.

Permissions: the sidebar and action buttons read the admin's permission list; every admin API route checks the same keys on the server.
