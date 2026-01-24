import express from 'express';
import cartController from '../controllers/cart.controller.js';
import isLoggedin from '../middlewares/isLoggedin.js';

const router = express.Router();

// GET /api/cart - Get user's cart
router.get('/', isLoggedin, cartController.getCart);

// POST /api/cart/add - Add item to cart
router.post('/add', isLoggedin, cartController.addToCart);

// PUT /api/cart/update/:itemId - Update item quantity
router.put('/update/:itemId', isLoggedin, cartController.updateQuantity);

// DELETE /api/cart/remove/:itemId - Remove item from cart
router.delete('/remove/:itemId', isLoggedin, cartController.removeItem);

// DELETE /api/cart/clear - Clear entire cart
router.delete('/clear', isLoggedin, cartController.clearCart);

// GET /api/cart/validate - Validate cart (check prices, availability)
router.get('/validate', isLoggedin, cartController.validateCart);

// POST /api/cart/checkout - Convert cart to order
router.post('/checkout', isLoggedin, cartController.checkout);

export default router;