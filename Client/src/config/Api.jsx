const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_VERSION = import.meta.env.VITE_API_VERSION || '';

// Construct base API URL
const BASE_URL = API_VERSION ? `${API_BASE_URL}/api/${API_VERSION}` : `${API_BASE_URL}/api`;

// API endpoints configuration
export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    userLogin: `${BASE_URL}/auth/user/login`,
    userRegister: `${BASE_URL}/auth/user/register`,
    userProfile: `${BASE_URL}/auth/user/profile`,
    userLogout: `${BASE_URL}/auth/user/logout`,
    userVerify: `${BASE_URL}/auth/verify`,
    userChangePassword: `${BASE_URL}/auth/user/change-password`,
    userDeleteAccount: `${BASE_URL}/auth/user/account`,
    
    partnerLogin: `${BASE_URL}/auth/partner/login`,
    partnerRegister: `${BASE_URL}/auth/partner/register`,
    partnerLogout: `${BASE_URL}/auth/partner/logout`,
    partnerCheck: `${BASE_URL}/auth/partner/check`,
    partnerProfile: `${BASE_URL}/auth/partner/profile`,
    partnerBio: `${BASE_URL}/auth/partner/bio`,
    partnerReviews: `${BASE_URL}/auth/partner/reviews`,
    partnerStatistics: `${BASE_URL}/auth/partner/statistics`, // Added
  },

  // User profile endpoints
  user: {
    stats: `${BASE_URL}/user/stats`,
    activity: `${BASE_URL}/user/activity`,
    profilePicture: `${BASE_URL}/user/profile-picture`,
    preferences: `${BASE_URL}/user/preferences`,
    address: `${BASE_URL}/user/address`,
    validatePassword: `${BASE_URL}/user/validate-password`,
  },
  
  // Food endpoints
  food: {
    create: `${BASE_URL}/food`,
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
  },
  
  // Payment endpoints
  payment: {
    createOrder: `${BASE_URL}/payment/create-order`,
    verify: `${BASE_URL}/payment/verify`,
    failure: `${BASE_URL}/payment/failure`,
    refund: `${BASE_URL}/payment/refund`,
    webhook: `${BASE_URL}/payment/webhook`,
  },
  
  // Partner follow endpoint
  partner: {
    follow: (id) => `${BASE_URL}/foodpartner/${id}/follow`,
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