export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const API_VERSION = import.meta.env.VITE_API_VERSION || '';

// Construct base API URL
const BASE_URL = API_VERSION ? `${API_BASE_URL}/api/${API_VERSION}` : `${API_BASE_URL}/api`;

// Socket.io shares the API origin. The handshake authenticates with the same HTTP-only cookie, so the client must connect with `withCredentials: true`.
export const SOCKET_URL = API_BASE_URL;

// API endpoints configuration
export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    // User
    userLogin: `${BASE_URL}/auth/user/login`,
    userRegister: `${BASE_URL}/auth/user/register`,
    userProfile: `${BASE_URL}/auth/user/profile`,
    updateProfile: `${BASE_URL}/auth/user/profile`,
    userLogout: `${BASE_URL}/auth/user/logout`,
    userVerify: `${BASE_URL}/auth/verify`,
    userChangePassword: `${BASE_URL}/auth/user/change-password`,
    userDeleteAccount: `${BASE_URL}/auth/user/account`,
    // Partner
    partnerLogin: `${BASE_URL}/auth/partner/login`,
    partnerRegister: `${BASE_URL}/auth/partner/register`,
    partnerLogout: `${BASE_URL}/auth/partner/logout`,
    partnerCheck: `${BASE_URL}/auth/partner/check`,
    partnerProfile: `${BASE_URL}/auth/partner/profile`,
    partnerBio: `${BASE_URL}/auth/partner/bio`,
    partnerReviews: `${BASE_URL}/auth/partner/reviews`,
    // Admin
    adminLogin: `${BASE_URL}/auth/admin/login`,
    adminLogout: `${BASE_URL}/auth/admin/logout`,
    adminVerify: `${BASE_URL}/auth/admin/verify`,
    adminProfile: `${BASE_URL}/auth/admin/profile`,
  },

  // Admin endpoints
  admin: {    
    // Dashboard
    dashboard: `${BASE_URL}/admin/dashboard`,
    alerts: `${BASE_URL}/admin/alerts`,
    dashboardLive: `${BASE_URL}/admin/dashboard/live`,
    dashboardSeries: (range) => `${BASE_URL}/admin/dashboard/timeseries?range=${range}`,
    
    // User Management
    users: `${BASE_URL}/admin/users`,
    userDetails: (userId) => `${BASE_URL}/admin/users/${userId}`,
    toggleUserBlock: (userId) => `${BASE_URL}/admin/users/${userId}/block`,
    deleteUser: (userId) => `${BASE_URL}/admin/users/${userId}`,
    
    // Partner Management
    partners: `${BASE_URL}/admin/partners`,
    partnerDetails: (partnerId) => `${BASE_URL}/admin/partners/${partnerId}`,
    togglePartnerVerify: (partnerId) => `${BASE_URL}/admin/partners/${partnerId}/verify`,
    togglePartnerBlock: (partnerId) => `${BASE_URL}/admin/partners/${partnerId}/block`,
    deletePartner: (partnerId) => `${BASE_URL}/admin/partners/${partnerId}`,
    
    // Content Moderation
    foodItems: `${BASE_URL}/admin/food-items`,
    foodItemDetails: (foodId) => `${BASE_URL}/admin/food-items/${foodId}`,
    approveFoodItem: (foodId) => `${BASE_URL}/admin/food-items/${foodId}/approve`,
    deleteFoodItem: (foodId) => `${BASE_URL}/admin/food-items/${foodId}`,
    
    advertisements: `${BASE_URL}/admin/advertisements`,
    approveAdvertisement: (adId) => `${BASE_URL}/admin/advertisements/${adId}/approve`,
    deleteAdvertisement: (adId) => `${BASE_URL}/admin/advertisements/${adId}`,
    
    // Reviews
    reviews: `${BASE_URL}/admin/reviews`,
    deleteReview: (reviewId) => `${BASE_URL}/admin/reviews/${reviewId}`,
    updateReviewStatus: (reviewId) => `${BASE_URL}/admin/reviews/${reviewId}/status`,
    
    // Orders
    orders: `${BASE_URL}/admin/orders`,
    orderDetails: (orderId) => `${BASE_URL}/admin/orders/${orderId}`,
    cancelOrder: (orderId) => `${BASE_URL}/admin/orders/${orderId}/cancel`,

    // Partner cancellation requests (food already being prepared)
    cancelRequests: `${BASE_URL}/admin/cancel-requests`,
    decideCancelRequest: (orderId) => `${BASE_URL}/admin/orders/${orderId}/cancel-request/decision`,

    // Analytics
    revenueAnalytics: `${BASE_URL}/admin/analytics/revenue`,
    userAnalytics: `${BASE_URL}/admin/analytics/users`,
    partnerAnalytics: `${BASE_URL}/admin/analytics/partners`,
    
    // Support
    supportTickets: `${BASE_URL}/admin/support-tickets`,
    updateSupportTicket: (ticketId) => `${BASE_URL}/admin/support-tickets/${ticketId}`,
  },

  // User profile endpoints
  user: {
    stats: `${BASE_URL}/user/stats`,
    activity: `${BASE_URL}/user/activity`,
    profilePicture: `${BASE_URL}/user/profile-picture`,
    preferences: `${BASE_URL}/user/preferences`,
    bio: `${BASE_URL}/user/bio`,
    address: `${BASE_URL}/user/address`,
    addAddress: `${BASE_URL}/user/address`,
    addressById: (id) => `${BASE_URL}/user/address/${id}`,
    setDefaultAddress: (id) => `${BASE_URL}/user/address/${id}/default`,
    validatePassword: `${BASE_URL}/user/validate-password`,
  },
  
  // Food endpoints
  food: {
    create: `${BASE_URL}/food`,
    createUserPost: `${BASE_URL}/food/user`,
    getAll: `${BASE_URL}/food`,
    getTrending: `${BASE_URL}/food/trending`,
    myPosts: `${BASE_URL}/food/my-posts`,
    advertisements: `${BASE_URL}/food/advertisements`,
    menu: `${BASE_URL}/food/menu`,
    statistics: `${BASE_URL}/food/statistics`,
    
    // Dynamic endpoints (require ID)
    byId: (id) => `${BASE_URL}/food/${id}`,
    like: (id) => `${BASE_URL}/food/${id}/like`,
    save: (id) => `${BASE_URL}/food/${id}/save`,
    review: (id) => `${BASE_URL}/food/${id}/review`,
    reviews: (id) => `${BASE_URL}/food/${id}/reviews`,
    delete: (id) => `${BASE_URL}/food/${id}`, // Added
    update: (id) => `${BASE_URL}/food/${id}`, // Added
  },

  // User Post endpoints
  userPost: {
    getAll: `${BASE_URL}/food/user`,
    myPosts: `${BASE_URL}/food/user/my-posts`,
    byUserId: (userId) => `${BASE_URL}/food/user/${userId}`,
    like: (id) => `${BASE_URL}/food/user/${id}/like`,
    save: (id) => `${BASE_URL}/food/user/${id}/save`,
    comment: (id) => `${BASE_URL}/food/user/${id}/comment`,
    comments: (id) => `${BASE_URL}/food/user/${id}/comments`,
  },
  
  // Advertisement endpoints
  advertisement: {
    create: `${BASE_URL}/advertisement`,
    getAll: `${BASE_URL}/advertisement`,
    getPublic: `${BASE_URL}/advertisement/public/all`,
    byId: (id) => `${BASE_URL}/advertisement/${id}`,
    update: (id) => `${BASE_URL}/advertisement/${id}`,
    delete: (id) => `${BASE_URL}/advertisement/${id}`,
  },
  
  // Order endpoints
  order: {
    create: `${BASE_URL}/orders`,
    validateCoupon: `${BASE_URL}/orders/validate-coupon`,
    getAll: `${BASE_URL}/orders`,
    partner: `${BASE_URL}/orders/partner`,
    updateStatus: (id) => `${BASE_URL}/orders/partner/${id}/status`,
    partnerCancel: (id) => `${BASE_URL}/orders/partner/${id}/cancel`,
    partnerCancelRequest: (id) => `${BASE_URL}/orders/partner/${id}/cancel-request`,
    statistics: `${BASE_URL}/orders/partner/statistics`,
    getById: (id) => `${BASE_URL}/orders/${id}`,
    partnerGetById: (id) => `${BASE_URL}/orders/partner/${id}`,
    cancel: (id) => `${BASE_URL}/orders/${id}/cancel`,
  },
  
  // Cart endpoints
  cart: {
    get: `${BASE_URL}/cart`,
    add: `${BASE_URL}/cart/add`,
    update: (itemId) => `${BASE_URL}/cart/update/${itemId}`,
    remove: (itemId) => `${BASE_URL}/cart/remove/${itemId}`,
    clear: `${BASE_URL}/cart/clear`,
    validate: `${BASE_URL}/cart/validate`,
    applyCoupon: `${BASE_URL}/cart/apply-coupon`,
    removeCoupon: `${BASE_URL}/cart/coupon`,
    checkout: `${BASE_URL}/cart/checkout`,
  },

  // Promo-code endpoints (partner issuance)
  coupon: {
    create: `${BASE_URL}/coupons`,
    partnerList: `${BASE_URL}/coupons/partner`,
    partnerStats: `${BASE_URL}/coupons/partner/stats`,
    update: (couponId) => `${BASE_URL}/coupons/${couponId}`,
    remove: (couponId) => `${BASE_URL}/coupons/${couponId}`,
  },
  
  // Payment endpoints
  payment: {
    createOrder: `${BASE_URL}/payment/create-order`,
    verify: `${BASE_URL}/payment/verify`,
    failure: `${BASE_URL}/payment/failure`,
  },
  
  // Follow endpoints
  follow: {
    follow: `${BASE_URL}/follow/follow`,
    unfollow: `${BASE_URL}/follow/unfollow`,
    followers: (userId, userType) => `${BASE_URL}/follow/followers/${userId}/${userType}`,
    following: (userId, userType) => `${BASE_URL}/follow/following/${userId}/${userType}`,
    check: (targetId, targetType) => `${BASE_URL}/follow/check/${targetId}/${targetType}`,
    suggestions: `${BASE_URL}/follow/suggestions`,
  },
  
  // Review endpoints
  reviews: {
    create: `${BASE_URL}/reviews/create`,
    byPartner: (partnerId) => `${BASE_URL}/reviews/partner/${partnerId}`,
    byFood: (foodId) => `${BASE_URL}/reviews/food/${foodId}`,
    byUser: (userId) => userId ? `${BASE_URL}/reviews/user/${userId}` : `${BASE_URL}/reviews/user`,
    update: (reviewId) => `${BASE_URL}/reviews/${reviewId}`,
    delete: (reviewId) => `${BASE_URL}/reviews/${reviewId}`,
    helpful: (reviewId) => `${BASE_URL}/reviews/${reviewId}/helpful`,
    reply: (reviewId) => `${BASE_URL}/reviews/${reviewId}/reply`,
    respond: (reviewId) => `${BASE_URL}/reviews/${reviewId}/respond`,
  },
  
  // Comment endpoints (all routes live under /api/comments)
  comments: {
    create:   `${BASE_URL}/comments/create`,
    byPost:   (postId)     => `${BASE_URL}/comments/post/${postId}`,
    byId:     (commentId)  => `${BASE_URL}/comments/${commentId}`,
    update:   (commentId)  => `${BASE_URL}/comments/${commentId}`,
    delete:   (commentId)  => `${BASE_URL}/comments/${commentId}`,
    like:     `${BASE_URL}/comments/like`,
    unlike:   (commentId)  => `${BASE_URL}/comments/unlike/${commentId}`,
    myLikes:  (postId)     => `${BASE_URL}/comments/my-likes/${postId}`,
  },

  // FoodFest endpoints
  foodfest: {
    // User (public reads, authenticated purchase)
    events: `${BASE_URL}/foodfest/user/events`,
    event: (eventId) => `${BASE_URL}/foodfest/user/events/${eventId}`,
    ticketPurchase: `${BASE_URL}/foodfest/user/tickets/purchase`, // requires Idempotency-Key
    ticketVerify: `${BASE_URL}/foodfest/user/tickets/verify`,
    myTickets: `${BASE_URL}/foodfest/user/my-tickets`,
    proposals: `${BASE_URL}/foodfest/user/proposals`,
    myProposals: `${BASE_URL}/foodfest/user/my-proposals`,

    // Admin
    adminEventsList: `${BASE_URL}/foodfest/admin/events`,
    adminCreateEvent: `${BASE_URL}/foodfest/admin/events`,
    adminEvent: (eventId) => `${BASE_URL}/foodfest/admin/events/${eventId}`,
    adminEventZones: (eventId) => `${BASE_URL}/foodfest/admin/events/${eventId}/zones`,
    adminCreateZone: (eventId) => `${BASE_URL}/foodfest/admin/events/${eventId}/zones`,
    adminZone: (zoneId) => `${BASE_URL}/foodfest/admin/zones/${zoneId}`,
    adminEventTiers: (eventId) => `${BASE_URL}/foodfest/admin/events/${eventId}/tiers`,
    adminCreateTier: (eventId) => `${BASE_URL}/foodfest/admin/events/${eventId}/tiers`,
    adminTier: (tierId) => `${BASE_URL}/foodfest/admin/tiers/${tierId}`,
    adminApplications: (eventId) => `${BASE_URL}/foodfest/admin/events/${eventId}/applications`,
    adminApproveApplication: (appId) => `${BASE_URL}/foodfest/admin/applications/${appId}/approve`,
    adminRejectApplication: (appId) => `${BASE_URL}/foodfest/admin/applications/${appId}/reject`,
    adminCapacityCheck: (eventId) => `${BASE_URL}/foodfest/admin/events/${eventId}/capacity-check`,
    adminPublishEvent: (eventId) => `${BASE_URL}/foodfest/admin/events/${eventId}/publish`,
    adminGoLive: (eventId) => `${BASE_URL}/foodfest/admin/events/${eventId}/go-live`,
    adminCompleteEvent: (eventId) => `${BASE_URL}/foodfest/admin/events/${eventId}/complete`,
    adminProposals: `${BASE_URL}/foodfest/admin/proposals`,
    adminApproveProposal: (proposalId) => `${BASE_URL}/foodfest/admin/proposals/${proposalId}/approve`,
    adminRejectProposal: (proposalId) => `${BASE_URL}/foodfest/admin/proposals/${proposalId}/reject`,
    adminOrganizerAccess: (eventId) => `${BASE_URL}/foodfest/admin/events/${eventId}/organizer-access`,

    // Organizer (user-hosted event after admin grants access)
    organizerEvents: `${BASE_URL}/foodfest/organizer/events`,
    organizerEvent: (eventId) => `${BASE_URL}/foodfest/organizer/events/${eventId}`,
    organizerEventSummary: (eventId) => `${BASE_URL}/foodfest/organizer/events/${eventId}/summary`,
    organizerEventTiers: (eventId) => `${BASE_URL}/foodfest/organizer/events/${eventId}/tiers`,
    organizerTier: (tierId) => `${BASE_URL}/foodfest/organizer/tiers/${tierId}`,
    organizerEventZones: (eventId) => `${BASE_URL}/foodfest/organizer/events/${eventId}/zones`,
    organizerZone: (zoneId) => `${BASE_URL}/foodfest/organizer/zones/${zoneId}`,
    organizerEventTickets: (eventId) => `${BASE_URL}/foodfest/organizer/events/${eventId}/tickets`,
    organizerPublish: (eventId) => `${BASE_URL}/foodfest/organizer/events/${eventId}/publish`,
    organizerGoLive: (eventId) => `${BASE_URL}/foodfest/organizer/events/${eventId}/go-live`,
    organizerComplete: (eventId) => `${BASE_URL}/foodfest/organizer/events/${eventId}/complete`,

    // Partner
    partnerAvailableEvents: `${BASE_URL}/foodfest/partner/available-events`,
    partnerApply: (eventId) => `${BASE_URL}/foodfest/partner/events/${eventId}/apply`,
    partnerToggleStall: (stallId) => `${BASE_URL}/foodfest/partner/stalls/${stallId}/toggle-open`,
    partnerMyApplications: `${BASE_URL}/foodfest/partner/my-applications`,

    // Gate (admin-only today)
    gateScan: `${BASE_URL}/foodfest/gate/scan`,
    gateCheckout: `${BASE_URL}/foodfest/gate/checkout`,
  },

  // Contact endpoint
  contact: {
    send: `${BASE_URL}/contact`,
  },
};


// Axios default configuration
export const axiosConfig = {
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
};

// Multipart form data configuration
export const multipartConfig = {
  withCredentials: true,
  headers: {
    'Content-Type': 'multipart/form-data',
  }
};

export default API_ENDPOINTS;