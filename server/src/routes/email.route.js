import express from "express";  
import emailController from "../controllers/email.controller.js";
import isAdmin from "../middlewares/isAdmin.js";

const router = express.Router();

// Email endpoints are admin-only: legitimate transactional emails are sent directly from controllers via emailService — these HTTP endpoints must never be open (they previously allowed anyone to send arbitrary mail).

router.use(isAdmin);

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