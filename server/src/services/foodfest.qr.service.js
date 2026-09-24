import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import storageService from './storage.service.js';

const QR_SERVICE_SECRET = process.env.JWT_SECRET || 'foodfest-qr-secret';

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
        const uploadResponse = await storageService.uploadFile(buffer, `tickets/${Date.now()}.png`, 'image/png');
        
        if (!uploadResponse.success) {
            throw new Error(`Storage upload failed: ${uploadResponse.error}`);
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
