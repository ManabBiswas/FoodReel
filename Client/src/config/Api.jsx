// Remove trailing slash from base URL to prevent double slashes
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const API_VERSION = import.meta.env.VITE_API_VERSION || '';

// Construct base API URL
const BASE_URL = API_VERSION ? `${API_BASE_URL}/api/${API_VERSION}` : `${API_BASE_URL}/api`;

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
    partnerStatistics: `${BASE_URL}/auth/partner/statistics`,
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
    
    // Orders
    orders: `${BASE_URL}/admin/orders`,
    orderDetails: (orderId) => `${BASE_URL}/admin/orders/${orderId}`,
    
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
    favorites: `${BASE_URL}/user/favorites`,  
    bio: `${BASE_URL}/user/bio`,
    reviews: `${BASE_URL}/user/reviews`,
    saved: `${BASE_URL}/user/saved`,
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
    byId: (id) => `${BASE_URL}/advertisement/${id}`,
    update: (id) => `${BASE_URL}/advertisement/${id}`,
    delete: (id) => `${BASE_URL}/advertisement/${id}`,
  },
  
  // Order endpoints
  order: {
    create: `${BASE_URL}/orders`,
    getAll: `${BASE_URL}/orders`,
    partner: `${BASE_URL}/orders/partner`,
    updateStatus: (id) => `${BASE_URL}/orders/partner/${id}/status`,
    statistics: `${BASE_URL}/orders/partner/statistics`,
    getById: (id) => `${BASE_URL}/orders/${id}`,
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
    checkout: `${BASE_URL}/cart/checkout`,
  },
  
  // Payment endpoints
  payment: {
    createOrder: `${BASE_URL}/payment/create-order`,
    verify: `${BASE_URL}/payment/verify`,
    failure: `${BASE_URL}/payment/failure`,
    refund: `${BASE_URL}/payment/refund`,
    webhook: `${BASE_URL}/payment/webhook`,
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
  
  // Partner follow endpoint
  partner: {
    follow: (id) => `${BASE_URL}/foodpartner/${id}/follow`,
  },
  
  // Contact endpoint
  contact: {
    send: `${BASE_URL}/contact`,
  }
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