import express from 'express';
import userController from '../controllers/user.controller.js';
import isLoggedin from '../middlewares/isLoggedin.js';
import multer from 'multer';

// Configure multer for profile image uploads
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

// User profile routes (all require authentication)
router.get('/stats', isLoggedin, userController.getUserStats);
router.get('/activity', isLoggedin, userController.getUserActivity);

// Profile picture management
router.post('/profile-picture', isLoggedin, upload.single('profileImage'), userController.uploadProfilePicture);
router.delete('/profile-picture', isLoggedin, userController.removeProfilePicture);

// User preferences and address
router.put('/preferences', isLoggedin, userController.updatePreferences);
router.put('/address', isLoggedin, userController.updateAddress);

// Password validation (for sensitive operations)
router.post('/validate-password', isLoggedin, userController.validatePassword);

export default router;