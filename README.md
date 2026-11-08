# FoodReel — Don't just scroll, Taste.

**FoodReel** is a full-stack social and commerce platform I designed and built end to end. Restaurants share their dishes as short videos and images, Instagram/TikTok-style. Customers discover food on the reel, order in-app, and pay by Razorpay or Cash on Delivery — and there's a promo-code system that works as carefully as anywhere, because coupons are money, not decoration.

**Live:** [foodreel-watch.netlify.app](https://foodreel-watch.netlify.app) — backend at [foodreel-ufxk.onrender.com/health](https://foodreel-ufxk.onrender.com/health) (free-tier Render, cold starts after idle; health returns `{"status":"ok","mongo":"up"}`).

The repository contains a React + Vite frontend (`Client/`) and an Express + Node backend (`server/`), with MongoDB for persistence and ImageKit for media storage.

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-blue)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19.x-blue)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/Mongoose-8.x-green)](https://www.mongodb.com/)
[![Frontend](https://img.shields.io/badge/live-Netlify-green)](https://foodreel-watch.netlify.app)

## Why this repo might be worth your time

This is how I build products for clients and collaborators. If you want to see *what* I build and, more importantly, *how* — the trade-offs, the guarded paths, the parts I'd defend in review — read the **[Anatomy of the tricky parts](#anatomy-of-the-tricky-parts)** section below. Everything there points to real files in this repo.

If you run a restaurant, cloud kitchen, local service, or an idea and want something like this built (MVP in weeks, designed around your workflow) — see **[Work with me](#work-with-me)**.

This README is written for you if you: (a) want to learn how a production-grade ordering platform is put together, or (b) want to hire me / collaborate.

## India Edition

FoodReel targets local restaurants, cloud kitchens, and food partners that want to reach customers through short video and image posts, promoted placements, and in-app ordering. Payments and payouts use India-specific rails such as UPI, wallets, and Razorpay. Orders and platform fees account for GST.

**Advantages:**
- Mobile use is high, and food discovery reaches metro and tier-2/3 cities.
- Onboarding costs stay low because many restaurants already look for cheap digital marketing.
- UPI adoption keeps checkout friction low.
- Local delivery networks already exist, so initial logistics investment stays low.
- Ads and a small order fee balance recurring and transactional revenue.

This README covers the project overview, structure, setup, and API reference.

## Table of Contents
- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Anatomy of the tricky parts](#anatomy-of-the-tricky-parts)
- [Documentation](#documentation)
- [Local Setup](#local-setup)
- [Development Notes](#development-notes)
- [API Documentation](#api-documentation)
- [Storage & File Uploads](#storage--file-uploads)
- [Troubleshooting](#troubleshooting)
- [Work with me](#work-with-me)
- [Next steps / TODO](#next-steps--todo)

---

## Project Overview

- **Frontend:** React (Vite) app located in `Client/`
- **Backend:** Express server located in `server/` using Mongoose for MongoDB models
- **Storage:** ImageKit (via `server/src/services/storage.service.js`) for uploaded images/videos
- **Authentication:** JWT-based cookie authentication (HTTP-only cookies). Middleware protects partner routes
- **Payments:** Razorpay integration for online payments; Cash on Delivery supported; refunds follow the cancellation policy (user auto-refund; partner refunds need admin approval)
- **Features:** Social feed, follow system, reviews & ratings, food ordering (cart checkout and reel quick checkout), advertisements, promo/coupon codes, food fest tickets, organizer and stall dashboards

---

## Features

### For Users
- User authentication with secure JWT
- Browse food content in a reel format
- Like, comment, save, and share posts
- Follow food partners and other users
- Leave detailed reviews with ratings
- Order food in the app (cart checkout with coupons, or reel quick checkout with a direct coupon preview)
- Book tickets for upcoming food fests
- Manage multiple delivery addresses (10-digit Indian mobile required for delivery)
- Pay through Razorpay or Cash on Delivery
- Share your own food experiences
- Profile settings for basic info, password, preferences, and addresses

### For Food Partners
- Partner dashboard to manage the business
- Create food posts and advertisements
- Create and manage promo/coupon codes (5–32 chars, scoping, minimum order value, minimum quantity, usage limits)
- Track engagement, orders, and revenue
- Respond to customer reviews
- Build and analyze a follower base
- Accept and track orders, including cancel-request workflows
- Apply for food fest stalls; manage stall applications
- Promote special offers (advertisements sync their promo codes into the coupon system)

### For Admins
- Secure admin authentication
- Platform analytics and oversight
- User and partner management
- Content moderation
- Revenue and payment tracking
- Review partner cancellation requests and manage refunds
- Food fest admin operations

---

## Tech Stack

### Backend
- **Runtime:** Node.js >= 20
- **Framework:** Express v5.1.0
- **Database:** MongoDB with Mongoose v8.x
- **Authentication:** JWT with HTTP-only cookies
- **File Upload:** Multer + ImageKit
- **Payment:** Razorpay (with webhook verification)
- **Realtime:** Socket.IO rooms per food fest event
- **Security:** bcrypt, CORS, cookie-parser, helmet, mongo-sanitize, xss, rate limiting, validated env at boot

### Frontend
- **Framework:** React 19.x with Vite
- **Routing:** React Router
- **HTTP Client:** Axios
- **UI:** Tailwind CSS, responsive design
- **State/realtime:** Socket.IO client, SWR
- **Notifications:** lucide-react icons, react-toastify / react-hot-toast
- **Utilities:** jsPDF (receipts), html5-qrcode (gate check-ins), Recharts

---

## Repository Structure

Folder and file tree (abbreviated; `docs/` and local-only files omitted):

```
FoodReel/
│
├── README.md                     # Project overview, setup, and API docs
├── nextmove.md                   # Status: done, blocked, next (local working doc; no secrets)
│
├── docs/                         # Versioned docs (see Documentation below)
│   └── architecture/
│
├── Client/                       # React frontend application
│   ├── package.json              # Frontend dependencies (React, Vite, Axios, Tailwind)
│   ├── vite.config.js            # Vite bundler configuration
│   ├── eslint.config.js          # ESLint rules for code quality
│   ├── index.html                # HTML entry point
│   ├── netlify.toml              # Netlify build/publish config + SPA rewrite
│   ├── README.md                 # Client-specific setup notes
│   └── src/                      # React source code
│       ├── main.jsx              # React app entry point
│       ├── App.jsx               # Root component with router outlet
│       ├── config/Api.jsx        # Centralized API endpoint configuration
│       ├── routes/AppRoutes.jsx  # Route configuration (auth-type protected)
│       ├── pages/                # Home, Reel, Checkout, CartPage, Order*,
│       │   │                     # FoodPartner/, User/, Admin/, FoodFest pages
│       │   └── ...
│       ├── Components/           # Navbar, QuickOrderModal, FoodDetailModal,
│       │                         # ReelOrderButton, foodfest modals, ...
│       ├── Contexts/AuthContext.jsx  # Auth state (user, partner, admin)
│       ├── hooks/                # useAuth, useCart
│       └── utils/                # toast, clipboard, idempotencyKey, ...
│
├── server/                       # Express backend
│   ├── server.js                 # Entry: env validation, Socket.IO init, ticket sweeper, graceful shutdown
│   ├── package.json
│   ├── API.md                    # API reference (local doc; see Troubleshooting)
│   └── src/
│       ├── app.js                # Express app: CORS, security headers, routes
│       ├── db/db.js              # MongoDB connection
│       ├── routes/               # Route files (order, cart, coupon, food, payment, ...)
│       │   └── foodfest/         # Food-fest route modules
│       ├── controllers/          # Business logic per domain
│       ├── services/             # coupon.service, idempotency.js, refund policy, socket service, ...
│       ├── models/               # Mongoose models (order, coupon, cart, foodfest*, ...)
│       ├── middlewares/          # isLoggedin, rate limiters, sanitization, uploads
│       └── utils/                # validate, apiError, secureCompare, ...
│   └── test/                     # Node built-in test runner suites
│
└── .github/workflows/            # CI pipeline + keep-Render-warm ping
```

### Key file purposes

**Frontend (Client)**
- `AppRoutes.jsx`: Defines all routes (/, /cart, /checkout, /order/tracking/:orderId, /partner-dashboard, /admin/dashboard, ...)
- `CreateFood.jsx`: Multi-step form for uploading food images/videos with tags and description
- `PromoCodeManager.jsx`: Partner-facing promo/coupon creation (scoping, min order value, presets)
- `QuickOrderModal.jsx`: Reel quick checkout with coupon preview (`/api/orders/validate-coupon`)
- `FoodDetailModal.jsx`: Full-screen modal for viewing food posts with like/comment/save actions
- `ProfileSettings.jsx`: Basic info, password, preferences, delivery/billing addresses (10-digit Indian mobile)

**Backend (Server)**
- `server.js`: Validates required env vars, starts Socket.IO, sweeper, graceful shutdown
- `app.js`: Configures Express (helmet, CORS allowlist, cookie parser, mongo-sanitize, xss), mounts routes
- `db.js`: Connects to MongoDB using Mongoose
- `auth.controller.js`: Handles partner/user registration, login (sets JWT cookie), session verification
- `coupon.service.js`: Shared coupon rules (code validation, discount math, redemption, release, ad-sync)
- `order.controller.js`: Creates orders (cart or direct), validates coupons on quick order, manages refunds on cancellation
- `storage.service.js`: Uploads files to ImageKit CDN and returns public URLs
- `isLoggedin.js` / `isFoodPartnerLoggedin.js`: JWT middleware to protect routes

**Models**
- `user.Model.js`: Customer accounts
- `foodPartner.Model.js`: Restaurant/partner accounts with business details
- `food.model.js`: Food posts and advertisements (postType: `food` | `advertisement`)
- `order.model.js`: Orders with status timestamps, coupon snapshot, refund tracking
- `coupon.model.js`: Dedicated promo codes (min 5 chars, scoping via `applicableItemIds`, `minQuantity`, `minOrderAmount`)
- `cart.model.js`: Server-side cart with applied coupon
- `review.model.js`: Partner reviews with ratings and timestamps

---

## Anatomy of the tricky parts

These are the pieces I'd defend in a cold review. Each is in this repo — read them with the tests.

1. **Coupons are money.** One restaurant per code; 5–32 char codes (`coupon.model.js`, `coupon.service.js`). Discount, minimum order value and minimum quantity all count only *eligible* items (`applicableItemIds`), so a ₹200 ineligible item can't carry a scoped ₹50-off code past a ₹150 minimum. COD orders consume the coupon at order creation; Razorpay consumes on payment verification/webhook. Orders store an immutable snapshot (`order.model.js → coupon`), never live coupon data; a cancelled order releases its redemption back to the pool; a stale preview hard-fails with `COUPON_INVALID`. The redemption path is atomic and idempotent — the verify call and the webhook can both fire, and the counter moves exactly once.
2. **Quick checkout without a cart.** Reels let users tap Order Now → pay. There is no cart in that path, so the coupon needs a preview endpoint — `POST /api/orders/validate-coupon` (`order.route.js`, `order.controller.js`) — and the client re-checks the discount on every quantity change (`QuickOrderModal.jsx`). The server re-prices at order creation regardless of what the preview said, and can legitimately reject at the last step. That's the honest boundary of a client-side preview.
3. **Single-vendor rule.** All items in one order must belong to one restaurant — mixed carts and mixed-kabab orders are impossible by construction (`order.controller.js`).
4. **Idempotency everywhere money moves.** `POST /api/cart/checkout` and payment creation run under server-side idempotency keys (`services/idempotency.js`); Razorpay webhooks are deduplicated via stored events (`paymentWebhookEvent.model.js`) so a retried ping can't double-count.
5. **Cancellation ≠ one rule.** A user's own cancellation auto-refunds; a *partner* cancellation requires admin approval (`services/refund.policy.js`, `cancelRequest.policy.js`) — because automatic refunds for partner-driven cancels are a fraud channel.
6. **Untrusted input by default.** `helmet`, an origin allowlist, mongo-sanitize on body/params, xss on input (passwords exempted), a coupon-attempt rate limiter, and order-availability checks — all regression-tested in `server/test/` (472 tests passing).
7. **Indian phone numbers, one truth.** Delivery addresses require a 10-digit Indian mobile (`^[6-9]\d{9}$`); `+91` / leading `0` on input are normalized to 10 digits before storage (`user.controller.js`). Saved cards re-validate.
8. **Realtime without fragility.** Socket.IO rooms keyed `event:<eventId>` serve food fest events; a boot-time ticket sweeper expires abandoned tickets without waiting for a cron (`foodfest.socket.service.js`, `foodfest.sweeper.js`).
9. **Startup that fails loud.** Missing required env → the process exits before listening; `/health` reports Mongo state; SIGTERM triggers a bounded graceful shutdown.
10. **Two quality bars.** The server verifies with `npm test` (Node's built-in runner, no framework) in CI on every push; the client ships with lint and build in the same workflow.

## Documentation

FoodReel keeps its documentation under `docs/`.

### Versioned docs

Only these five documents are committed. The rest of `docs/` stays local; `.gitignore` excludes `*.md` apart from the files below.

| I want to... | Go to |
|--------------|-------|
| Set the project up and run it | [README.md](#local-setup) (this file) |
| See what's done, blocked, and next | [nextmove.md](nextmove.md) |
| Set up the React frontend | [Client/README.md](Client/README.md) |
| Understand business logic and monetization | [docs/architecture/BUSINESS_MODEL.md](docs/architecture/BUSINESS_MODEL.md) |
| Understand the content-type system (food vs advertisement) | [docs/architecture/FOOD_VS_ADVERTISEMENT_SYSTEM.md](docs/architecture/FOOD_VS_ADVERTISEMENT_SYSTEM.md) |
| Understand the API surface | `server/src/routes/` (routes are the source of truth) |

```text
FoodReel/
├── README.md
├── nextmove.md
├── Client/
│   ├── README.md
│   └── src/          # React app (components, pages, contexts, hooks, config, utils)
├── server/
│   └── src/          # Express app (routes, controllers, services, models, middlewares, utils)
└── docs/
    └── architecture/
        ├── BUSINESS_MODEL.md
        └── FOOD_VS_ADVERTISEMENT_SYSTEM.md
```

> The `docs/` tree also holds audits, checklists, and updates locally. Git ignores them; see `.gitignore`.

---

## Local setup

You need Node.js 20 or newer, npm or yarn, and a MongoDB instance (local or Atlas).

### 1) Prerequisites

- Node.js 20 or newer and npm (or yarn). Express 5 and bcrypt 6 require it.
- MongoDB connection string
- ImageKit account (optional; the project uses it by default)

### 2) Environment variables

Create `server/.env` or set the variables in your environment. The names must match the code. The server validates the required ones at startup and exits when one is missing:

```
# Required at startup (server.js)
PORT=3000
MONGODB_URL=mongodb://localhost:27017/foodreel
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:5173
EMAIL_SERVICE=smtp.example.com
EMAIL_USER=you@example.com
EMAIL_PASS=your_email_password
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
IMAGEKIT_PUBLIC_KEY=your_imagekit_public
IMAGEKIT_PRIVATE_KEY=your_imagekit_private
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

# Strongly recommended (warnings at startup if missing)
NODE_ENV=development
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

See `server/.env.example` for the full list with placeholders.

> **Naming note:** older docs used `MONGO_URI`/`MONGODB_URI`/`CLIENT_URL`/`CORS_ORIGIN`/`SENDGRID_API_KEY`. The code reads only `MONGODB_URL` and `FRONTEND_URL`. Setting the old names causes a boot loop.

**Deployment:**
- **Backend (Render):** `render.yaml` at the repo root defines the service (`rootDir: server`, `/health` check). Render prompts for secrets and never commits them.
- **Frontend (Netlify):** set the **base directory = `Client`** in the dashboard. `Client/netlify.toml` sets the build command, publish directory, cache headers, and the SPA rewrite. `Client/.env.production` carries `VITE_API_BASE_URL` (read at build time). Set `FRONTEND_URL` on Render to your Netlify origin so the CORS allowlist matches.
- **Keeping Render awake:** Render's free tier idles the service after ~15 minutes, so the first request after idle pays a cold start (33s measured, vs 0.7s warm). `.github/workflows/keep-render-warm.yml` pings `/health` weekly (cron `0 0 */7 * *`, or trigger it manually from the Actions tab). Set the repo secret `RENDER_HEALTH_URL` to override the production URL. GitHub disables scheduled workflows in public repos after 60 days of inactivity.

### Automation

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `.github/workflows/ci.yml` | push / PR to `main` | Server import + app-load check, `npm test`, client lint + build, dependency audit |
| `.github/workflows/keep-render-warm.yml` | weekly / manual | Pings Render `/health` to cap cold-start frequency |

Server tests run with `cd server && npm test` (Node's built-in runner; no test framework installed). `npm run sweep` prints a read-only data consistency report.

New maintainers should start with the local handover note (`docs/architecture/TECHNICAL_HANDOVER.md`). It covers what works, what is verified, and what the project inherited. It stays local and is not committed by default.

### 3) Install and run

Backend (server):

```powershell
cd server
npm install
npm start
# or for dev with nodemon
npm run dev
```

Frontend (Client):

```powershell
cd Client
npm install
npm run dev
# Opens Vite dev server (usually http://localhost:5173)
```

Notes:
- Backend CORS is preconfigured to allow `http://localhost:5173` in `server/src/app.js`.
- Backend listens on `http://localhost:3000` by default (changeable via `PORT`).

## Development notes

- File uploads are handled with `multer` in memory and uploaded to ImageKit via `server/src/services/storage.service.js`.
- Uploaded media URLs from ImageKit are returned and stored in `food.image` or `food.video` in MongoDB.
- Partner profile endpoint returns formatted food items (includes `image`, `video`, `likeCount`, `commentCount`, `tags`).
- Frontend uses `axios` with `withCredentials: true` for cookie-based auth.
- Coupon codes must be 5–32 characters, uppercase `[A-Z0-9_-]`. One restaurant per code. The minimum order value and minimum quantity apply only to eligible items (`applicableItemIds`; empty means the whole cart).
- Promo codes on advertisements sync into the coupon system; a code conflict is a clean 409.
- Single-vendor rule: all items in an order must belong to the same restaurant.
- Delivery address phone numbers are stored normalized to exactly 10 digits; `+91` and a leading `0` are accepted on input.

### Quick debugging tips

- If images/videos don't appear, check backend console logs (controller prints formatted items) and browser console network tab for returned URLs.
- Ensure ImageKit env vars are correctly provided. The storage service returns direct `response.url`.

## API Documentation

The route files under `server/src/routes/` are the source of truth for the API. Each route file maps paths to controllers, and the auth middleware on each route shows who may call it.

### Quick API Reference

**Base URL:** `http://localhost:3000/api`

#### Authentication Endpoints
- `POST /api/auth/user/register` - Register new user
- `POST /api/auth/user/login` - User login (sets JWT cookie)
- `POST /api/auth/user/logout` - User logout
- `GET /api/auth/user/profile` - Get user profile
- `PUT /api/auth/user/profile` - Update user profile
- `PUT /api/auth/user/change-password` - Change password
- `POST /api/auth/partner/register` - Register food partner
- `POST /api/auth/partner/login` - Partner login (sets JWT cookie)
- `GET /api/auth/verify` - Verify user session
- `GET /api/auth/partner/check` - Verify partner session
- `POST /api/auth/admin/login` - Admin login (sets JWT cookie)
- `GET /api/auth/admin/verify` - Verify admin session
- `GET /api/auth/admin/profile` - Get admin profile
- `POST /api/auth/admin/logout` - Admin logout

#### Food & Posts
- `POST /api/food` - Create food post (multipart/form-data, partner only)
- `GET /api/food` - Get all food posts (with pagination)
- `GET /api/food/trending` - Get trending posts
- `GET /api/food/my-posts` - Get partner's own posts (partner only)
- `POST /api/food/:id/like` - Toggle like on post (user only)
- `POST /api/food/:id/save` - Toggle save/bookmark (user only)

#### User Posts
- `POST /api/posts/user` - Create user post (multipart/form-data, user only)
- `GET /api/posts/user` - Get all user posts
- `GET /api/posts/user/my-posts` - Get logged-in user's posts
- `POST /api/posts/user/:id/like` - Toggle like on user post
- `POST /api/posts/user/:id/comment` - Add comment to user post

#### Follow System
- `POST /api/follow/follow` - Follow a user or food partner
- `POST /api/follow/unfollow` - Unfollow
- `GET /api/follow/followers/:userId/:userType` - Get followers list
- `GET /api/follow/following/:userId/:userType` - Get following list
- `GET /api/follow/check/:targetId/:targetType` - Check if following
- `GET /api/follow/suggestions` - Get suggested follows

#### Review System
- `POST /api/reviews/create` - Create review (user only)
- `GET /api/reviews/partner/:partnerId` - Get partner reviews
- `GET /api/reviews/food/:foodId` - Get food item reviews
- `GET /api/reviews/user/:userId` - Get user's reviews
- `PUT /api/reviews/:reviewId` - Update review
- `DELETE /api/reviews/:reviewId` - Delete review
- `POST /api/reviews/:reviewId/helpful` - Mark review as helpful
- `POST /api/reviews/:reviewId/reply` - Add reply to review
- `POST /api/reviews/:reviewId/respond` - Food partner response (partner only)

#### Cart & Coupons
- `GET /api/cart` - Get cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update/:itemId` - Update cart item quantity
- `DELETE /api/cart/remove/:itemId` - Remove item from cart
- `DELETE /api/cart/clear` - Clear the cart
- `GET /api/cart/validate` - Validate cart for checkout
- `POST /api/cart/apply-coupon` - Validate and apply a promo code (rate-limited)
- `DELETE /api/cart/coupon` - Remove the applied promo code
- `POST /api/cart/checkout` - Convert cart to order (idempotent)
- `POST /api/coupons` - Create coupon (partner only, 5–32 chars)
- `GET /api/coupons/partner` - Partner's coupons
- `GET /api/coupons/partner/stats` - Coupon usage stats (partner)
- `PUT /api/coupons/:couponId` / `DELETE /api/coupons/:couponId` - Update / delete coupon (partner owns it)

#### Orders
- `POST /api/orders` - Create new order (user only)
- `POST /api/orders/validate-coupon` - Preview a promo code for the reel quick checkout (user only)
- `GET /api/orders` - Get user's orders
- `GET /api/orders/partner` - Get partner's orders (partner only)
- `PUT /api/orders/partner/:orderId/status` - Update order status (partner only)
- `POST /api/orders/partner/:orderId/cancel` - Partner cancel order (refund needs admin approval)
- `POST /api/orders/partner/:orderId/cancel-request` - Request cancellation (partner)
- `POST /api/orders/:orderId/cancel` - Cancel order (user, auto-refund)
- `GET /api/orders/partner/statistics` - Get order statistics (partner only)
- `GET /api/orders/:id` - Get single order by ID (user only)

#### Payments
- `POST /api/payment/create-order` - Create Razorpay order (user only)
- `POST /api/payment/verify` - Verify payment (user only)
- `POST /api/payment/failure` - Handle payment failure
- `POST /api/payment/webhook` - Razorpay webhook (raw body, `paymentWebhookEvent` deduplication)
- Refunds have no public endpoint: customer cancellations auto-refund; partner cancellations require admin approval.

#### User Profile & Preferences
- `POST /api/user/profile-picture` - Upload profile picture (user only)
- `PUT /api/user/preferences` - Update food preferences (user only)
- `PUT /api/user/address` - Profile address (single object)
- `GET /api/user/address` - Get all delivery addresses (user only)
- `POST /api/user/address` - Add new delivery address (10-digit Indian mobile required)
- `PUT /api/user/address/:addressId` - Update delivery address
- `DELETE /api/user/address/:addressId` - Delete delivery address
- `PATCH /api/user/address/:addressId/default` - Set default delivery address

#### Advertisements
- `POST /api/advertisement` - Create advertisement (partner only; promo code syncs to Coupon)
- `GET /api/advertisement` - Get all advertisements
- `GET /api/advertisement/:id` - Get advertisement by ID
- `PUT /api/advertisement/:id` - Update advertisement (partner only)
- `DELETE /api/advertisement/:id` - Delete advertisement (partner only)

#### Food Fest
- `GET /api/foodfest/user/tickets` / `GET /api/foodfest/user/events` - Tickets and events
- `POST /api/foodfest/organizer/event` - Create/manage events (organizer)
- `GET /api/foodfest/gate/...` - Gate scanning and check-in (QR)
- `GET /api/foodfest/partner/stall-applications` - Stall applications (partner)
- See `server/src/routes/foodfest/` for the full surface.

For request and response shapes, read the controller behind each route in `server/src/controllers/`.

---

## Storage and file uploads

- Multer uses memory storage. `storage.service.js` uploads files to ImageKit and returns a public URL.
- Send the file as `file` in FormData. The backend validates the MIME type against the `type` field.
- Size limits are enforced via `MAX_IMAGE_SIZE`, `MAX_VIDEO_SIZE` (and profile image limit) in the env.

## Troubleshooting

- CORS and cookies: make the frontend origin match backend CORS and set `withCredentials: true` in `axios`.
- Missing media: check the ImageKit env keys and the upload response in the server console.
- 400 from upload: name the file field `file`, not `image` or `video`.
- Boot loop about env vars: check for old variable names (`MONGODB_URI`, `CLIENT_URL`, ...). The code reads only `MONGODB_URL`, `JWT_SECRET`, `FRONTEND_URL`, etc.
- "A valid 10-digit mobile number is required for delivery": strip `+91`/leading `0`; the stored value must match `^[6-9]\d{9}$`.
- Coupon rejected on quick checkout: codes below 5 characters are refused both client-side and server-side.

## Work with me

I build and ship full-stack web applications — not presentations about them. This repo is the receipt: a live product (user + partner + admin surfaces, payments, coupons, food festivals, realtime) running at [foodreel-watch.netlify.app](https://foodreel-watch.netlify.app), with tests and CI around the risky parts.

**What I take on:**

- MVPs and first versions for local businesses — restaurants, cloud kitchens, services, retail — built around how you actually work, not around a template
- Marketplace and ordering platforms (reel/content discovery → cart → payment → fulfilment), with coupon and promotion logic that holds up under real redemption
- Full-stack hardening of existing projects — payments, auth, data integrity, deploys, cost control
- Ongoing collaboration on your codebase or hand-off with documentation

**How to reach me:** use the contact form on the [live site](https://foodreel-watch.netlify.app/contact-us). Tell me what you're building, who it's for, and when you'd like to launch; I'll reply by email with what I can do, what I'd need first, and a realistic timeline. If you'd like to evaluate me before that, the fastest route is the [Anatomy of the tricky parts](#anatomy-of-the-tricky-parts) section above — then pick any file in `server/src/services/` and read it.

**For future collaborators / contributors:** the [Working notes](nextmove.md) file shows how I track work — done, blocked, next, with one-line verification notes. Open an issue before large changes; for small fixes, a PR with a clear description is fine.

## Next steps / TODO

### High priority

- [ ] Commit the current polish/coupon/quick-checkout batch (see local working notes)
- [ ] Wire topbar search icon to a server-backed `/search` page (plan approved; not started)
- [ ] Stall display system — decide upvote eligibility, review gating, and live-rating scope, then build
- [ ] `useEventSocket` realtime layer on existing `event:<eventId>` Socket.IO rooms
- [ ] Razorpay sandbox round-trip (needs test-mode credentials)
- [ ] Migration plan: production Atlas traffic; whether orders/payments move or launch fresh

### Medium priority (enhancements)

- Add pagination and infinite scroll to more feeds (reel feed already uses it)
- Order confirmation receipt download (jsPDF) and delivery timeline
- Add WhatsApp/SMS updates for delivery status
- Admin dashboard visual verification (needs admin credentials)

### Low priority (future features)

- Search service with cuisine/location/rating filters (server-side)
- Recommendation engine
- PWA / offline receipts

### Current status

- **Completed:** coupon system end-to-end (cart + reel quick checkout), address-phone validation, partner min-order-value and scoped coupons, reel order flow, FoodFest tickets/stall applications, admin/partner dashboard theme, full test suite, CI pipeline
- **Completed:** COD and Razorpay consumption of coupons, immutable order snapshots, redemption release on cancellation
- **In progress:** reel quick checkout polish, search page, stall display system
- **Blocked:** Razorpay live round-trip (credentials), production migration, admin visual check

---

## Documentation notes

**Version control policy**
- `.gitignore` ignores `*.md`, with exceptions for `README.md`, `Client/README.md`, `nextmove.md`, `docs/architecture/BUSINESS_MODEL.md`, and `docs/architecture/FOOD_VS_ADVERTISEMENT_SYSTEM.md`.
- Only those five files are committed. The wider `docs/` tree (audits, checklists, updates) stays local, so this README does not link to it.
- To version the audits and roadmap, remove the `*.md` rule (or add a `!docs/**/*.md` negation) in `.gitignore` and commit them.

---
