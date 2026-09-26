# 🍔 FoodReel - Social Food Ordering Platform

**FoodReel** is a modern full-stack social + commerce platform for restaurants and food partners to share short videos and images of dishes (similar to Instagram/Reels). This repository contains a React + Vite frontend and an Express + Node backend with MongoDB for persistence and ImageKit for media storage.

[![Node.js](https://img.shields.io/badge/Node.js-23.6.1-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-blue)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.18.1-green)](https://www.mongodb.com/)

## India Edition — Short Summary

This project is intended to operate in India: targeting local restaurants, cloud kitchens, and food partners who want to reach food-loving customers (`real foody`) using short video/image posts, promoted placements (ads), and an in‑app commerce flow for ordering. Payments and payouts support India-specific rails (UPI, wallets, and Razorpay), and taxation (GST) considerations for orders and platform fees.

**Key Advantages:**
- 📱 Strong product-market fit: high mobile usage and appetite for food discovery across metro and tier-2/3 cities
- 💰 Low incremental cost to onboard restaurants — many actively seek low-cost digital marketing channels
- 💳 Payment rails: UPI adoption makes low-friction payments possible and reduces checkout friction
- 🚚 Local delivery networks already exist (and can be partnered with) reducing initial logistics investment
- 📊 Monetization mix: ads + small platform fee on orders balance recurring and transactional revenue streams

This README provides a high‑level overview, project structure, setup & run instructions, and a comprehensive API reference.

## Table of Contents
- [Project Overview](#project-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#repository-structure)
- [Documentation](#-documentation)
- [Local Setup](#local-setup)
- [Development Notes](#development-notes)
- [API Documentation](#-api-documentation)
- [Storage & File Uploads](#storage--file-uploads)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#-roadmap)

---

## Project Overview

- **Frontend:** React (Vite) app located in `Client/`
- **Backend:** Express server located in `server/` using Mongoose for MongoDB models
- **Storage:** ImageKit (via `server/src/services/storage.service.js`) for uploaded images/videos
- **Authentication:** JWT-based cookie authentication (HTTP-only cookies). Middleware protects partner routes
- **Payments:** Razorpay integration for secure online payments
- **Features:** Social feed, follow system, reviews & ratings, food ordering, advertisements

---

## ✨ Features

### For Users
- 👤 User authentication with secure JWT
- 🎥 Browse food content in engaging reel format
- ❤️ Like, comment, save, and share posts
- 👥 Follow food partners and other users
- ⭐ Leave detailed reviews with ratings
- 🛒 Seamless food ordering experience
- 🎟️ Book tickets for upcoming food fests
- 📍 Manage multiple delivery addresses
- 💳 Secure payments via Razorpay
- 📱 Share your own food experiences
- 🔍 Search & filter by cuisine, location, ratings
- ⚙️ Comprehensive profile settings (basic info, password, preferences, addresses)

### For Food Partners
- 🏪 Partner dashboard to manage business
- 📸 Create food posts and advertisements
- 📊 Track engagement, orders, and revenue
- 💬 Respond to customer reviews
- 👥 Build and analyze follower base
- 📦 Accept and track orders
- 🎯 Promote special offers

### For Admins
- 👨‍💼 Secure admin authentication system
- 📊 Platform analytics and oversight
- 👥 User and partner management
- 📋 Content moderation capabilities
- 💰 Revenue and payment tracking
- 🔍 Advanced platform analytics

---

## 🛠 Tech Stack

### Backend
- **Runtime:** Node.js v23.6.1
- **Framework:** Express v5.1.0
- **Database:** MongoDB with Mongoose v8.18.1
- **Authentication:** JWT with HTTP-only cookies
- **File Upload:** Multer + ImageKit
- **Payment:** Razorpay
- **Security:** bcrypt, CORS, cookie-parser

### Frontend
- **Framework:** React 18.x with Vite
- **Routing:** React Router
- **HTTP Client:** Axios
- **UI:** Modern responsive design

---

## Repository Structure

Complete folder and file tree with explanations:

```
FoodReel/
│
├── README.md                     # Project overview, setup, and API docs

├── docs/                         # 📁 Versioned docs (only BUSINESS_MODEL.md and
│                                 #    FOOD_VS_ADVERTISEMENT_SYSTEM.md are committed)
│
├── Client/                       # React frontend application
│   ├── package.json              # Frontend dependencies (React, Vite, Axios, Lucide icons)
│   ├── package-lock.json         # Locked dependency versions
│   ├── vite.config.js            # Vite bundler configuration
│   ├── eslint.config.js          # ESLint rules for code quality
│   ├── index.html                # HTML entry point
│   ├── .gitignore                # Git ignore rules for node_modules, build artifacts
│   ├── README.md                 # Client-specific setup notes
│   │
│   ├── public/                   # Static assets served directly
│   │   └── vite.svg              # Vite logo
│   │
│   └── src/                      # React source code
│       ├── main.jsx              # React app entry point (mounts App to DOM)
│       ├── App.jsx               # Root component with router outlet
│       ├── App.css               # App-level styles
│       ├── index.css             # Global styles and Tailwind imports
│       │
│       ├── .env                  # ENV variables (not committed)
│       ├── .env.example          # ENV variables Examples
│       │
│       ├── config/               # Route definitions
│       │   └── Api.jsx           # Api configuration for all pages
│       │
│       ├── routes/               # Route definitions
│       │   └── AppRoutes.jsx     # React Router route configuration for all pages
│       │
│       ├── pages/                     # Full page components
│       │   ├── Home.jsx               # Landing page
│       │   ├── Reel.jsx               # Reels page
│       │   ├── 404.jsx                # Not found page
│       │   ├── About.jsx              # About page
│       │   ├── Contact.jsx            # Contact page
│       │   ├── Checkout.jsx           # Checkout page
│       │   ├── OrderConfirmation.jsx  # Order confirmation page ✨ NEW
│       │   ├── OrderHistory.jsx       # Order history page ✨ NEW
│       │   ├── WorkingProgress.jsx    # Placeholder for features under development
│       │   │
│       │   ├── FoodPartner/       # Partner/restaurant pages
│       │   │   ├── CreateFood.jsx      # Form to upload image/video food posts
│       │   │   ├── PartnerProfile.jsx  # Partner profile with posts, reviews, bio editing
│       │   │   ├── Dashboard.jsx       # Partner analytics and campaign management
│       │   │   ├── PartnerLogin.jsx    # Partner login with JWT cookie auth
│       │   │   └── PartnerRegister.jsx # Partner registration form
│       │   │
│       │   └── User/              # User pages
│       │       ├── UserLogin.jsx       # User login
│       │       ├── UserRegister.jsx    # User registration
│       │       └── UserProfile.jsx     # User profile and order history
│       │
│       ├── Components/            # Reusable UI components
│       │   ├── Navbar.jsx              # Top navigation bar
│       │   ├── Footer.jsx              # Footer with links
│       │   ├── ErrorBoundary.jsx       # Error handling component
│       │   ├── MenuBarBottom.jsx       # Bottom navigation for Reels
│       │   ├── BackToTop.jsx           # Scroll-to-top button
│       │   ├── FoodDetailModal.jsx     # Instagram-like modal for viewing food posts
│       │   ├── FoodPartnersReviews.jsx # Display partner reviews with ratings
│       │   └── UserPosts.jsx           # User-generated content grid
│       │
│       ├── Contexts/              # React Context providers (global state)
│       │   └── AuthContext.jsx         # Auth state management (user, partner, admin)
│       │
│       ├── hooks/                 # Custom React hooks
│       │   └── useAuth.jsx              # Simplified auth hooks (6 focused hooks)
│       │
│       ├── pages/                     # Full page components
│       │   ├── Home.jsx               # Landing page
│       │   ├── Reel.jsx               # Reels page
│       │   ├── 404.jsx                # Not found page
│       │   ├── About.jsx              # About page
│       │   ├── Contact.jsx            # Contact page
│       │   ├── Checkout.jsx           # Checkout page
│       │   ├── OrderConfirmation.jsx  # Order confirmation page ✨ NEW
│       │   ├── OrderHistory.jsx       # Order history page ✨ NEW
│       │   ├── WorkingProgress.jsx    # Placeholder for features under development
│       │   │
│       │   ├── Admin/             # Admin pages (new)
│       │   │   ├── AdminPage.jsx       # Admin login page
│       │   │   └── AdminDashboard.jsx  # Admin dashboard
│       │   │
│       │   ├── FoodPartner/       # Partner/restaurant pages
│       │   │   ├── CreateFood.jsx      # Form to upload image/video food posts
│       │   │   ├── PartnerProfile.jsx  # Partner profile with posts, reviews, bio editing
│       │   │   ├── Dashboard.jsx       # Partner analytics and campaign management
│       │   │   ├── PartnerLogin.jsx    # Partner login with JWT cookie auth
│       │   │   └── PartnerRegister.jsx # Partner registration form
│       │   │
│       │   └── User/              # User pages
│       │       ├── UserLogin.jsx       # User login
│       │       ├── UserRegister.jsx    # User registration
│       │       └── UserProfile.jsx     # User profile and order history
│
└── Videos/                        # Sample video files for testing
    └── Spegeti.mp4                # Sample food video
```

### Key file purposes

**Frontend (Client)**
- `main.jsx`: React entry - renders `<App />` into `#root` div
- `AppRoutes.jsx`: Defines all routes (/, /partner-login, /create-food, etc.)
- `CreateFood.jsx`: Multi-step form for uploading food images/videos with tags and description
- `PartnerProfile.jsx`: Instagram-like profile showing partner's posts, reviews, follower counts, and bio editing
- `FoodDetailModal.jsx`: Full-screen modal for viewing food posts with like/comment/save actions
- `Navbar.jsx`: Top navigation with links to login, register, profile, and create post

**Backend (Server)**
- `server.js`: Starts Express server and imports `app.js`
- `app.js`: Configures Express middleware (CORS, JSON parsing, cookie parser) and mounts routes
- `db.js`: Connects to MongoDB using Mongoose
- `auth.controller.js`: Handles partner/user registration, login (sets JWT cookie), session verification
- `food.controller.js`: Creates food posts (with file upload), lists posts, validates file types
- `foodPartner.controller.js`: Gets partner profile data, updates bio, retrieves partner reviews
- `storage.service.js`: Uploads files to ImageKit CDN and returns public URLs
- `isLoggedin.js` / `isFoodPartnerLoggedin.js`: JWT middleware to protect routes

**Models**
- `user.Model.js`: Customer accounts
- `foodPartner.Model.js`: Restaurant/partner accounts with business details
- `food.model.js`: Food posts (image/video URL, tags, likes, comments, type)
- `review.model.js`: Partner reviews with ratings and timestamps

---

## 📚 Documentation

FoodReel maintains comprehensive documentation organized into logical categories for easy navigation and maintenance.

### 📖 Documentation

Only these documents are version-controlled, so only these are linked here. Everything else under `docs/` is local-only by design (the repository ignores `*.md` apart from the files below).

| I want to... | Go to |
|--------------|-------|
| Set the project up and run it | [README.md](#getting-started) (this file) |
| Set up the React frontend | [Client/README.md](Client/README.md) |
| Understand business logic & monetization | [docs/architecture/BUSINESS_MODEL.md](docs/architecture/BUSINESS_MODEL.md) |
| Understand the content-type system (food vs advertisement) | [docs/architecture/FOOD_VS_ADVERTISEMENT_SYSTEM.md](docs/architecture/FOOD_VS_ADVERTISEMENT_SYSTEM.md) |
| Understand the API surface | `server/src/routes/` — routes are the source of truth |

```text
FoodReel/
├── README.md
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

> The `docs/` tree also contains audits, checklists and updates locally. They are **not** committed — see `.gitignore`.

---

## Local setup

Before you start, ensure you have Node.js (>=18) and npm/yarn installed, plus a running MongoDB instance (local or cloud such as MongoDB Atlas).

### 1) Prerequisites

- Node.js & npm (or yarn) — Node.js 18 or newer (Express 5 / bcrypt 6 requirement)
- MongoDB connection string
- ImageKit account (optional but used by default in the project)

### 2) Environment variables

Create a `.env` file for the `server/` folder (or set env vars in your environment). These names must match the code exactly — the server validates them at startup and exits if required ones are missing:

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

> **Naming note:** older docs used `MONGO_URI`/`MONGODB_URI`/`CLIENT_URL`/`CORS_ORIGIN`/`SENDGRID_API_KEY`. The code reads **`MONGODB_URL`** and **`FRONTEND_URL`** only — setting the old names causes a boot-loop.

**Deployment:**
- **Backend (Render):** `render.yaml` at the repo root defines the service (`rootDir: server`, `/health` check). Secret values are prompted by Render, never committed.
- **Frontend (Vercel):** set the project **Root Directory = `Client`** in the dashboard; `Client/.env.production` carries `VITE_API_BASE_URL` (read at build time), and `Client/vercel.json` provides the SPA rewrite. Set `FRONTEND_URL` on Render to your Vercel origin (CORS allowlist).
- **Keeping Render awake:** Render's free tier idles the service after ~15 minutes, and the first request then pays a cold start (measured 33s vs 0.7s warm). `.github/workflows/keep-render-warm.yml` pings `/health` every 5 minutes to hold it open. Optionally set the repo secret `RENDER_HEALTH_URL` (Settings → Secrets and variables → Actions) to override the default production URL. Note that GitHub disables scheduled workflows in public repos after 60 days of inactivity.

### Automation

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `.github/workflows/ci.yml` | push / PR to `main` | Server import + app-load check, `npm test`, client lint + build, dependency audit |
| `.github/workflows/keep-render-warm.yml` | every 5 min / manual | Pings Render `/health` so the free instance never spins down |

Server tests run locally with `cd server && npm test` (Node's built-in runner — no test framework installed).

### 3) Install & run

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

### Quick debugging tips

- If images/videos don't appear, check backend console logs (controller prints formatted items) and browser console network tab for returned URLs.
- Ensure ImageKit env vars are correctly provided. The storage service returns direct `response.url`.

## 📚 API Documentation

**The route files under `server/src/routes/` are the source of truth for the API.** Each route file maps paths to controllers; the auth middleware applied to each route documents who may call it.

### Quick API Reference

**Base URL:** `http://localhost:3000/api`

#### Authentication Endpoints
- `POST /api/auth/user/register` – Register new user
- `POST /api/auth/user/login` – User login (sets JWT cookie)
- `POST /api/auth/user/logout` – User logout
- `GET /api/auth/user/profile` – Get user profile
- `PUT /api/auth/user/profile` – Update user profile
- `PUT /api/auth/user/change-password` – Change password
- `POST /api/auth/partner/register` – Register food partner
- `POST /api/auth/partner/login` – Partner login (sets JWT cookie)
- `GET /api/auth/verify` – Verify user session
- `GET /api/auth/partner/check` – Verify partner session
- `POST /api/auth/admin/login` – Admin login (sets JWT cookie) **NEW**
- `GET /api/auth/admin/verify` – Verify admin session **NEW**
- `GET /api/auth/admin/profile` – Get admin profile **NEW**
- `POST /api/auth/admin/logout` – Admin logout **NEW**

#### Food & Posts
- `POST /api/food` – Create food post (multipart/form-data, partner only)
- `GET /api/food` – Get all food posts (with pagination)
- `GET /api/food/trending` – Get trending posts
- `GET /api/food/my-posts` – Get partner's own posts (partner only)
- `POST /api/food/:id/like` – Toggle like on post (user only)
- `POST /api/food/:id/save` – Toggle save/bookmark (user only)

#### User Posts
- `POST /api/posts/user` – Create user post (multipart/form-data, user only)
- `GET /api/posts/user` – Get all user posts
- `GET /api/posts/user/my-posts` – Get logged-in user's posts
- `POST /api/posts/user/:id/like` – Toggle like on user post
- `POST /api/posts/user/:id/comment` – Add comment to user post

#### Follow System
- `POST /api/follow/follow` – Follow a user or food partner
- `POST /api/follow/unfollow` – Unfollow
- `GET /api/follow/followers/:userId/:userType` – Get followers list
- `GET /api/follow/following/:userId/:userType` – Get following list
- `GET /api/follow/check/:targetId/:targetType` – Check if following
- `GET /api/follow/suggestions` – Get suggested follows

#### Review System
- `POST /api/reviews/create` – Create review (user only)
- `GET /api/reviews/partner/:partnerId` – Get partner reviews
- `GET /api/reviews/food/:foodId` – Get food item reviews
- `GET /api/reviews/user/:userId` – Get user's reviews
- `PUT /api/reviews/:reviewId` – Update review
- `DELETE /api/reviews/:reviewId` – Delete review
- `POST /api/reviews/:reviewId/helpful` – Mark review as helpful
- `POST /api/reviews/:reviewId/reply` – Add reply to review
- `POST /api/reviews/:reviewId/respond` – Food partner response (partner only)

#### Orders
- `POST /api/orders` – Create new order (user only)
- `GET /api/orders` – Get user's orders
- `GET /api/orders/partner` – Get partner's orders (partner only)
- `PUT /api/orders/partner/:orderId/status` – Update order status (partner only)
- `GET /api/orders/partner/statistics` – Get order statistics (partner only)
- `GET /api/orders/:id` – Get single order by ID (user only) **NEW**

#### Payments
- `POST /api/payment/create-order` – Create Razorpay order (user only)
- `POST /api/payment/verify` – Verify payment (user only)
- `POST /api/payment/failure` – Handle payment failure
- `POST /api/payment/refund` – Initiate refund (user only)

#### User Profile & Preferences
- `POST /api/user/profile-picture` – Upload profile picture (user only)
- `PUT /api/user/preferences` – Update food preferences (user only)
- `GET /api/user/address` – Get all delivery addresses (user only)
- `POST /api/user/address` – Add new delivery address (user only)
- `PUT /api/user/address/:id` – Update delivery address (user only)
- `DELETE /api/user/address/:id` – Delete delivery address (user only)
- `PATCH /api/user/address/:id/default` – Set default delivery address (user only)

#### Advertisements
- `POST /api/advertisement` – Create advertisement (partner only)
- `GET /api/advertisement` – Get all advertisements
- `GET /api/advertisement/:id` – Get advertisement by ID
- `PUT /api/advertisement/:id` – Update advertisement (partner only)
- `DELETE /api/advertisement/:id` – Delete advertisement (partner only)

**For request/response shapes, read the controller that backs each route in `server/src/controllers/`.**

---

## Storage & file uploads

- Multer configuration uses memory storage. Files are uploaded to ImageKit using `storage.service.js` which returns a public URL.
- Frontend must send the file using the field name `file` (FormData.append('file', file)). For compatibility the backend validates MIME type based on provided `type` field.

## Troubleshooting

- CORS / cookies: ensure frontend origin matches backend CORS and `axios` uses `withCredentials: true`.
- Missing media: check ImageKit env keys and verify the upload response logs in server console.
- 400 from upload: ensure the file field is named `file` and not `image`/`video`.

## Next steps / TODO

### 🚨 Critical Priority (Required for Order Management)

**Backend Updates:**
- [ ] Implement `GET /api/orders/:id` endpoint for order details
- [ ] Add ownership verification in order controller
- [ ] Update user's orderHistory on order creation
- [ ] Test order API endpoints with Postman

**Frontend Updates:**
- [ ] Add OrderConfirmation route in AppRoutes.jsx
- [ ] Update Checkout.jsx to navigate to order confirmation
- [ ] Fix lint warnings in order pages
- [ ] Add "My Orders" link in Navbar
- [ ] Test complete order flow end-to-end


### 🔄 Medium Priority (Enhancements)

- Add comment persistence and real-time updates (WebSockets)
- Add pagination/feed endpoints and infinite scroll
- Add upcoming food fest ticket booking system
- Implement download receipt functionality
- Add order tracking timeline UI
- Add server-side search and filtering

### 🟢 Low Priority (Future Features)

- Add more robust validation & unit tests
- Add CI pipeline and Docker setup
- Implement advanced order analytics
- Add bulk order operations
- Add order export functionality

### 📊 Current Status

- ✅ **Completed**: OrderConfirmation.jsx and OrderHistory.jsx pages created
- ✅ **Completed**: Core user, partner, cart, order, review, follow and FoodFest modules implemented
- 🔄 **In Progress**: Payment verification hardening and FoodFest ticket finalization
- 🔄 **In Progress**: Test coverage and CI

---

## 📝 Documentation Notes

**Version control policy**
- `.gitignore` ignores `*.md`, with explicit exceptions for `README.md`, `Client/README.md`, `docs/architecture/BUSINESS_MODEL.md` and `docs/architecture/FOOD_VS_ADVERTISEMENT_SYSTEM.md`.
- Only those four files are committed. The wider `docs/` tree (audits, checklists, updates) stays local by design, so it is deliberately not linked from this README.
- Want the audits and roadmap in version control? Remove the `*.md` rule (or add a `!docs/**/*.md` negation) in `.gitignore` and commit them.

---

