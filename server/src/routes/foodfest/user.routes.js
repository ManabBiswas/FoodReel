import express from 'express';
import {
    browseEvents,
    getEventDetails,
    purchaseTicket,
    getMyTickets
} from '../controllers/foodfest/ticket.user.controller.js';
import isLoggedin from '../../middlewares/isLoggedin.js';

const router = express.Router();

router.get('/events', browseEvents);
router.get('/events/:eventId', getEventDetails);
router.post('/tickets/purchase', isLoggedin, purchaseTicket);
router.get('/my-tickets', isLoggedin, getMyTickets);

export default router;
