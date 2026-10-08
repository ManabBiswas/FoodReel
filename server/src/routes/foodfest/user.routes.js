import express from 'express';
import {
    browseEvents,
    getEventDetails,
  purchaseTicket,
  verifyTicketPayment,
  getMyTickets
} from '../../controllers/foodfest/ticket.user.controller.js';
import isLoggedin from '../../middlewares/isLoggedin.js';
import { rateLimiter } from '../../middlewares/rateLimiter.js';
import { withIdempotency } from '../../services/idempotency.js';

const router = express.Router();

// GET /api/foodfest/events - for  all browseEvents
router.get('/events', browseEvents);

// GET /api/foodfest/events/:getEventId  - for a specific event details
router.get('/events/:eventId', getEventDetails);

// POST /api/foodfest/tickets/purchase  - for purchasing a ticket.
router.post('/tickets/purchase', isLoggedin, withIdempotency('foodfest.ticket.purchase'), purchaseTicket);

// POST /api/foodfest/tickets/verify - for verifying a ticket
// A ticket is not an order, so it needs its own verification endpoint.
router.post('/tickets/verify', isLoggedin, rateLimiter, verifyTicketPayment);

// GET /api/foodfest/my-tickets - for a user's getMyTickets
router.get('/my-tickets', isLoggedin, getMyTickets);

export default router;
