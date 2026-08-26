import express from 'express';
import {
    createEvent,
    getEvent,
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
} from '../controllers/foodfest/event.admin.controller.js';
import isAdmin from '../../middlewares/isAdmin.js';

const router = express.Router();

// Event CRUD
router.post('/events', isAdmin, createEvent);
router.get('/events/:eventId', isAdmin, getEvent);
router.put('/events/:eventId', isAdmin, updateEvent);
router.delete('/events/:eventId', isAdmin, deleteEvent);

// Zones
router.post('/events/:eventId/zones', isAdmin, createZone);
router.put('/zones/:zoneId', isAdmin, updateZone);
router.delete('/zones/:zoneId', isAdmin, deleteZone);

// Tiers
router.post('/events/:eventId/tiers', isAdmin, createTier);
router.put('/tiers/:tierId', isAdmin, updateTier);
router.delete('/tiers/:tierId', isAdmin, deleteTier);

// Lifecycle & Guardrails
router.get('/events/:eventId/capacity-check', isAdmin, checkCapacity);
router.patch('/events/:eventId/publish', isAdmin, publishEvent);
router.patch('/events/:eventId/go-live', isAdmin, goLiveEvent);
router.patch('/events/:eventId/complete', isAdmin, completeEvent);

export default router;
