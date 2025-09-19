import express from 'express';
import authController from '../controllers/auth.controller.js';
import foodPartnerAuthController from '../controllers/foodPartner.controller.js';
import isLoggedin from '../middlewares/isLoggedin.js';
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

router.get('/user/logout',authController.logout, (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Auth verification endpoint
router.get('/verify', isLoggedin, authController.verify);

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