import express from 'express';
import {
    getAvailableEvents,
    applyForStall,
    toggleStallOpen,
    getMyApplications
} from '../controllers/foodfest/stall.partner.controller.js';
import isFoodPartnerLoggedin from '../../middlewares/isFoodPartnerLoggedin.js';

const router = express.Router();

router.get('/available-events', isFoodPartnerLoggedin, getAvailableEvents);
router.post('/events/:eventId/apply', isFoodPartnerLoggedin, applyForStall);
router.patch('/stalls/:stallId/toggle-open', isFoodPartnerLoggedin, toggleStallOpen);
router.get('/my-applications', isFoodPartnerLoggedin, getMyApplications);

export default router;
