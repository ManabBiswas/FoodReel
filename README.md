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

Top-level folders:

- `Client/` – React frontend
  - `src/` – React source files
    - `pages/` – route pages (including `FoodPartner/CreateFood.jsx`, `PartnerProfile.jsx`)
    - `Components/` – reusable UI components (e.g. `Navbar`, `FoodDetailModal`)
  - `package.json`, `vite.config.js` etc.

- `Server/` – Express backend
  - `src/`
    - `controllers/` – route handlers (auth, food, foodPartner)
    - `models/` – Mongoose models (User, FoodPartner, Food, Review)
    - `routes/` – Express routers (auth.route.js, food.route.js)
    - `services/` – third-party services (ImageKit wrapper)
    - `middlewares/` – authentication middlewares
    - `db/` – database connection helper
  - `server.js` – starts the server
  - `package.json`

Other:
- `Videos/` – sample videos used during development

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

- GET `/api/food` – list all foods

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

If you'd like, I can also add a short CONTRIBUTING.md, Postman collection for the API, or example .env files. Tell me what you'd prefer next.
