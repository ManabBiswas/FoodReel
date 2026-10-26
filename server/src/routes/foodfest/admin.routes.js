import express from 'express';
import {
    createEvent,
    getEvent,
    listEvents,
    listZones,
    listTiers,
    updateEvent,
    deleteEvent,
    createZone,
    updateZone,
    deleteZone,
    createTier,
    updateTier,
    deleteTier,
    checkCapacity,
    publishEvent,
    goLiveEvent,
    completeEvent
} from '../../controllers/foodfest/event.admin.controller.js';
import {
    getApplicationsByEvent,
    approveApplication,
    rejectApplication
} from '../../controllers/foodfest/application.admin.controller.js';
import isAdmin from '../../middlewares/isAdmin.js';
import { adminRateLimiter } from '../../middlewares/rateLimiter.js';

const router = express.Router();

// Admin dashboard reads are chatty
router.use(adminRateLimiter);

// Event CRUD
router.post('/events', isAdmin, createEvent);
router.get('/events', isAdmin, listEvents);
router.get('/events/:eventId', isAdmin, getEvent);
router.put('/events/:eventId', isAdmin, updateEvent);
router.delete('/events/:eventId', isAdmin, deleteEvent);

// Zones
router.post('/events/:eventId/zones', isAdmin, createZone);
router.get('/events/:eventId/zones', isAdmin, listZones);
router.put('/zones/:zoneId', isAdmin, updateZone);
router.delete('/zones/:zoneId', isAdmin, deleteZone);

// Tiers
router.post('/events/:eventId/tiers', isAdmin, createTier);
router.get('/events/:eventId/tiers', isAdmin, listTiers);
router.put('/tiers/:tierId', isAdmin, updateTier);
router.delete('/tiers/:tierId', isAdmin, deleteTier);

// Applications
router.get('/events/:eventId/applications', isAdmin, getApplicationsByEvent);
router.post('/applications/:appId/approve', isAdmin, approveApplication);
router.post('/applications/:appId/reject', isAdmin, rejectApplication);

// Lifecycle & Guardrails
router.get('/events/:eventId/capacity-check', isAdmin, checkCapacity);
router.patch('/events/:eventId/publish', isAdmin, publishEvent);
router.patch('/events/:eventId/go-live', isAdmin, goLiveEvent);
router.patch('/events/:eventId/complete', isAdmin, completeEvent);

export default router;
