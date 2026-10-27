# FoodReel Client - React + Vite Frontend

## Overview

React frontend for FoodReel, a social food ordering platform with Instagram/TikTok-style reels for food discovery.

## Features

### User features
- **Food reels**: Scroll through food videos and images.
- **User profiles**: Manage basic info (name, email, mobile), password, food preferences (cuisines, dietary restrictions, spice level), delivery addresses, and profile picture.
- **Food ordering**: Place orders and pay through Razorpay.
- **Social features**: Like, save, share, comment, and follow.
- **Reviews and ratings**: Write and read reviews.
- **Address management**: Add, edit, delete, and set default delivery addresses.

### Partner features
- **Partner dashboard**: Manage food posts and advertisements.
- **Content creation**: Upload food videos and images with descriptions.
- **Analytics**: Track engagement and orders.
- **Review management**: Respond to customer reviews.

### Admin features
- **Admin dashboard**: Platform oversight and management.
- **Analytics and reporting**: View platform metrics.
- **User and partner management**: Manage accounts and content.
- **Revenue tracking**: Monitor payments and platform fees.
- **Content moderation**: Review and manage user-generated content.

## Tech stack

- **React 19.x**: UI framework.
- **Vite**: Build tool with HMR.
- **React Router**: Client-side routing.
- **Axios**: HTTP client with cookie support.
- **React Toastify**: Toast notifications.
- **Lucide React**: Icon library.
- **Tailwind CSS**: Utility-first styling.

## Project structure

```
Client/
├── src/
│   ├── pages/
│   │   ├── User/
│   │   │   ├── UserLogin.jsx
│   │   │   ├── UserRegister.jsx
│   │   │   ├── UserProfile.jsx
│   │   │   ├── ProfileSettings.jsx    # Profile management with delivery addresses
│   │   │   └── CreatePost.jsx
│   │   ├── FoodPartner/
│   │   │   ├── PartnerLogin.jsx
│   │   │   ├── PartnerRegister.jsx
│   │   │   ├── PartnerProfile.jsx
│   │   │   ├── CreateFood.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── Admin/                     # Admin pages
│   │   │   ├── AdminPage.jsx          # Admin login page
│   │   │   └── AdminDashboard.jsx     # Admin dashboard
│   │   ├── Reel.jsx                  # Main reels feed
│   │   ├── Checkout.jsx              # Order checkout
│   │   └── Home.jsx
│   ├── Contexts/
│   │   └── AuthContext.jsx           # Auth state with authType (user, partner, admin)
│   ├── hooks/
│   │   └── useAuth.jsx               # Auth hooks (6 focused hooks)
│   ├── Components/
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── FoodDetailModal.jsx       # Food detail with reviews
│   │   ├── QuickOrderModal.jsx       # Quick order popup
│   │   └── ReelOrderButton.jsx
│   ├── config/
│   │   └── Api.jsx                   # Centralized API endpoints
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
- Create orders
- Razorpay integration
- Order tracking

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
1. **Basic info**: Name, email, mobile, profile picture.
2. **Password**: Change password with validation.
3. **Preferences**: Cuisines, dietary restrictions, spice level.
4. **Delivery addresses**: Add, edit, delete, and set default addresses.
5. **Address**: Legacy address field.

### Address management
- Add new delivery addresses.
- Edit existing addresses.
- Delete addresses.
- Set a default address.
- Label addresses as Home, Work, or Other.
- Store full address details (street, city, state, ZIP, country).

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

See the main project [README](../README.md) for contribution guidelines.

## License

See the main project LICENSE file.
