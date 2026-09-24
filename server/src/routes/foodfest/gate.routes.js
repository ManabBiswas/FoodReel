import express from 'express';
import { scanTicket, checkoutTicket } from '../controllers/foodfest/scan.gate.controller.js';
import isAdmin from '../../middlewares/isAdmin.js';

const router = express.Router();

router.post('/scan', isAdmin, scanTicket);
router.post('/checkout', isAdmin, checkoutTicket);

export default router;