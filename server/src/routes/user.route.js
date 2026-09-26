import express from 'express';
import userController from '../controllers/user.controller.js';
import isLoggedin from '../middlewares/isLoggedin.js';
import { sanitizeMultipart } from '../middlewares/sanitization.js';
import { uploadProfile } from '../middlewares/fileUpload.js';

const upload = uploadProfile;

const router = express.Router();

// User profile routes (all require authentication)
router.get('/stats', isLoggedin, userController.getUserStats);
router.get('/activity', isLoggedin, userController.getUserActivity);

// Profile picture management
router.post('/profile-picture', isLoggedin, upload.single('profileImage'), sanitizeMultipart, userController.uploadProfilePicture);
router.delete('/profile-picture', isLoggedin, userController.removeProfilePicture);

// User preferences and address
router.put('/preferences', isLoggedin, userController.updatePreferences);

// Profile address (single object on the user, no :addressId)
router.put('/address', isLoggedin, userController.updateProfileAddress);

// Delivery address CRUD
router.get('/address', isLoggedin, userController.getAddresses);
router.post('/address', isLoggedin, userController.addAddress);
router.put('/address/:addressId', isLoggedin, userController.updateAddress);
router.delete('/address/:addressId', isLoggedin, userController.deleteAddress);
router.patch('/address/:addressId/default', isLoggedin, userController.setDefaultAddress);

// Password validation (for sensitive operations)
router.post('/validate-password', isLoggedin, userController.validatePassword);

export default router;