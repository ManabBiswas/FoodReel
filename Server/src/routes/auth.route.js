import express from 'express';
import authController from '../controllers/auth.controller.js';
const router = express.Router();

router.post('/user/login', (req, res) => {
    res.render('login');
});
router.post('/user/register',authController.register, (req, res) => {
    
})

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

export default router;