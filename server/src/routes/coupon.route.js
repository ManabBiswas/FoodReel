import express from "express";
import couponController from "../controllers/coupon.controller.js";
import isFoodPartnerLoggedin from "../middlewares/isFoodPartnerLoggedin.js";
import { validateParams, isObjectId } from "../utils/validate.js";

const router = express.Router();

const couponIdParams = validateParams({
    couponId: { check: isObjectId, message: "couponId must be a valid id" }
});

// Partner-issued promo codes
// Redemption itself lives under /api/cart so the cart is always the thing being priced
router.post("/", isFoodPartnerLoggedin, couponController.createCoupon);
router.get("/partner", isFoodPartnerLoggedin, couponController.getPartnerCoupons);
router.get("/partner/stats", isFoodPartnerLoggedin, couponController.getPartnerCouponStats);
router.put("/:couponId", isFoodPartnerLoggedin, couponIdParams, couponController.updateCoupon);
router.delete("/:couponId", isFoodPartnerLoggedin, couponIdParams, couponController.deleteCoupon);

export default router;
