import express from 'express'
import * as advertisementController from '../controllers/advertisement.controller.js'
import isFoodPartnerLoggedin from '../middlewares/isFoodPartnerLoggedin.js'
import { sanitizeMultipart } from '../middlewares/sanitization.js'
import { uploadMedia, enforceMediaSize } from '../middlewares/fileUpload.js'
import multer from 'multer'

const router = express.Router()

const upload = uploadMedia

// Multer error handling middleware
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                error: 'Unexpected field. Only "file" field is allowed for file upload.'
            });
        }
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large. Maximum size is 5MB.'
            });
        }
        return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('Only image and video files are allowed')) {
        return res.status(400).json({ error: error.message });
    }
    next(error);
};

// Create advertisement post
// POST /api/advertisement
router.post('/', 
    isFoodPartnerLoggedin, 
    upload.single('file'), enforceMediaSize, 
    sanitizeMultipart,
    handleMulterError,
    advertisementController.createAdvertisement
)

// Get all active advertisements for reels (PUBLIC - no authentication required)
// GET /api/advertisement/public/all
router.get('/public/all', advertisementController.getAdvertisementsAll)

// Get current partner's own advertisements (PROTECTED)
// GET /api/advertisement
router.get('/', isFoodPartnerLoggedin, advertisementController.getAllAdvertisements)

// Get advertisement by ID (optional)
// GET /api/advertisement/:id
router.get('/:id', advertisementController.getAdvertisementById)

// Update advertisement (optional)
// PUT /api/advertisement/:id
router.put('/:id', 
    isFoodPartnerLoggedin, 
    upload.single('file'), enforceMediaSize, 
    sanitizeMultipart,
    handleMulterError,
    advertisementController.updateAdvertisement
)

// Delete advertisement (optional)
// DELETE /api/advertisement/:id
router.delete('/:id', isFoodPartnerLoggedin, advertisementController.deleteAdvertisement)

export default router