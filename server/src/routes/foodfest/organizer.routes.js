import express from 'express';
import {
    listMyEvents,
    getMyEvent,
    updateMyEvent,
    listMyTiers,
    createMyTier,
    updateMyTier,
    deleteMyTier,
    listMyZones,
    createMyZone,
    updateMyZone,
    deleteMyZone,
    listMyEventTickets,
    getMyEventSummary,
    publishMyEvent,
    goLiveMyEvent,
    completeMyEvent
} from '../../controllers/foodfest/organizer.controller.js';
import isLoggedin from '../../middlewares/isLoggedin.js';

const router = express.Router();

// Every organizer route requires a logged-in user. Ownership and the
// admin-granted organizerAccess flag are enforced in the controller.
router.use(isLoggedin);

// Events
router.get('/events', listMyEvents);
router.get('/events/:eventId', getMyEvent);
router.put('/events/:eventId', updateMyEvent);
router.get('/events/:eventId/summary', getMyEventSummary);

// Ticket tiers (ticket issuance)
router.get('/events/:eventId/tiers', listMyTiers);
router.post('/events/:eventId/tiers', createMyTier);
router.put('/tiers/:tierId', updateMyTier);
router.delete('/tiers/:tierId', deleteMyTier);

// Venue zones
router.get('/events/:eventId/zones', listMyZones);
router.post('/events/:eventId/zones', createMyZone);
router.put('/zones/:zoneId', updateMyZone);
router.delete('/zones/:zoneId', deleteMyZone);

// Ticket sales / attendees
router.get('/events/:eventId/tickets', listMyEventTickets);

// Lifecycle
router.patch('/events/:eventId/publish', publishMyEvent);
router.patch('/events/:eventId/go-live', goLiveMyEvent);
router.patch('/events/:eventId/complete', completeMyEvent);

export default router;
