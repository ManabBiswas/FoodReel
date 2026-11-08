# FoodReel Client - React + Vite Frontend

## Overview

React frontend for FoodReel, a social food ordering platform with Instagram/TikTok-style reels for food discovery. **Live at [foodreel-watch.netlify.app](https://foodreel-watch.netlify.app)** — see the [root README](../README.md) for the full project story, the anatomy of the tricky parts, and how to work with me.

## Features

### User features
- **Food reels**: Scroll through food videos and images.
- **User profiles**: Manage basic info (name, email, mobile), password, food preferences (cuisines, dietary restrictions, spice level), delivery and billing addresses, and profile picture.
- **Food ordering**: Place orders from the cart, or directly from a reel with the Quick Order modal (coupon preview included). Pay through Razorpay or Cash on Delivery.
- **Promo codes**: Apply and remove promo codes in cart checkout and in reel quick checkout. 5–32 characters, with min order value / min quantity / eligible-item scoping enforced on the server.
- **Food festivals**: Browse food fest events, book tickets, and view tickets.
- **Social features**: Like, save, share, comment, and follow.
- **Reviews and ratings**: Write and read reviews.
- **Address management**: Add, edit, delete, and set default delivery addresses. A valid 10-digit Indian mobile number is required for delivery.

### Partner features
- **Partner dashboard**: Manage food posts and advertisements.
- **Content creation**: Upload food videos and images with descriptions.
- **Promo code manager**: Create promo / coupon codes with 5–32 character codes, eligible-item scoping, minimum order value (with preset ₹100 / ₹200 / ₹500 buttons), minimum quantity, usage limits, percentage or fixed discounts, and expiry dates.
- **Advertisements**: Create promoted advertisements with promo codes (synced into the coupon system).
- **Analytics**: Track engagement and orders.
- **Review management**: Respond to customer reviews.
- **Food fest stalls**: Apply for food fest stalls.
- **Order management**: Accept and track orders, request to cancel orders (refund needs admin approval), view cancel statuses.

### Admin features
- **Admin dashboard**: Platform oversight and management.
- **Analytics and reporting**: View platform metrics.
- **User and partner management**: Manage accounts and content.
- **Revenue tracking**: Monitor payments and platform fees.
- **Content moderation**: Review and manage user-generated content.
- **Cancellation approvals**: Review partner cancel requests and manage refunds.
- **Food fest administration**: Manage food fest events, check-ins, gate scans, and stall applications.

## Tech stack

- **React 19.x**: UI framework.
- **Vite**: Build tool with HMR.
- **React Router**: Client-side routing.
- **Axios**: HTTP client with cookie support.
- **SWR**: Client-side data fetching.
- **Socket.IO client**: Realtime updates (food fest events).
- **Tailwind CSS**: Utility-first styling.
- **lucide-react**: Icon library.
- **Recharts**: Charts.
- **html5-qrcode**: QR scanning (gate check-in).
- **jspdf**: Receipt PDFs.

## Project structure

```
Client/
├── src/
│   ├── pages/
│   │   ├── User/
│   │   │   ├── UserLogin.jsx
│   │   │   ├── UserRegister.jsx
│   │   │   ├── UserProfile.jsx
│   │   │   ├── ProfileSettings.jsx    # Profile + delivery/billing addresses (10-digit Indian mobile)
│   │   │   ├── CreatePost.jsx
│   │   │   ├── OrganizerDashboard.jsx
│   │   │   ├── FoodFestEvents.jsx     # Browse food fest events
│   │   │   ├── FoodFestEventDetail.jsx
│   │   │   ├── MyTickets.jsx          # Booked tickets
│   │   │   └── CreateEventProposal.jsx
│   │   ├── FoodPartner/
│   │   │   ├── PartnerLogin.jsx
│   │   │   ├── PartnerRegister.jsx
│   │   │   ├── PartnerProfile.jsx
│   │   │   ├── CreateFood.jsx         # Upload posts/advertisements
│   │   │   ├── PromoCodeManager.jsx   # Create promo / coupon codes
│   │   │   ├── StallApplications.jsx  # Apply for food fest stalls
│   │   │   ├── OrderDetail.jsx        # Partner order details
│   │   │   └── Dashboard.jsx          # Partner analytics & revenue
│   │   ├── Admin/                     # Admin pages
│   │   │   ├── AdminPage.jsx          # Admin login page
│   │   │   └── AdminDashboard.jsx     # Admin dashboard
│   │   ├── Reel.jsx                  # Main reels feed
│   │   ├── CartPage.jsx              # Shopping cart with coupon apply/remove
│   │   ├── Checkout.jsx              # Order checkout (coupon + delivery address)
│   │   ├── OrderConfirmation.jsx     # Post-order confirmation screen
│   │   ├── OrderTracking.jsx         # Order tracking timeline
│   │   ├── OrderHistory.jsx          # Past orders
│   │   ├── Home.jsx                  # Landing page
│   │   ├── About.jsx / Contact.jsx
│   │   ├── 404.jsx
│   │   └── WorkingProgress.jsx
│   ├── Contexts/
│   │   └── AuthContext.jsx           # Auth state with authType (user, partner, admin)
│   ├── hooks/
│   │   ├── useAuth.jsx               # Auth hooks (6 focused hooks)
│   │   └── useCart.jsx               # Cart state and operations
│   ├── Components/
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── FoodDetailModal.jsx       # Food detail with reviews
│   │   ├── QuickOrderModal.jsx       # Reel quick checkout + coupon preview
│   │   ├── ReelOrderButton.jsx       # "Order Now" button on reels
│   │   ├── MenuBarBottom.jsx         # Bottom nav for reels
│   │   ├── ReelArea.jsx              # Single reel item
│   │   └── foodfest/PurchaseModal.jsx # Food fest ticket purchase modal
│   ├── config/
│   │   └── Api.jsx                   # Centralized API endpoints (incl. order.validateCoupon)
│   ├── routes/
│   │   └── AppRoutes.jsx             # Route configuration with authType protection
│   └── main.jsx
└── package.json
```

## Getting started

### Prerequisites
- Node.js 20 or newer
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment variables

Create a `.env` file in the Client directory:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_API_VERSION=
```

## API integration

The frontend calls the backend through the centralized `Api.jsx` configuration.

### Key API endpoints

**Authentication**
- User login, register, and logout
- Partner login and register
- Admin login and verification
- Session verification

**User profile**
- Get and update profile
- Change password
- Upload profile picture
- Manage preferences
- Delivery address CRUD

**Food and posts**
- Browse reels
- Like and save posts
- Create user posts
- View food details

**Orders and payments**
- Create orders (from cart, or directly from reel quick checkout)
- Coupon / promo code validation in both cart and quick checkout (`order.validateCoupon`)
- Razorpay integration (with webhook verification) and Cash on Delivery
- Order tracking and confirmation pages

**Coupons**
- Apply / remove promo codes in the cart
- 5–32 character codes with min order value and eligible-item scoping
- Server re-prices orders and can reject between preview and creation

**Social features**
- Follow and unfollow
- Reviews and ratings
- Comments

### Authentication system

`AuthContext` supports three user types:
- **User** (`authType: 'user'`): customers.
- **Partner** (`authType: 'partner'`): restaurants and food businesses.
- **Admin** (`authType: 'admin'`): platform administrators.

Routes are protected based on `authType`.

## UI components

### Profile settings tabs
1. **Basic info**: Name, email, mobile (valid 10-digit Indian number), profile picture.
2. **Password**: Change password with validation.
3. **Preferences**: Cuisines, dietary restrictions, spice level.
4. **Delivery addresses**: Add, edit, delete, and set default addresses. A valid 10-digit Indian mobile number is required for delivery; `+91` / leading `0` are normalized before saving.
5. **Billing address**: Address + phone (phone validated the same way, optional but must be valid when provided).

### Address management
- Add new delivery addresses.
- Edit existing addresses.
- Delete addresses.
- Set a default address.
- Label addresses as Home, Work, or Other.
- Store full address details (street, city, state, pincode) plus a mandatory 10-digit Indian mobile for delivery.

## Development

### Vite plugins
- **@vitejs/plugin-react**: Uses Babel for Fast Refresh.
- **@vitejs/plugin-react-swc**: Uses SWC for Fast Refresh (alternative).

### ESLint configuration

For production applications, consider:
- TypeScript integration.
- Type-aware lint rules.
- The [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts).

## Responsive design

- Mobile-first layout.
- Tailwind CSS breakpoints.
- Touch-friendly interactions.
- Adaptive layouts for tablets and desktops.

## Authentication

- JWT authentication with HTTP-only cookies.
- Automatic session verification on app load.
- Protected routes for authenticated users.
- Separate auth flows for users, partners, and admins.
- `AuthContext` tracks `authType`.
- Six hooks in `useAuth.jsx`:
  - `useAuth()`: Full context access.
  - `useIsAuthenticated()`: Boolean check.
  - `useCurrentUser()`: Current user, partner, or admin object.
  - `useAuthType()`: Auth type as a string ('user', 'partner', 'admin', or null).
  - `useUserType()`: Flags object `{isUser, isPartner, isAdmin}`.
  - `useLogout()`: Logout function.

## Build and deployment

```bash
# Production build
npm run build

# Preview production build locally
npm run preview
```

Build output goes to `dist/`, ready for:
- Netlify (configured through `netlify.toml` in this directory).

## Contributing

See the main project [README](../README.md) for environment setup, test commands, and the four committed docs.

## License

Copyright © FoodReel Inc. See the main project repository for terms.
