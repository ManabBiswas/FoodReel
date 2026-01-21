import express from 'express';
import orderController from '../controllers/order.controller.js';
import isLoggedin from '../middlewares/isLoggedin.js';
import isFoodPartnerLoggedin from '../middlewares/isFoodPartnerLoggedin.js';

const router = express.Router();

// User routes
// POST /api/orders - Create new order (only for food items, not advertisements)
router.post('/',
    isLoggedin,
    orderController.createOrder
);

// GET /api/orders - Get user's orders
router.get('/',
    isLoggedin,
    orderController.getUserOrders
);

// GET /api/orders/partner/statistics - Get order statistics for partners
router.get('/partner/statistics',
    isFoodPartnerLoggedin,
    orderController.getOrderStatistics
);

// GET /api/orders/partner - Get partner's orders
router.get('/partner',
    isFoodPartnerLoggedin,
    orderController.getPartnerOrders
);

// PUT /api/orders/partner/:orderId/status - Update order status
router.put('/partner/:orderId/status',
    isFoodPartnerLoggedin,
    orderController.updateOrderStatus
);

// GET /api/orders/:orderId - Get order details 
router.get('/:orderId',
    isLoggedin,
    orderController.getOrderById
);

export default router;