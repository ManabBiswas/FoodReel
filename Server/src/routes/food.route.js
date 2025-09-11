import express from 'express';
import foodController from '../controllers/food.controller.js';
import isFoodPartnerLoggedin from '../middlewares/isFoodPartnerLoggedin.js';
const router = express.Router();


// POST /api/food
router.post('/',isFoodPartnerLoggedin, foodController.createFood, (req, res) => {
    // res.render('login');
});

export default router