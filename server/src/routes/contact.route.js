import express from "express";
import { submitContactMessage } from "../controllers/contact.controller.js";
import { contactRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/", contactRateLimiter, submitContactMessage);

export default router;
