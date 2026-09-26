import express from 'express';
import authController from '../controllers/auth.controller.js';
import foodPartnerAuthController from '../controllers/foodPartner.controller.js';
import isLoggedin from '../middlewares/isLoggedin.js';
import isFoodPartnerLoggedin from '../middlewares/isFoodPartnerLoggedin.js';
import { sanitizeMultipart } from '../middlewares/sanitization.js';
import { authRateLimiter } from '../middlewares/rateLimiter.js';
import { uploadProfile } from '../middlewares/fileUpload.js';

const upload = uploadProfile;

const router = express.Router();

router.post('/user/login', authRateLimiter, authController.login, (req, res) => {
    // res.render('login');
});
router.post('/user/register', upload.single('profileImage'), sanitizeMultipart, authController.register, (req, res) => {
    
})
router.get('/user/profile', isLoggedin, authController.getProfile);
router.put('/user/profile', isLoggedin, upload.single('profileImage'), sanitizeMultipart, authController.updateProfile);
router.put('/user/change-password', isLoggedin, authController.changePassword);
router.delete('/user/account', isLoggedin, authController.deleteAccount);

router.post('/user/logout', authController.logout);

// Auth verification endpoint
router.get('/verify', isLoggedin, authController.verify);

router.post('/partner/login', authRateLimiter, foodPartnerAuthController.login, (req, res) => {
    // res.render('login');
});
router.post('/partner/register', foodPartnerAuthController.register, (req, res) => {
    // console.log(req.body);
})

router.post('/partner/logout', foodPartnerAuthController.logout);

// Food Partner auth verification endpoint
router.get('/partner/check', isFoodPartnerLoggedin, foodPartnerAuthController.check);

// Food Partner profile endpoints
router.get('/partner/profile', isFoodPartnerLoggedin, foodPartnerAuthController.getProfile);
router.put('/partner/bio', isFoodPartnerLoggedin, foodPartnerAuthController.updateBio);
router.get('/partner/reviews', isFoodPartnerLoggedin, foodPartnerAuthController.getReviews);

// Admin Authentication Routes — rate-limited: these are unauthenticated
// endpoints with a plaintext code compare (see M13)
router.post('/admin/login', authRateLimiter, authController.adminLogin);
router.post('/admin/logout', authController.adminLogout);
router.get('/admin/verify', authController.adminVerify);
router.get('/admin/profile', authController.adminProfile);

export default router;