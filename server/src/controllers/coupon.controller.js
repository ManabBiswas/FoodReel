import couponModel from "../models/coupon.model.js";
import couponService from "../services/coupon.service.js";
import foodModel from "../models/food.model.js";
import { isObjectId } from "../utils/validate.js";

const CODE_PATTERN = /^[A-Z0-9_-]{5,32}$/;
const DISCOUNT_TYPES = ["percentage", "fixed"];
const MAX_SCOPED_ITEMS = 50;

const parsePositiveNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
};

// Item ownership guard: a coupon may only scope to items this partner owns, otherwise one kitchen could grant discounts off a rival's dishes
const ownershipError = async (ids, partnerId) => {
    if (!ids || ids.length === 0) return null;
    const owned = await foodModel
        .find({ _id: { $in: ids }, foodPartner: partnerId })
        .distinct("_id");
    return owned.length === ids.length
        ? null
        : "One or more selected items do not belong to your kitchen.";
};

const validateCouponPayload = (body, { partial = false } = {}) => { 
    const errors = [];

    if (!partial || body.code !== undefined) {
        const code = couponService.normalizeCode(body.code);
        if (!code) errors.push("Code is required");
        else if (!CODE_PATTERN.test(code)) {
            errors.push("Code must be 5-32 characters using letters, numbers, hyphens or underscores");
        }
    }

    if (!partial || body.discountType !== undefined) {
        if (!DISCOUNT_TYPES.includes(body.discountType)) {
            errors.push("discountType must be percentage or fixed");
        }
    }

    if (!partial || body.discountValue !== undefined) {
        const value = parsePositiveNumber(body.discountValue);
        if (value === null || value <= 0) {
            errors.push("discountValue must be greater than 0");
        } else if (body.discountType === "percentage" && value > 100) {
            errors.push("A percentage discount cannot exceed 100");
        }
    }

    if (body.maxDiscount !== undefined && body.maxDiscount !== null && body.maxDiscount !== "") {
        const cap = parsePositiveNumber(body.maxDiscount);
        if (cap === null || cap < 0) errors.push("maxDiscount must be a positive number");
    }

    if (body.minOrderAmount !== undefined && body.minOrderAmount !== null && body.minOrderAmount !== "") {
        const min = parsePositiveNumber(body.minOrderAmount);
        if (min === null || min < 0) errors.push("minOrderAmount must be a positive number");
    }

    if (body.minQuantity !== undefined && body.minQuantity !== null && body.minQuantity !== "") {
        const n = Number(body.minQuantity);
        if (!Number.isInteger(n) || n < 1 || n > 99) errors.push("minQuantity must be a whole number between 1 and 99");
    }

    if (body.applicableItemIds !== undefined) {
        const ids = body.applicableItemIds;
        if (!Array.isArray(ids) || ids.some((id) => !isObjectId(id)) || ids.length > MAX_SCOPED_ITEMS) {
            errors.push(`applicableItemIds must be an array of up to ${MAX_SCOPED_ITEMS} valid item ids`);
        }
    }

    for (const field of ["usageLimit", "perUserLimit"]) {
        if (body[field] !== undefined && body[field] !== null && body[field] !== "") {
            const n = Number(body[field]);
            if (!Number.isInteger(n) || n < 1) errors.push(`${field} must be a whole number of at least 1`);
        }
    }

    if (body.validUntil) {
        const until = new Date(body.validUntil);
        if (Number.isNaN(until.getTime())) errors.push("validUntil must be a valid date");
        else if (until <= new Date()) errors.push("validUntil must be in the future");
    }

    if (body.validFrom) {
        const from = new Date(body.validFrom);
        if (Number.isNaN(from.getTime())) errors.push("validFrom must be a valid date");
    }

    return errors;
};

export const createCoupon = async (req, res) => {
    try {
        const errors = validateCouponPayload(req.body || {});
        if (errors.length > 0) {
            return res.status(400).json({ success: false, error: errors[0], errors });
        }

        const code = couponService.normalizeCode(req.body.code);
        const existing = await couponModel.findOne({ code });
        if (existing) {
            return res.status(409).json({
                success: false,
                code: "COUPON_CODE_TAKEN",
                error: `Promo code ${code} is already in use.`
            });
        }

        const scopedIds = Array.isArray(req.body.applicableItemIds) ? [...new Set(req.body.applicableItemIds.map(String))] : [];
        const ownerError = await ownershipError(scopedIds, req.foodPartner._id);
        if (ownerError) {
            return res.status(400).json({ success: false, error: ownerError });
        }

        const coupon = await couponModel.create({
            code,
            partnerId: req.foodPartner._id,
            description: typeof req.body.description === "string" ? req.body.description.trim().slice(0, 200) : "",
            discountType: req.body.discountType,
            discountValue: Number(req.body.discountValue),
            maxDiscount: req.body.maxDiscount === undefined || req.body.maxDiscount === null || req.body.maxDiscount === ""
                ? null
                : Number(req.body.maxDiscount),
            minOrderAmount: req.body.minOrderAmount === undefined || req.body.minOrderAmount === null || req.body.minOrderAmount === ""
                ? 0
                : Number(req.body.minOrderAmount),
            applicableItemIds: scopedIds,
            minQuantity: req.body.minQuantity === undefined || req.body.minQuantity === null || req.body.minQuantity === ""
                ? 1
                : Number(req.body.minQuantity),
            usageLimit: req.body.usageLimit === undefined || req.body.usageLimit === null || req.body.usageLimit === ""
                ? null
                : Number(req.body.usageLimit),
            perUserLimit: req.body.perUserLimit === undefined || req.body.perUserLimit === null || req.body.perUserLimit === ""
                ? 1
                : Number(req.body.perUserLimit),
            validFrom: req.body.validFrom ? new Date(req.body.validFrom) : new Date(),
            validUntil: req.body.validUntil ? new Date(req.body.validUntil) : null,
            isActive: req.body.isActive !== false,
            createdBy: "partner"
        });

        res.status(201).json({
            success: true,
            message: `Promo code ${coupon.code} created`,
            coupon
        });
    } catch (error) {
        console.error("Create coupon error:", error);
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                code: "COUPON_CODE_TAKEN",
                error: "That promo code is already in use."
            });
        }
        res.status(500).json({ success: false, error: "Failed to create promo code" });
    }
};

export const getPartnerCoupons = async (req, res) => {
    try {
        const coupons = await couponModel
            .find({ partnerId: req.foodPartner._id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: coupons.length,
            coupons
        });
    } catch (error) {
        console.error("Get partner coupons error:", error);
        res.status(500).json({ success: false, error: "Failed to load promo codes" });
    }
};

export const getPartnerCouponStats = async (req, res) => {
    try {
        const coupons = await couponService.getPartnerStats(req.foodPartner._id);
        res.status(200).json({ success: true, coupons });
    } catch (error) {
        console.error("Get partner coupon stats error:", error);
        res.status(500).json({ success: false, error: "Failed to load promo code statistics" });
    }
};

export const updateCoupon = async (req, res) => {
    try {
        const coupon = await couponModel.findById(req.params.couponId);
        if (!coupon) {
            return res.status(404).json({ success: false, error: "Promo code not found" });
        }
        if (String(coupon.partnerId) !== String(req.foodPartner._id)) {
            return res.status(403).json({ success: false, error: "You can only edit your own promo codes" });
        }

        const errors = validateCouponPayload(req.body || {}, { partial: true });
        if (errors.length > 0) {
            return res.status(400).json({ success: false, error: errors[0], errors });
        }

        if (req.body.code !== undefined) {
            const code = couponService.normalizeCode(req.body.code);
            const duplicate = await couponModel.findOne({ code, _id: { $ne: coupon._id } });
            if (duplicate) {
                return res.status(409).json({
                    success: false,
                    code: "COUPON_CODE_TAKEN",
                    error: `Promo code ${code} is already in use.`
                });
            }
            coupon.code = code;
        }

        if (req.body.description !== undefined) {
            coupon.description = typeof req.body.description === "string"
                ? req.body.description.trim().slice(0, 200)
                : "";
        }
        if (req.body.discountType !== undefined) coupon.discountType = req.body.discountType;
        if (req.body.discountValue !== undefined) coupon.discountValue = Number(req.body.discountValue);
        if (req.body.maxDiscount !== undefined) {
            coupon.maxDiscount = req.body.maxDiscount === null || req.body.maxDiscount === ""
                ? null
                : Number(req.body.maxDiscount);
        }
        if (req.body.minOrderAmount !== undefined) {
            coupon.minOrderAmount = req.body.minOrderAmount === null || req.body.minOrderAmount === ""
                ? 0
                : Number(req.body.minOrderAmount);
        }
        if (req.body.minQuantity !== undefined) {
            coupon.minQuantity = req.body.minQuantity === null || req.body.minQuantity === ""
                ? 1
                : Number(req.body.minQuantity);
        }
        if (req.body.applicableItemIds !== undefined) {
            const scopedIds = [...new Set((req.body.applicableItemIds || []).map(String))];
            const ownerError = await ownershipError(scopedIds, req.foodPartner._id);
            if (ownerError) {
                return res.status(400).json({ success: false, error: ownerError });
            }
            coupon.applicableItemIds = scopedIds;
        }
        if (req.body.usageLimit !== undefined) {
            coupon.usageLimit = req.body.usageLimit === null || req.body.usageLimit === ""
                ? null
                : Number(req.body.usageLimit);
        }
        if (req.body.perUserLimit !== undefined) coupon.perUserLimit = Number(req.body.perUserLimit);
        if (req.body.validFrom !== undefined) {
            coupon.validFrom = req.body.validFrom ? new Date(req.body.validFrom) : new Date();
        }
        if (req.body.validUntil !== undefined) {
            coupon.validUntil = req.body.validUntil ? new Date(req.body.validUntil) : null;
        }
        if (req.body.isActive !== undefined) coupon.isActive = Boolean(req.body.isActive);

        await coupon.save();

        res.status(200).json({
            success: true,
            message: `Promo code ${coupon.code} updated`,
            coupon
        });
    } catch (error) {
        console.error("Update coupon error:", error);
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                code: "COUPON_CODE_TAKEN",
                error: "That promo code is already in use."
            });
        }
        res.status(500).json({ success: false, error: "Failed to update promo code" });
    }
};

export const deleteCoupon = async (req, res) => {
    try {
        const coupon = await couponModel.findById(req.params.couponId);
        if (!coupon) {
            return res.status(404).json({ success: false, error: "Promo code not found" });
        }
        if (String(coupon.partnerId) !== String(req.foodPartner._id)) {
            return res.status(403).json({ success: false, error: "You can only delete your own promo codes" });
        }

        // Soft-delete: redemptions on past orders must stay auditable.
        coupon.isActive = false;
        await coupon.save();

        res.status(200).json({
            success: true,
            message: `Promo code ${coupon.code} deactivated`,
            coupon
        });
    } catch (error) {
        console.error("Delete coupon error:", error);
        res.status(500).json({ success: false, error: "Failed to deactivate promo code" });
    }
};

export default {
    createCoupon,
    getPartnerCoupons,
    getPartnerCouponStats,
    updateCoupon,
    deleteCoupon
};
