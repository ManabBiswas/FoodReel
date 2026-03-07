import express from "express";  
import emailController from "../controllers/email.controller.js";

const router = express.Router();

// Custom email
router.post("/send", emailController.sendEmailController);

// User emails
router.post("/welcome", emailController.sendWelcomeEmailController);
router.post("/password-reset", emailController.sendPasswordResetController);

// Order emails
router.post("/order-confirmation", emailController.sendOrderConfirmationController);
router.post("/order-cancelled", emailController.sendOrderCancelledController);
router.post("/order-shipped", emailController.sendOrderShippedController);

// Partner emails
router.post("/partner-approved", emailController.sendPartnerApprovedController);
router.post("/partner-rejected", emailController.sendPartnerRejectedController);

// Contact email
router.post("/contact-response", emailController.sendContactResponseController);

export default router;