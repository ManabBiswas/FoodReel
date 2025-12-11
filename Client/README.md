# FoodReel Client - React + Vite Frontend

## 🚀 Overview

Modern React frontend for FoodReel - a social food ordering platform with Instagram/TikTok-style reels for food discovery.

## ✨ Key Features

### User Features
- 🎥 **Food Reels** - Scroll through engaging food videos and images
- 👤 **User Profiles** - Comprehensive profile management with:
  - Basic information (name, email, mobile)
  - Password management
  - Food preferences (cuisines, dietary restrictions, spice level)
  - Multiple delivery addresses with default selection
  - Profile picture upload
- 🛒 **Food Ordering** - Quick order with Razorpay payment integration
- ❤️ **Social Features** - Like, save, share, comment, and follow
- ⭐ **Reviews & Ratings** - Write and view detailed reviews with ratings
- 📍 **Address Management** - Add, edit, delete, and set default delivery addresses

### Partner Features
- 🏪 **Partner Dashboard** - Manage food posts and advertisements
- 📸 **Content Creation** - Upload food videos/images with descriptions
- 📊 **Analytics** - Track engagement and orders
- 💬 **Review Management** - Respond to customer reviews

### Admin Features **NEW**
- 👨‍💼 **Admin Dashboard** - Platform oversight and management
- 📊 **Analytics & Reporting** - View platform metrics and statistics
- 👥 **User & Partner Management** - Manage accounts and content
- 💰 **Revenue Tracking** - Monitor payments and platform fees
- 🔍 **Content Moderation** - Review and manage user-generated content

## 🛠 Tech Stack

- **React 18.x** - UI framework
- **Vite** - Fast build tool with HMR
- **React Router** - Client-side routing
- **Axios** - HTTP client with cookie support
- **React Toastify** - Toast notifications
- **Lucide React** - Modern icon library
- **Tailwind CSS** - Utility-first styling

## 📁 Project Structure

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
│   │   ├── Admin/                     # Admin pages (NEW)
│   │   │   ├── AdminPage.jsx          # Admin login page
│   │   │   └── AdminDashboard.jsx     # Admin dashboard
│   │   ├── Reel.jsx                  # Main reels feed
│   │   ├── Checkout.jsx              # Order checkout
│   │   └── Home.jsx
│   ├── Contexts/
│   │   └── AuthContext.jsx           # Auth state with authType (user, partner, admin)
│   ├── hooks/
│   │   └── useAuth.jsx               # Simplified auth hooks (6 focused hooks)
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

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
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

### Environment Variables

Create a `.env` file in the Client directory:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_API_VERSION=
```

## 📡 API Integration

The frontend connects to the backend API via the centralized `Api.jsx` configuration file:

### Key API Endpoints Used

**Authentication**
- User login/register/logout
- Partner login/register
- Admin login/verify **NEW**
- Session verification

**User Profile**
- Get/update profile
- Change password
- Upload profile picture
- Manage preferences
- **Delivery address CRUD operations**

**Food & Posts**
- Browse reels
- Like/save posts
- Create user posts
- View food details

**Orders & Payments**
- Create orders
- Razorpay integration
- Order tracking

**Social Features**
- Follow/unfollow
- Reviews & ratings
- Comments

### Authentication System

The app uses a unified authentication system with `AuthContext` that supports three user types:
- **User** (`authType: 'user'`) - Regular customers
- **Partner** (`authType: 'partner'`) - Food restaurant/business
- **Admin** (`authType: 'admin'`) - Platform administrator

Routes are automatically protected based on `authType` value.

## 🎨 UI Components

### Profile Settings Tabs
1. **Basic Info** - Name, email, mobile, profile picture
2. **Password** - Change password with validation
3. **Preferences** - Cuisines, dietary restrictions, spice level
4. **Delivery Addresses** - Add, edit, delete, set default addresses
5. **Address** - Legacy address field

### Address Management Features
- ➕ Add new delivery addresses
- ✏️ Edit existing addresses
- 🗑️ Delete addresses
- ⭐ Set default address
- 🏠 Label addresses (Home/Work/Other)
- 📍 Full address details (street, city, state, ZIP, country)

## 🔧 Development

### Vite Plugins

- **@vitejs/plugin-react** - Uses Babel for Fast Refresh
- **@vitejs/plugin-react-swc** - Uses SWC for Fast Refresh (alternative)

### ESLint Configuration

For production applications, consider:
- TypeScript integration
- Type-aware lint rules
- Check the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts)

## 📱 Responsive Design

- Mobile-first approach
- Tailwind CSS breakpoints
- Touch-optimized interactions
- Adaptive layouts for tablets and desktops

## 🔐 Authentication

- JWT-based authentication with HTTP-only cookies
- Automatic session verification on app load
- Protected routes for authenticated users
- Separate auth flows for users, partners, and admins
- Centralized `AuthContext` with `authType` tracking
- 6 simplified custom hooks via `useAuth.jsx`:
  - `useAuth()` - Full context access
  - `useIsAuthenticated()` - Boolean check
  - `useCurrentUser()` - Get current user/partner/admin object
  - `useAuthType()` - Get auth type as string ('user'/'partner'/'admin'/null)
  - `useUserType()` - Get flags object {isUser, isPartner, isAdmin}
  - `useLogout()` - Logout function

## 📦 Build & Deployment

```bash
# Production build
npm run build

# Preview production build locally
npm run preview
```

Build output is in the `dist/` directory, ready for deployment to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

## 🤝 Contributing

See the main project [README](../README.md) for contribution guidelines.

## 📄 License

See the main project LICENSE file.
