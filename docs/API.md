# Beyond Brawn REST API

Base URL: `/api`. JSON in, JSON out.

```json
{ "success": true, "message": "Products fetched successfully", "data": {}, "meta": { "page": 1, "limit": 12, "total": 40, "pages": 4 } }
{ "success": false, "message": "Incorrect email or password", "error": { "code": "INVALID_CREDENTIALS", "details": [] } }
```

Auth: HTTP-only cookies. `bb_token` for customers, `bb_admin` for admins (separate secret, separate login). A `Bearer` header is accepted as a fallback. Send requests with `credentials: 'include'`.

Access column: **P** public, **C** customer, **G** guest or customer, **A** admin (permission in brackets).

## Auth `/auth`

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| POST | `/register` | P | `name, email, phone, password`. Sends a 6-digit OTP |
| POST | `/verify-email` | P | `email, otp`. Logs the customer in |
| POST | `/resend-otp` | P | `email, purpose` (`verify_email` or `reset_password`). 60 s cooldown, 5 per hour |
| POST | `/login` | P | `403 EMAIL_NOT_VERIFIED` re-sends the OTP |
| POST | `/logout` | P | |
| POST | `/forgot-password` | P | Always answers 200 |
| POST | `/reset-password` | P | `email, otp, password`. Signs out all sessions |
| GET | `/me` | P | `{ user }` or `{ user: null }` |
| POST | `/change-password` | C | `currentPassword, newPassword` |

## Account `/users` (C)

`PATCH /me`, `GET /dashboard`, `GET|POST /addresses`, `PUT|DELETE /addresses/:id`, `GET /notifications`, `POST /notifications/read`

## Catalogue

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/home` | Everything the homepage needs in one call |
| GET | `/products` | Query: `q, category, subcategory, brand, minPrice, maxPrice, rating, inStock, type, dietary, goal, tag, featured, bestSeller, newArrival, offers, sort, page, limit, facets`. Sort: `featured, newest, price-asc, price-desc, best-selling, rating` |
| GET | `/products/by-ids?ids=a,b` | Recently viewed |
| GET | `/products/:slug` | Product, variants, related, similar, frequently bought together |
| GET | `/products/:slug/reviews` | Approved reviews. `sort=highest|lowest` |
| GET | `/categories`, `/categories/:slug` | Tree with subcategories (mega menu) |
| GET | `/brands` | |
| GET | `/search/suggest?q=` | Products, categories, brands |
| GET | `/search/popular` | Popular search terms |
| GET | `/sitemap` | Slugs for sitemap.xml |

## Cart `/cart`

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| POST | `/price` | G | Prices any item list `{ items:[{productId, variantId, quantity}], couponCode, shippingMethod }`. Guest carts and Buy Now use this |
| GET | `/` | C | Priced cart: lines, pricing, coupon, shipping methods, `amountToFreeShipping` |
| POST | `/items` | C | `productId, variantId?, quantity` |
| PATCH | `/items/:itemId` | C | `quantity` |
| DELETE | `/items/:itemId` | C | |
| POST | `/items/:itemId/wishlist` | C | Save for later |
| POST | `/merge` | C | Merge the browser cart after login |
| DELETE | `/` | C | Clear |
| POST | `/coupons/apply` (under `/api/coupons`) | C | `code` |
| DELETE | `/coupons` (under `/api/coupons`) | C | |

## Wishlist `/wishlist` (C)

`GET /`, `POST /toggle { productId }`, `DELETE /:productId`

## Orders `/orders`

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| POST | `/checkout` | G | `addressId` or `address`, `shippingMethod`, `couponCode?`, `notes?`. Guests add `items` and `guest { name, email, phone }`. `buyNow` checks out one item without touching the cart. Returns `{ orderNumber, pricing, razorpay: { keyId, orderId, amount, currency, prefill } }` |
| POST | `/track` | P | `orderNumber, email` for guest orders |
| GET | `/` | C | |
| GET | `/:orderNumber` | C | |
| GET | `/:orderNumber/invoice` | C | PDF |
| POST | `/:orderNumber/cancel` | C | Allowed while Confirmed or Processing. Refund starts automatically |

## Payments `/payments`

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/verify` | `razorpay_order_id, razorpay_payment_id, razorpay_signature`. Server checks the HMAC, then fetches the payment from Razorpay and matches order id and amount |
| POST | `/failed` | Records a dismissed or failed attempt. Never changes order state |
| POST | `/webhook` | Razorpay only. Verified with `RAZORPAY_WEBHOOK_SECRET` |

## Reviews `/reviews` (C)

`GET /mine`, `GET /eligibility/:productId`, `POST /` (`productId, rating, title?, comment, images?`; only after delivery), `POST /upload` (multipart `file`)

## Content and settings (P)

`GET /settings`, `GET /banners?placement=`, `GET /blogs`, `GET /blogs/:slug`, `GET /faqs`, `GET /pages/:slug`, `POST /newsletter/subscribe`, `POST /contact`, `GET /shipping/methods?amount=`, `GET /shipping/check?pincode=`

## Admin `/admin`

| Area | Endpoints | Permission |
| --- | --- | --- |
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password` | |
| Dashboard | `GET /dashboard` | `dashboard.view` |
| Notifications | `GET /notifications`, `POST /notifications/read` | any admin |
| Uploads | `POST /uploads?folder=products` (multipart `files`), `DELETE /uploads { publicId }` | any content permission |
| Products | `GET /products` (`q, category, brand, status, stock, sort, format=csv`), `POST /products`, `GET|PUT|DELETE /products/:id`, `POST /products/bulk { ids, action }` | `products.view` / `products.manage` |
| Inventory | `GET /inventory` (`filter=out|low|ok|restock`, `format=csv`), `GET /inventory/history`, `POST /inventory/adjust { productId, variantId?, mode: add|remove|set, quantity, note }` | `inventory.*` |
| Orders | `GET /orders` (`status, paymentStatus, refunds, q, from, to, format=csv`), `GET /orders/:id`, `PATCH /orders/:id/status { status, note, tracking, notifyCustomer }`, `POST /orders/bulk-status`, `GET /orders/:id/invoice` | `orders.*` |
| Refunds | `POST /orders/:id/refund { amount?, note }`, `POST /orders/:id/refund/complete` | `refunds.manage` |
| Customers | `GET /customers` (`format=csv`), `GET /customers/:id`, `PATCH /customers/:id/active` | `customers.*` |
| Reviews | `GET /reviews`, `PATCH /reviews/:id/status`, `POST /reviews/bulk`, `DELETE /reviews/:id` | `reviews.manage` |
| CRUD resources | `GET|POST /{resource}`, `GET|PUT|DELETE /{resource}/:id` for `categories, subcategories, brands, attributes` (`catalog.manage`), `coupons` (`coupons.manage`), `banners` (`banners.manage`), `faqs, blogs, blog-categories, pages` (`content.manage`) | |
| Coupon stats | `GET /coupon-stats`, `GET /coupon-stats/:id/usage` | `coupons.manage` |
| Marketing | `GET /newsletter` (`format=csv`), `DELETE /newsletter/:id`, `GET /email-templates`, `GET /email-templates/:key/preview`, `POST /email-templates/:key/test` | `marketing.manage` |
| Messages | `GET /messages`, `PATCH|DELETE /messages/:id` | `messages.manage` |
| Settings | `GET /settings`, `PUT /settings/:group` (`general, contact, social, shipping, tax, payment, seo, homepage, footer, emailTemplates`), `POST /settings/smtp-test` | `settings.manage` |
| Reports | `GET /reports/sales|orders|products|customers` (`from, to` as `YYYY-MM-DD`, `format=csv`) | `reports.view` |
| Admin users | `GET|POST /admins`, `PUT|DELETE /admins/:id`, `GET|POST /roles`, `PUT|DELETE /roles/:id`, `GET /permissions` | `admins.manage` |

## Order statuses

`Pending` (awaiting payment) → `Confirmed` → `Processing` → `Packed` → `Shipped` → `Out for Delivery` → `Delivered`

`Cancelled` is possible until the order ships. `Failed` and `Refunded` are set by the payment flow.

Payment statuses: `pending`, `paid`, `failed`, `refund_initiated`, `refunded`.

## Common error codes

`VALIDATION_ERROR` 422, `UNAUTHENTICATED` 401, `EMAIL_NOT_VERIFIED` 403, `FORBIDDEN` 403, `NOT_FOUND` 404, `DUPLICATE` 409, `RATE_LIMITED` 429, `OTP_INVALID` / `OTP_EXPIRED` 400, `OTP_COOLDOWN` / `OTP_LIMIT` / `OTP_LOCKED` 429, `CART_ISSUES` 409, `INSUFFICIENT_STOCK` 409, `COUPON_INVALID` 400, `PINCODE_NOT_SERVICEABLE` 400, `SIGNATURE_MISMATCH` 400, `PAYMENT_MISMATCH` 400, `INVALID_TRANSITION` 400
