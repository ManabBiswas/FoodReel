# FoodReel Food vs Advertisement System

## Overview

FoodReel supports two post types:
1. **Food items**: Sellable products with pricing and ordering.
2. **Advertisements**: Promotional content with offers, discounts, and marketing details.

## Architecture changes

### Backend model updates

#### Food model (`food.model.js`)
```javascript
// Status (2026-11): fields as implemented
// New fields:
postType: { type: String, enum: ['food', 'advertisement'], default: 'food' }

// Food-specific fields:
price: { type: Number, min: 0 }
currency: { type: String, enum: ['INR'], default: 'INR' }
preparationTime: { type: Number, min: 0 } // in minutes

// Advertisement-specific fields:
promotionType: { type: String, enum: ['discount', 'bogo', 'combo', 'seasonal', 'announcement'] }
prices: {
  original: { type: Number, min: 0 },
  discounted: { type: Number, min: 0 }
}
validUntil: { type: Date }
promoCode: { type: String, uppercase: true, trim: true }
// Advertisement promo codes sync into the dedicated Coupon collection —
// see coupon.model.js. A code conflict returns 409.
```

#### Coupon model (`coupon.model.js`) — dedicated promo system
- `code`: 5–32 chars, uppercase alphanumerics plus `-` and `_` (deliberately above the trivially-guessable 3-4 char range).
- One restaurant per code; a cart/order is restricted to a single restaurant as well.
- `applicableItemIds`: opt-in item scoping. The discount, the minimum order amount and the minimum quantity all count only the eligible portion — an ineligible item can't smuggle a scoped code past its minimums.
- `minOrderAmount` (rupees, partner-set minimum order value — eligible items only), `minQuantity` (eligible items count), `usageLimit` / `usedCount`, `perUserLimit`, valid window, `isActive`.
- COD orders consume the coupon at creation; Razorpay orders consume it on payment verification/webhook. Invalid/stale codes hard-fail with `COUPON_INVALID`. Orders snapshot the coupon (`coupon` subdocument) immutably; cancellations release the redemption.

#### Order model (`order.model.js`)
The ordering system handles food items only:
- User details and delivery address
- Food item reference and pricing
- Order status tracking
- Payment integration
- Automatic total calculation

### Backend controller updates

#### Food controller (`food.controller.js`)
- **Post type validation**: Ensures correct fields for each type.
- **Field handling**: Price validation for food, promotion validation for ads.
- **Filtered endpoints**: Get food items and advertisements separately.
- **Statistics tracking**: Separate analytics for each post type.

#### Order controller (`order.controller.js`)
- **Food-only ordering**: Prevents ordering advertisements.
- **Price validation**: Ensures food items have pricing before ordering.
- **Status tracking**: From pending to delivered with timestamps.
- **Partner management**: Order management for restaurants.

### API endpoints

#### Food endpoints
```
POST   /api/food                    # Create food or advertisement
GET    /api/food                    # Get all posts (public)
GET    /api/food/trending           # Get trending posts with type filter
GET    /api/food/my-posts           # Get partner's posts (authenticated)
GET    /api/food/advertisements     # Get active advertisements
GET    /api/food/menu               # Get orderable food items with pricing
GET    /api/food/statistics         # Get post analytics for partners
```

#### Order endpoints
```
POST   /api/orders                      # Create order (food items only)
POST   /api/orders/validate-coupon      # Preview a promo code for reel quick checkout (user only)
GET    /api/orders                      # Get user's orders
GET    /api/orders/partner              # Get partner's orders
PUT    /api/orders/partner/:id/status   # Update order status
POST   /api/orders/partner/:id/cancel   # Partner cancel (refund needs admin approval)
POST   /api/orders/:id/cancel           # User cancel (auto-refund)
GET    /api/orders/partner/statistics   # Get order analytics
```

#### Coupon endpoints (partner)
```
POST   /api/coupons                     # Create coupon (5–32 char code)
GET    /api/coupons/partner             # Partner's coupons
GET    /api/coupons/partner/stats       # Coupon usage stats
PUT    /api/coupons/:couponId           # Update coupon
DELETE /api/coupons/:couponId           # Delete coupon
```

#### Cart endpoints
```
POST   /api/cart/apply-coupon           # Validate and apply promo code
DELETE /api/cart/coupon                 # Remove applied promo code
POST   /api/cart/checkout               # Convert cart to order (idempotent)
```

## Frontend enhancements

### CreateFood component

**Multi-step form**:

#### Step 1: Post type selection
- **Food item**: For sellable products.
  - Price and currency selection
  - Preparation time
  - Direct ordering
- **Advertisement**: For promotional content.
  - Promotion type
  - Optional price comparison
  - Validity period with expiry
  - Promo code generation (advertisement promo codes sync into the dedicated Coupon collection — 5–32 char code, one restaurant per code)
- **Quick checkout**: users order directly from a reel via the quick order modal, with a live coupon preview (`POST /api/orders/validate-coupon`) and an immutable order snapshot.

#### Step 2: Detailed form
- **Conditional fields**: Different fields based on selection.
- **Validation**: Type-specific rules.
- **Visual indicators**: Color-coded UI (green for food, purple for ads).

### Home component
- **Post type badges**: Distinguish food and ads.
- **Conditional information**: Price for food, offers for ads.
- **Action buttons**: "Order Now" or "View Offer".
- **Metadata**: Preparation time, promo codes, validity dates.

### Dashboard component
- **Statistics overview**: Separate analytics for food and advertisements.
- **Tabbed interface**: Filter by post type.
- **Engagement metrics**: Likes, comments, saves.
- **Quick actions**: View, edit, delete posts.

## User experience flow

### Food items
1. **Creation**: Partner sets price, prep time, and description.
2. **Discovery**: Users see pricing and preparation time.
3. **Ordering**: Users place orders with delivery details.
4. **Fulfillment**: Partner updates order status.

### Advertisements
1. **Creation**: Partner sets promotion type, offers, and validity.
2. **Discovery**: Users see promotional details and offers.
3. **Engagement**: Users interact with promotional content.
4. **Conversion**: Users use promo codes or visit the restaurant.

## Business intelligence

### Analytics tracking
- **Separate metrics** for food items and advertisements.
- **Engagement rates** by post type.
- **Revenue tracking** for food orders.
- **Promotional effectiveness** for advertisements.

### Partner dashboard
- **Performance insights**: Which post types perform better.
- **Revenue analytics**: Income from food orders.
- **Engagement analytics**: Marketing effectiveness of ads.

## Validation and security

### Input validation
- **Post type enforcement**: Strict type checking.
- **Price validation**: Positive numbers for food items.
- **Date validation**: Future dates for advertisement validity.
- **File type validation**: Images and videos only.

### Business rules
- **Order restrictions**: Only food items can be ordered.
- **Pricing requirements**: Food items must have prices for ordering.
- **Advertisement expiry**: Automatic filtering of expired ads.

## Implementation benefits

### For food partners
1. **Dual revenue streams**: Direct sales and promotional marketing.
2. **Flexible content strategy**: Mix food items with promotional content.
3. **Detailed analytics**: Understand what drives engagement and sales.
4. **Order management**: Built-in ordering for food items.

### For users
1. **Clear distinction**: Know what is orderable and what is promotional.
2. **Rich information**: Pricing, preparation time, and offers are visible.
3. **Direct ordering**: Order from food posts.
4. **Promotional discovery**: Find deals and offers.

### For the platform
1. **Revenue opportunities**: Commission on orders and promotional advertising.
2. **Content variety**: Sellable items and marketing content.
3. **User engagement**: Different interaction patterns for different content types.
4. **Data insights**: Analytics on user behavior.

## Future enhancements

### Already implemented (since the original draft)
1. **Advanced ordering**: Cart functionality and one-vendor orders — delivered (`cart.model`, cart checkout).
2. **Payment integration**: Razorpay (auto-capture) and Cash on Delivery.
3. **Delivery tracking**: Order status with timestamps and an order tracking page.
4. **Review system**: Post-order reviews and ratings (`review.model`).
5. **Promo codes**: Dedicated coupon system with 5–32 character codes, eligible-item scoping, minimum order value/quantity, redemption limits — usable in cart and in reel quick checkout.
6. **Realtime updates**: Socket.IO per-event rooms wired for food fest events (`foodfest.socket.service`), with `useEventSocket` on the client planned.
7. **Promotional analytics**: partner coupon stats and post statistics endpoints.

### Still planned
1. **Mobile app**: React Native implementation.
2. **AI recommendations**: Machine learning for content discovery.
3. **Advanced search**: Filter feed by price, location, and cuisine (client top bar → server-backed `/search`).
4. **Real-time order tracking**: Socket.IO for live order status.
5. **Recommendation engine**: Personalized content based on order history.

## Success metrics

- **Food item conversion rate**: Views to orders.
- **Advertisement engagement rate**: Views to interactions.
- **Partner satisfaction**: Use of both post types.
- **Revenue growth**: Orders and promotional advertising income.
- **User retention**: Return users and order frequency.

The system combines food commerce and promotional marketing in one feed.
