# FoodReel

FoodReel is a full‑stack social + commerce platform for restaurants and food partners to share short videos and images of dishes (similar to Instagram/Reels). This repository contains a React + Vite frontend and an Express + Node backend with MongoDB for persistence and ImageKit for media storage.

## India edition — short summary

This project is intended to operate in India: targeting local restaurants, cloud kitchens, and food partners who want to reach food-loving customers (`real foody`) using short video/image posts, promoted placements (ads), and an in‑app commerce flow for ordering. Payments and payouts should support India-specific rails (UPI, wallets, and Indian payment gateways), and taxation (GST) must be considered for orders and platform fees.

- Strong product-market fit: high mobile usage and appetite for food discovery across metro and tier-2/3 cities.
- Low incremental cost to onboard restaurants — many are actively looking for low-cost digital marketing channels.
- Payment rails: UPI adoption makes low-friction payments possible and reduces checkout friction.
- Local delivery networks already exist (and can be partnered with) reducing initial logistics investment.
- Monetization mix: ads + small platform fee on orders balance recurring and transactional revenue streams.


This README provides a high‑level overview, project structure, setup & run instructions, and a short API reference to help you get started quickly.

## Table of contents
- Project overview
- Repo structure
- Local setup
  - Prerequisites
  - Environment variables
  - Install & run (backend / frontend)
- Development notes
- API overview (important endpoints)
- Storage & file uploads
- Troubleshooting
- Next steps / TODO

---

## Project overview

- Frontend: React (Vite) app located in `Client/`.
- Backend: Express server located in `Server/` using Mongoose for MongoDB models.
- Storage: ImageKit (via `Server/src/services/storage.service.js`) for uploaded images/videos.
- Authentication: JWT-based cookie authentication (HTTP-only cookies). Middleware protects partner routes.

This app supports:
- Food partner registration/login
- Creating food posts (image/video) with tags and metadata
- Partner profile page with posts and reviews
- File uploads via multipart/form-data (Multer in memory -> ImageKit)

## Repo structure

Complete folder and file tree with explanations:

```
FoodReel/
│
├── README.md                     # Project overview, setup, and API docs
├── BUSINESS_MODEL.md             # Detailed India-focused business model, pricing, GTM
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
│       │   ├── OrderConfirmation.jsx  # Order confirmation page
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
│       │   └── (auth, cart, ads contexts - to be added)
│       │
│       ├── hooks/                 # Custom React hooks
│       │   └── (useAuth, useFetch, useCart - to be added)
│       │
│       └── assets/                # Images, icons, logos
│           ├── logo.png           # FoodReel logo
│           └── react.svg          # React logo
│
├── Server/                        # Express backend API
│   ├── package.json               # Backend dependencies 
│   ├── package-lock.json          # Locked dependency versions
│   ├── server.js                  # Entry point - starts Express server
│   ├── .env                       # Environment variables (not committed)
│   ├── .env.example               # Example env file for developers
│   ├── .gitignore                 # Git ignore for node_modules, .env
│   ├── NeedToSearch.txt           # Development notes / TODOs
│   │
│   └── src/                       # Backend source code
│       ├── app.js                 # Express app setup, middleware, CORS, route mounting
│       │
│       ├── db/                    # Database connection
│       │   └── db.js              # Mongoose connection helper
│       │
│       ├── models/                # Mongoose schemas (MongoDB collections)
│       │   ├── user.Model.js           # User/customer schema 
│       │   ├── advertisement.Model.js  # Ad schema 
│       │   ├── order.Model.js          # Order schema 
│       │   ├── review.Model.js         # Review schema 
│       │   ├── user.Model.js           # user schema 
│       │   ├── food.model.js           # Food post schema 
│       │   └── review.model.js         # Review schema 
│       │
│       ├── controllers/           # Route handlers (business logic)
│       │   ├── auth.controller.js       # Authentication (login, register, check session)
│       │   ├── food.controller.js       # Food CRUD (create post, list, get by ID)
│       │   └── foodPartner.controller.js # Partner profile, bio update, reviews, stats
│       │
│       ├── routes/                # Express routers
│       │   ├── adnertisement.route.js    # Advertisement endpoints (/api/ads/*)
│       │   ├── auth.route.js             # Auth endpoints (/api/auth/*)
│       │   ├── user.route.js             # User endpoints (/api/auth/*)
│       │   ├── order.route.js            # Order endpoints (/api/auth/*)
│       │   └── food.route.js             # Food endpoints (/api/food/*)
│       │
│       ├── middlewares/           # Auth and validation middleware
│       │   ├── isLoggedin.js           # Verify user JWT cookie
│       │   └── isFoodPartnerLoggedin.js # Verify partner JWT cookie
│       │
│       └── services/              # External service integrations
│           └── storage.service.js  # ImageKit wrapper for file upload (returns CDN URLs)
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

## Local setup

Before you start, ensure you have Node.js (>=16) and npm/yarn installed, plus a running MongoDB instance (local or cloud such as MongoDB Atlas).

### 1) Prerequisites

- Node.js & npm (or yarn)
- MongoDB connection string
- ImageKit account (optional but used by default in the project)

### 2) Environment variables

Create `.env` files for the `Server/` folder (or set env vars in your environment). Required variables (examples):

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/foodreel
JWT_SECRET=your_jwt_secret_here
IMAGEKIT_PUBLIC_KEY=your_imagekit_public
IMAGEKIT_PRIVATE_KEY=your_imagekit_private
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

Place other optional config values as needed (cookie options, CORS origin, etc.).

### 3) Install & run

Backend (Server):

```powershell
cd Server
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
- Backend CORS is preconfigured to allow `http://localhost:5173` in `Server/src/app.js`.
- Backend listens on `http://localhost:3000` by default (changeable via `PORT`).

## Development notes

- File uploads are handled with `multer` in memory and uploaded to ImageKit via `Server/src/services/storage.service.js`.
- Uploaded media URLs from ImageKit are returned and stored in `food.image` or `food.video` in MongoDB.
- Partner profile endpoint returns formatted food items (includes `image`, `video`, `likeCount`, `commentCount`, `tags`).
- Frontend uses `axios` with `withCredentials: true` for cookie-based auth.

### Quick debugging tips

- If images/videos don't appear, check backend console logs (controller prints formatted items) and browser console network tab for returned URLs.
- Ensure ImageKit env vars are correctly provided. The storage service returns direct `response.url`.

## API overview (important endpoints)

Base URL: `http://localhost:3000`

- POST `/api/auth/partner/register` – register a partner (body: companyName, email, password, ...)
- POST `/api/auth/partner/login` – partner login (sets HTTP-only cookie)
- GET `/api/auth/partner/check` – verify partner session
- GET `/api/auth/partner/profile` – get partner profile + food items (protected)
- PUT `/api/auth/partner/bio` – update bio (protected)

- POST `/api/food` – create food post (multipart/form-data, protected)
  - Fields: `file` (file), `name`, `description`, `type` ('image'|'video'), `tags` (JSON string or CSV), `duration` (optional)

- GET `/api/food` – list all foods (protected)

- GET `/api/food/trending` – list trending foods

- GET `/api/food/trending?limit=${limit}` -- list top `limit` trending foods
<!-- 
const { data } = await axios.get('/api/food/trending', {
    params: { limit: 5 }
});
 -->


See controllers in `Server/src/controllers/` for more endpoints and behavior.

## Storage & file uploads

- Multer configuration uses memory storage. Files are uploaded to ImageKit using `storage.service.js` which returns a public URL.
- Frontend must send the file using the field name `file` (FormData.append('file', file)). For compatibility the backend validates MIME type based on provided `type` field.

## Troubleshooting

- CORS / cookies: ensure frontend origin matches backend CORS and `axios` uses `withCredentials: true`.
- Missing media: check ImageKit env keys and verify the upload response logs in server console.
- 400 from upload: ensure the file field is named `file` and not `image`/`video`.

## Next steps / TODO

- Add comment persistence and real-time updates (WebSockets)
- Add pagination/feed endpoints and infinite scroll
- Add more robust validation & unit tests
- Add CI pipeline and Docker setup
---

