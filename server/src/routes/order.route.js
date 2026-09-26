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

// GET /api/orders/partner/:orderId - Get one order for the owning partner
router.get('/partner/:orderId',
    isFoodPartnerLoggedin,
    orderController.getPartnerOrderById
);

// PUT /api/orders/partner/:orderId/status - Update order status
router.put('/partner/:orderId/status',
    isFoodPartnerLoggedin,
    orderController.updateOrderStatus
);

// POST /api/orders/partner/:orderId/cancel - Partner cancel order
router.post('/partner/:orderId/cancel',
    isFoodPartnerLoggedin,
    orderController.partnerCancelOrder
);

// GET /api/orders/:orderId - Get order details 
router.get('/:orderId',
    isLoggedin,
    orderController.getOrderById
);

// POST /api/orders/:orderId/cancel - Cancel order
router.post('/:orderId/cancel',
    isLoggedin,
    orderController.cancelOrder
);

// DEV-ONLY: POST /api/orders/dev/:orderId/status - Update order status and send email (for testing after DB changes)
// Never registered in production (controller has a second NODE_ENV guard as defense-in-depth).
if (process.env.NODE_ENV !== 'production') {
    router.post('/dev/:orderId/status',
        orderController.devUpdateOrderStatusAndEmail
    );
}

export default router;