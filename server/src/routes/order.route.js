import express from 'express';
import orderController from '../controllers/order.controller.js';
import isLoggedin from '../middlewares/isLoggedin.js';
import isFoodPartnerLoggedin from '../middlewares/isFoodPartnerLoggedin.js';
import { withIdempotency } from '../services/idempotency.js';
import { validateBody, validateParams, isObjectId } from '../utils/validate.js';

const router = express.Router();

const orderIdParams = validateParams({
    orderId: { check: isObjectId, message: 'orderId must be a valid id' }
});

// User routes
// POST /api/orders - Create new order (only for food items, not advertisements)
  router.post('/',
    isLoggedin,
    validateBody({
        items: {
            check: (v) => Array.isArray(v) && v.length > 0 && v.length <= 50
                && v.every((i) => i && isObjectId(i.foodItemId)),
            message: 'items must be a non-empty array (max 50) of valid foodItem ids'
        },
        deliveryAddress: {
            check: (v) => v && typeof v === 'object' && !Array.isArray(v),
            message: 'deliveryAddress is required'
        }
    }),
    // A retried checkout must not create a second order (and a second charge).
    // No header = no idempotency, so existing clients are unaffected.
    withIdempotency('order.create'),
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
    orderIdParams,
    orderController.getPartnerOrderById
);

// PUT /api/orders/partner/:orderId/status - Update order status
router.put('/partner/:orderId/status',
    isFoodPartnerLoggedin,
    orderIdParams,
    orderController.updateOrderStatus
);

// POST /api/orders/partner/:orderId/cancel - Partner cancel order
router.post('/partner/:orderId/cancel',
    isFoodPartnerLoggedin,
    orderIdParams,
    orderController.partnerCancelOrder
);

// POST /api/orders/partner/:orderId/cancel-request - Partner asks an admin to
// cancel an order it has already started preparing. The order parks in
// 'cancel_requested' until an admin approves or rejects it.
router.post('/partner/:orderId/cancel-request',
    isFoodPartnerLoggedin,
    orderIdParams,
    orderController.partnerRequestCancel
);

// GET /api/orders/:orderId - Get order details 
router.get('/:orderId',
    isLoggedin,
    orderIdParams,
    orderController.getOrderById
);

// POST /api/orders/:orderId/cancel - Cancel order
router.post('/:orderId/cancel',
    isLoggedin,
    orderIdParams,
    orderController.cancelOrder
);

// DEV-ONLY: POST /api/orders/dev/:orderId/status - Update order status and send email (for testing after DB changes)
if (process.env.NODE_ENV === 'development') {
  router.post('/dev/:orderId/status',
        orderController.devUpdateOrderStatusAndEmail
    );
}

export default router;