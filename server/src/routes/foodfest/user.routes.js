import express from 'express';
import {
    browseEvents,
    getEventDetails,
  purchaseTicket,
  verifyTicketPayment,
  getMyTickets
} from '../../controllers/foodfest/ticket.user.controller.js';
import { createUserProposal, getMyProposals } from '../../controllers/foodfest/proposal.controller.js';
import {
    listEventStalls,
    toggleUpvote,
    listStallReviews,
    createStallReview
} from '../../controllers/foodfest/stall.public.controller.js';
import isLoggedin from '../../middlewares/isLoggedin.js';
import optionalAuth from '../../middlewares/optionalAuth.js';
import { rateLimiter } from '../../middlewares/rateLimiter.js';
import { withIdempotency } from '../../services/idempotency.js';
import { validateBody, validateParams, isObjectId, isNonEmptyString, isIntInRange } from '../../utils/validate.js';

const router = express.Router();

// GET /api/foodfest/events - for  all browseEvents
router.get('/events', browseEvents);

// GET /api/foodfest/events/:getEventId  - for a specific event details
router.get('/events/:eventId', getEventDetails);

// POST /api/foodfest/user/proposals - regular user submits an event proposal
router.post('/proposals', isLoggedin, createUserProposal);

// GET /api/foodfest/user/my-proposals - user's own proposals and their status
router.get('/my-proposals', isLoggedin, getMyProposals);

// POST /api/foodfest/tickets/purchase  - for purchasing a ticket.
router.post('/tickets/purchase', isLoggedin, validateBody({
    eventId: { check: isObjectId, message: 'eventId must be a valid id' },
    tierId: { check: isObjectId, message: 'tierId must be a valid id' }
}), withIdempotency('foodfest.ticket.purchase'), purchaseTicket);

// POST /api/foodfest/tickets/verify - for verifying a ticket
// A ticket is not an order, so it needs its own verification endpoint.
router.post('/tickets/verify', isLoggedin, rateLimiter, verifyTicketPayment);

// GET /api/foodfest/my-tickets - for a user's getMyTickets
router.get('/my-tickets', isLoggedin, getMyTickets);

// Stall discovery — public, optionalAuth only flags the caller's own upvote.
router.get('/events/:eventId/stalls', optionalAuth, listEventStalls);
router.get('/stalls/:stallId/reviews', listStallReviews);
router.post(
    '/stalls/:stallId/upvote',
    isLoggedin,
    validateParams({ stallId: { check: isObjectId, message: 'stallId must be a valid id' } }),
    toggleUpvote
);
// Reviews require a paid ticket to the stall's event (checked in the handler).
router.post(
    '/stalls/:stallId/reviews',
    isLoggedin,
    rateLimiter,
    validateParams({ stallId: { check: isObjectId, message: 'stallId must be a valid id' } }),
    validateBody({
        rating: { check: (v) => isIntInRange(v, 1, 5), message: 'rating must be an integer from 1 to 5' },
        comment: { check: (v) => isNonEmptyString(v, 1000), message: 'comment must be 1-1000 characters' }
    }),
    createStallReview
);

export default router;
