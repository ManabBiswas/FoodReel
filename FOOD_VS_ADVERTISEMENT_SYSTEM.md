# FoodReel - Food vs Advertisement System Documentation

## 🎯 Overview

FoodReel now supports **two distinct post types**:
1. **Food Items**: Sellable products with pricing and ordering functionality
2. **Advertisements**: Promotional content with offers, discounts, and marketing details

## 🏗️ Architecture Changes

### Backend Model Updates

#### Food Model (`food.model.js`)
```javascript
// New fields added:
postType: { type: String, enum: ['food', 'advertisement'], default: 'food' }

// Food-specific fields:
price: { type: Number, min: 0 }
currency: { type: String, enum: ['INR', 'USD'], default: 'INR' }
preparationTime: { type: Number, min: 0 } // in minutes

// Advertisement-specific fields:
promotionType: { type: String, enum: ['discount', 'bogo', 'combo', 'seasonal', 'announcement'] }
prices: {
  original: { type: Number, min: 0 },
  discounted: { type: Number, min: 0 }
}
validUntil: { type: Date }
promoCode: { type: String, uppercase: true, trim: true }
```

#### Order Model (`order.model.js`) - NEW
Complete ordering system for food items only:
- User details and delivery address
- Food item reference and pricing
- Order status tracking
- Payment integration ready
- Automatic total calculation

### Backend Controller Updates

#### Food Controller (`food.controller.js`)
Enhanced with:
- **Post type validation**: Ensures correct fields for each type
- **Comprehensive field handling**: Price validation for food, promotion validation for ads
- **Filtered endpoints**: Get food items vs advertisements separately
- **Statistics tracking**: Separate analytics for each post type

#### Order Controller (`order.controller.js`) - NEW
Features:
- **Food-only ordering**: Prevents ordering of advertisements
- **Price validation**: Ensures food items have pricing before ordering
- **Status tracking**: From pending to delivered with timestamps
- **Partner management**: Order management for restaurants

### API Endpoints

#### Food Endpoints
```
POST   /api/food                    # Create food or advertisement
GET    /api/food                    # Get all posts (public)
GET    /api/food/trending           # Get trending posts with type filter
GET    /api/food/my-posts           # Get partner's posts (authenticated)
GET    /api/food/advertisements     # Get active advertisements
GET    /api/food/menu               # Get orderable food items with pricing
GET    /api/food/statistics         # Get post analytics for partners
```

#### Order Endpoints - NEW
```
POST   /api/orders                  # Create order (food items only)
GET    /api/orders                  # Get user's orders
GET    /api/orders/partner          # Get partner's orders
PUT    /api/orders/partner/:id/status # Update order status
GET    /api/orders/partner/statistics # Get order analytics
```

## 🎨 Frontend Enhancements

### CreateFood Component
**Multi-step form process**:

#### Step 1: Post Type Selection
- **Food Item**: For sellable products
  - Price and currency selection
  - Preparation time estimation
  - Direct ordering capability

- **Advertisement**: For promotional content
  - Promotion type selection
  - Optional price comparison
  - Validity period with expiry
  - Promo code generation

#### Step 2: Detailed Form
- **Conditional fields**: Different fields based on selection
- **Smart validation**: Type-specific validation rules
- **Visual indicators**: Color-coded UI (green for food, purple for ads)

### Home Component
Enhanced display with:
- **Post type badges**: Visual distinction between food and ads
- **Conditional information**: Price for food, offers for ads
- **Smart buttons**: "Order Now" vs "View Offer"
- **Rich metadata**: Preparation time, promo codes, validity dates

### Dashboard Component - NEW
Complete partner management:
- **Statistics overview**: Separate analytics for food vs advertisements
- **Tabbed interface**: Filter by post type
- **Engagement metrics**: Likes, comments, saves tracking
- **Quick actions**: View, edit, delete posts

## 🔄 User Experience Flow

### For Food Items:
1. **Creation**: Partner sets price, prep time, description
2. **Discovery**: Users see pricing and preparation time
3. **Ordering**: Direct order placement with delivery details
4. **Fulfillment**: Partner manages order status updates

### For Advertisements:
1. **Creation**: Partner sets promotion type, offers, validity
2. **Discovery**: Users see promotional details and offers
3. **Engagement**: Users interact with promotional content
4. **Conversion**: Users utilize promo codes or visit restaurant

## 📊 Business Intelligence

### Analytics Tracking
- **Separate metrics** for food items and advertisements
- **Engagement rates** by post type
- **Revenue tracking** for food orders
- **Promotional effectiveness** for advertisements

### Partner Dashboard
- **Performance insights**: Which post types perform better
- **Revenue analytics**: Income from food orders
- **Engagement analytics**: Marketing effectiveness of ads

## 🛡️ Validation & Security

### Input Validation
- **Post type enforcement**: Strict type checking
- **Price validation**: Positive numbers for food items
- **Date validation**: Future dates for advertisement validity
- **File type validation**: Images and videos only

### Business Rules
- **Order restrictions**: Only food items can be ordered
- **Pricing requirements**: Food items must have prices for ordering
- **Advertisement expiry**: Automatic filtering of expired ads

## 🚀 Implementation Benefits

### For Food Partners:
1. **Dual revenue streams**: Direct sales + promotional marketing
2. **Flexible content strategy**: Mix food items with promotional content
3. **Detailed analytics**: Understand what content drives engagement vs sales
4. **Order management**: Built-in ordering system for food items

### For Users:
1. **Clear distinction**: Know what's orderable vs promotional
2. **Rich information**: Pricing, preparation time, offers all visible
3. **Seamless ordering**: Direct ordering from food posts
4. **Promotional discovery**: Easy access to deals and offers

### For Platform:
1. **Revenue opportunities**: Commission on orders + promotional advertising
2. **Content variety**: Mix of sellable items and marketing content
3. **User engagement**: Different interaction patterns for different content types
4. **Data insights**: Comprehensive analytics on user behavior

## 🔮 Future Enhancements

### Planned Features:
1. **Advanced ordering**: Cart functionality, multiple items
2. **Payment integration**: Online payments, wallets
3. **Delivery tracking**: Real-time order status updates
4. **Review system**: Post-order reviews and ratings
5. **Promotional analytics**: Advanced marketing metrics
6. **Recommendation engine**: Personalized content based on order history

### Technical Roadmap:
1. **Mobile app**: React Native implementation
2. **Real-time updates**: WebSocket for live order tracking
3. **AI recommendations**: Machine learning for content discovery
4. **Advanced search**: Filter by price, location, cuisine type

## 📈 Success Metrics

### Key Performance Indicators:
- **Food item conversion rate**: Views to orders
- **Advertisement engagement rate**: Views to interactions
- **Partner satisfaction**: Usage of both post types
- **Revenue growth**: Orders + promotional advertising income
- **User retention**: Return users and order frequency

This comprehensive system transforms FoodReel from a simple content platform into a complete food commerce and marketing ecosystem, providing value for users, partners, and the platform itself.