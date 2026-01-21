import express from 'express';
import adminController from '../controllers/admin.controller.js';
import isAdmin from '../middlewares/isAdmin.js';

const router = express.Router();

// ============ AUTH ROUTES ============
// POST /api/admin/login - Admin login
router.post('/login', adminController.login);

// POST /api/admin/logout - Admin logout
router.post('/logout', isAdmin, adminController.logout);

// GET /api/admin/verify - Verify admin session
router.get('/verify', isAdmin, adminController.verifyAdmin);

// GET /api/admin/profile - Get admin profile
router.get('/profile', isAdmin, adminController.getAdminProfile);

// ============ DASHBOARD ROUTES ============
// GET /api/admin/dashboard - Get dashboard statistics
router.get('/dashboard', isAdmin, adminController.getDashboardStats);

// ============ USER MANAGEMENT ROUTES ============
// GET /api/admin/users - Get all users
router.get('/users', isAdmin, adminController.getAllUsers);

// GET /api/admin/users/:userId - Get user details
router.get('/users/:userId', isAdmin, adminController.getUserDetails);

// PUT /api/admin/users/:userId/block - Block/Unblock user
router.put('/users/:userId/block', isAdmin, adminController.toggleUserBlock);

// DELETE /api/admin/users/:userId - Delete user account
router.delete('/users/:userId', isAdmin, adminController.deleteUser);

// ============ PARTNER MANAGEMENT ROUTES ============
// GET /api/admin/partners - Get all food partners
router.get('/partners', isAdmin, adminController.getAllPartners);

// GET /api/admin/partners/:partnerId - Get partner details
router.get('/partners/:partnerId', isAdmin, adminController.getPartnerDetails);

// PUT /api/admin/partners/:partnerId/verify - Verify/Unverify partner
router.put('/partners/:partnerId/verify', isAdmin, adminController.togglePartnerVerification);

// PUT /api/admin/partners/:partnerId/block - Block/Unblock partner
router.put('/partners/:partnerId/block', isAdmin, adminController.togglePartnerBlock);

// DELETE /api/admin/partners/:partnerId - Delete partner account
router.delete('/partners/:partnerId', isAdmin, adminController.deletePartner);

// ============ CONTENT MODERATION ROUTES ============
// GET /api/admin/food-items - Get all food items (for moderation)
router.get('/food-items', isAdmin, adminController.getAllFoodItems);

// GET /api/admin/food-items/:foodId - Get food item details
router.get('/food-items/:foodId', isAdmin, adminController.getFoodItemDetails);

// PUT /api/admin/food-items/:foodId/approve - Approve/Reject food item
router.put('/food-items/:foodId/approve', isAdmin, adminController.approveFoodItem);

// DELETE /api/admin/food-items/:foodId - Delete food item
router.delete('/food-items/:foodId', isAdmin, adminController.deleteFoodItem);

// GET /api/admin/advertisements - Get all advertisements (for moderation)
router.get('/advertisements', isAdmin, adminController.getAllAdvertisements);

// PUT /api/admin/advertisements/:adId/approve - Approve/Reject advertisement
router.put('/advertisements/:adId/approve', isAdmin, adminController.approveAdvertisement);

// DELETE /api/admin/advertisements/:adId - Delete advertisement
router.delete('/advertisements/:adId', isAdmin, adminController.deleteAdvertisement);

// ============ REVIEW & REPORT MANAGEMENT ============
// GET /api/admin/reviews - Get all reviews
router.get('/reviews', isAdmin, adminController.getAllReviews);

// DELETE /api/admin/reviews/:reviewId - Delete review
router.delete('/reviews/:reviewId', isAdmin, adminController.deleteReview);

// ============ ORDERS MANAGEMENT ============
// GET /api/admin/orders - Get all orders
router.get('/orders', isAdmin, adminController.getAllOrders);

// GET /api/admin/orders/:orderId - Get order details
router.get('/orders/:orderId', isAdmin, adminController.getOrderDetails);

// ============ ANALYTICS & REPORTS ============
// GET /api/admin/analytics/revenue - Get revenue analytics
router.get('/analytics/revenue', isAdmin, adminController.getRevenueAnalytics);

// GET /api/admin/analytics/users - Get user analytics
router.get('/analytics/users', isAdmin, adminController.getUserAnalytics);

// GET /api/admin/analytics/partners - Get partner analytics
router.get('/analytics/partners', isAdmin, adminController.getPartnerAnalytics);

// ============ SUPPORT & MESSAGING ============
// GET /api/admin/support-tickets - Get support tickets
router.get('/support-tickets', isAdmin, adminController.getSupportTickets);

// PUT /api/admin/support-tickets/:ticketId - Update support ticket status
router.put('/support-tickets/:ticketId', isAdmin, adminController.updateSupportTicket);

export default router