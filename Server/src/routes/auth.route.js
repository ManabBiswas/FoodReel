import express from 'express';
import authController from '../controllers/auth.controller.js';
import foodPartnerAuthController from '../controllers/foodPartner.controller.js';
import isLoggedin from '../middlewares/isLoggedin.js';
import isFoodPartnerLoggedin from '../middlewares/isFoodPartnerLoggedin.js';
import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        // Accept image files only
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

const router = express.Router();

router.post('/user/login',authController.login, (req, res) => {
    // res.render('login');
});
router.post('/user/register', upload.single('profileImage'), authController.register, (req, res) => {
    
})
router.get('/user/profile', isLoggedin, authController.getProfile);
router.put('/user/profile', isLoggedin, upload.single('profileImage'), authController.updateProfile);
router.put('/user/change-password', isLoggedin, authController.changePassword);
router.delete('/user/account', isLoggedin, authController.deleteAccount);

router.post('/user/logout', authController.logout);

// Auth verification endpoint
router.get('/verify', isLoggedin, authController.verify);

router.post('/partner/login',foodPartnerAuthController.login, (req, res) => {
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

export default router;