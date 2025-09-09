import express from 'express';
import {register} from '../controllers/auth.controller.js';
const router = express.Router();

router.get('/user/login', (req, res) => {
    res.render('login');
});
router.get('/user/register', (req, res) => {
    
})

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

export default router;