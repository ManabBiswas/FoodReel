import express from "express";  
import emailControler from "../controllers/email.controller.js";

const router = express.Router();

// Custom email
router.post("/send", emailControler.sendEmailController);

// User emails
router.post("/welcome", emailControler.sendWelcomeEmailController);
router.post("/password-reset", emailControler.sendPasswordResetController);

// Order emails
router.post("/order-confirmation", emailControler.sendOrderConfirmationController);
router.post("/order-cancelled", emailControler.sendOrderCancelledController);
router.post("/order-shipped", emailControler.sendOrderShippedController);

// Partner emails
router.post("/partner-approved", emailControler.sendPartnerApprovedController);
router.post("/partner-rejected", emailControler.sendPartnerRejectedController);

// Contact email
router.post("/contact-response", emailControler.sendContactResponseController);

export default router;