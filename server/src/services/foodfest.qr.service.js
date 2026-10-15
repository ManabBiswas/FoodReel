import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import storageService from './storage.service.js';

// JWT_SECRET is validated at boot (server.js). Deliberately NO hardcoded
// fallback: a known literal would let anyone forge entry QR tokens offline.
const QR_SERVICE_SECRET = process.env.JWT_SECRET;

export const generateQRToken = (ticketId, eventId, eventEndTime) => {
    // Token bound to event end time
    return jwt.sign(
        { ticketId, eventId },
        QR_SERVICE_SECRET,
        { expiresIn: Math.floor((new Date(eventEndTime).getTime() - Date.now()) / 1000) }
    );
};

export const verifyQRToken = (token) => {
    try {
        return jwt.verify(token, QR_SERVICE_SECRET);
    } catch (error) {
        return null;
    }
};

export const createQRImage = async (token) => {
    try {
        // Generate QR as DataURL
        const dataUrl = await QRCode.toDataURL(token);
        
        // Convert DataURL to Buffer for storageService
        const base64Data = dataUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Upload to ImageKit via existing storageService
        const fileName = `tickets/${Date.now()}.png`;
        const uploadResponse = await storageService.uploadFile(buffer, fileName, 'image/png');

        if (!uploadResponse?.url) {
            throw new Error(`Storage upload failed: no URL returned for ${fileName}`);
        }

        return uploadResponse.url;
    } catch (error) {
        console.error("QR Image Generation Error:", error);
        throw error;
    }
};

export default {
    generateQRToken,
    verifyQRToken,
    createQRImage
};
