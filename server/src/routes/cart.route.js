import express from 'express';
import cartController from '../controllers/cart.controller.js';
import isLoggedin from '../middlewares/isLoggedin.js';
import { withIdempotency } from '../services/idempotency.js';
import { validateBody, validateParams, isObjectId } from '../utils/validate.js';

const router = express.Router();

const itemIdParams = validateParams({
    itemId: { check: isObjectId, message: 'itemId must be a valid id' }
});

// GET /api/cart - Get user's cart
router.get('/', isLoggedin, cartController.getCart);

// POST /api/cart/add - Add item to cart
router.post('/add', isLoggedin, validateBody({
    foodItemId: { check: isObjectId, message: 'foodItemId must be a valid id' }
}), cartController.addToCart);

// PUT /api/cart/update/:itemId - Update item quantity
router.put('/update/:itemId', isLoggedin, itemIdParams, cartController.updateQuantity);

// DELETE /api/cart/remove/:itemId - Remove item from cart
router.delete('/remove/:itemId', isLoggedin, itemIdParams, cartController.removeItem);

// DELETE /api/cart/clear - Clear entire cart
router.delete('/clear', isLoggedin, cartController.clearCart);

// GET /api/cart/validate - Validate cart (check prices, availability)
router.get('/validate', isLoggedin, cartController.validateCart);

// POST /api/cart/checkout - Convert cart to order
// Own scope ('cart.checkout', not 'order.create') so a key reused across
// this endpoint and POST /api/orders cannot collide; no header = pass-through.
router.post('/checkout', isLoggedin, withIdempotency('cart.checkout'), cartController.checkout);

export default router;