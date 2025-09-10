import express from 'express';
import authController from '../controllers/auth.controller.js';
import foodPartnerAuthController from '../controllers/foodPartner.controller.js';
const router = express.Router();

router.post('/user/login',authController.login, (req, res) => {
    // res.render('login');
});
router.post('/user/register',authController.register, (req, res) => {
    
})

router.get('/user/logout',authController.logout, (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

router.post('/partner/login',foodPartnerAuthController.login, (req, res) => {
    // res.render('login');
});
router.post('/partner/register',foodPartnerAuthController.register, (req, res) => {
    
})

router.get('/partner/logout',foodPartnerAuthController.logout, (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

export default router;