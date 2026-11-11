import couponModel from "../models/coupon.model.js";
import orderModel from "../models/order.model.js";

/**
 * Coupon rules live here and nowhere else.
 */

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const fail = (code, message, extra = {}) => ({
    ok: false,
    code,
    message,
    ...extra
});

export const normalizeCode = (code) =>
    typeof code === "string" ? code.trim().toUpperCase() : "";

// One definition of a valid code, shared by partner forms, ad sync and
// redemption. Short codes are trivially guessable, so five is the floor.
export const MIN_CODE_LENGTH = 5;
export const MAX_CODE_LENGTH = 32;
const CODE_PATTERN = /^[A-Z0-9_-]+$/;

export const isValidCode = (code) => {
    const normalized = normalizeCode(code);
    return normalized.length >= MIN_CODE_LENGTH &&
        normalized.length <= MAX_CODE_LENGTH &&
        CODE_PATTERN.test(normalized);
};

export const computeDiscount = (coupon, itemsTotal) => {
    const subtotal = round2(itemsTotal);
    if (!coupon || subtotal <= 0) return 0;

    let discount;
    if (coupon.discountType === "percentage") {
        discount = subtotal * (Number(coupon.discountValue) / 100);
        const cap = Number(coupon.maxDiscount);
        if (Number.isFinite(cap) && cap > 0) {
            discount = Math.min(discount, cap);
        }
    } else {
        discount = Number(coupon.discountValue) || 0;
    }

    // A discount can never exceed the items subtotal. Fees and tax stay
    // payable, and the pricing formula clamps again as defence-in-depth.
    return Math.max(0, Math.min(round2(discount), subtotal));
};

/**
 * Which part of a cart/order this coupon can actually touch.
 *
 * A whole-cart code (no applicableItemIds) is eligible on everything. A
 * scoped code is eligible only on its items: every rule below — discount,
 * minimum amount, minimum quantity — counts ONLY the eligible portion, so a
 * ₹200 ineligible item can never smuggle a scoped ₹50-off code past a ₹150
 * minimum.
 *
 * @param {object} coupon
 * @param {Array<{foodItemId|foodItem?: any, quantity?: number, price?: number, priceAtAdd?: number, priceAtOrder?: number}>} items
 */
export const getEligibleSummary = (coupon, items) => {
    const list = Array.isArray(items) ? items : [];
    const scopedIds = (coupon?.applicableItemIds || []).map(String);
    const scoped = scopedIds.length > 0;
    const idSet = new Set(scopedIds);

    let eligibleTotal = 0;
    let eligibleQuantity = 0;
    let eligibleItems = 0;
    let ineligibleItems = 0;
    let cartTotal = 0;
    let cartQuantity = 0;

    for (const item of list) {
        const rawId = item?.foodItemId ?? item?.foodItem?._id ?? item?.foodItem ?? "";
        const qty = Math.max(0, Number(item?.quantity) || 0);
        const price = Math.max(0, Number(item?.price ?? item?.priceAtAdd ?? item?.priceAtOrder) || 0);
        const lineTotal = price * qty;
        cartTotal += lineTotal;
        cartQuantity += qty;
        if (!scoped || idSet.has(String(rawId))) {
            eligibleTotal += lineTotal;
            eligibleQuantity += qty;
            eligibleItems += 1;
        } else {
            ineligibleItems += 1;
        }
    }

    return {
        scoped,
        eligibleTotal: round2(eligibleTotal),
        eligibleQuantity,
        eligibleItems,
        ineligibleItems,
        cartTotal: round2(cartTotal),
        cartQuantity
    };
};

/**
 * Validate a code against a specific cart/order context.
 *
 * Pass `items` ([{ foodItemId, quantity, price }]) so item-scoped codes can be
 * judged. `itemsTotal` is accepted for whole-cart callers/tests; a scoped code
 * without item context cannot prove anything is eligible, so it fails closed.
 *
 * @returns {{ok: true, coupon, discountAmount, eligibleTotal, eligibleQuantity, scoped} | {ok: false, code, message}}
 */
export const validateCoupon = async ({
    code,
    userId,
    partnerId,
    items,
    itemsTotal,
    checkUserLimit = true
}) => {
    const normalized = normalizeCode(code);
    if (!normalized) {
        return fail("COUPON_REQUIRED", "Enter a promo code.");
    }
    if (!isValidCode(normalized)) {
        return fail("COUPON_INVALID", "Enter a valid promo code.");
    }

    const coupon = await couponModel.findOne({ code: normalized });
    if (!coupon) {
        return fail("COUPON_NOT_FOUND", "That promo code does not exist.");
    }

    if (!coupon.isActive) {
        return fail("COUPON_INACTIVE", "This promo code is no longer active.");
    }

    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
        return fail("COUPON_NOT_STARTED", "This promo code is not active yet.");
    }
    if (coupon.validUntil && now > coupon.validUntil) {
        return fail("COUPON_EXPIRED", "This promo code has expired.");
    }

    if (!partnerId || String(coupon.partnerId) !== String(partnerId)) {
        return fail(
            "COUPON_WRONG_RESTAURANT",
            "This promo code is not valid for the restaurant in your cart."
        );
    }

    const summary = items
        ? getEligibleSummary(coupon, items)
        : getEligibleSummary(coupon, [
            { quantity: 1, price: itemsTotal }
        ]);

    // Item-scoped codes need the cart to contain at least one of their items.
    if (summary.scoped && (!items || summary.eligibleItems === 0)) {
        return fail(
            "COUPON_NO_ELIGIBLE_ITEMS",
            "This promo code doesn't apply to the items in your cart."
        );
    }

    // Minimum quantity counts eligible items only ("buy 2 of the eligible
    // items"), never the whole cart.
    const minQuantity = Number(coupon.minQuantity) || 1;
    if (summary.eligibleQuantity < minQuantity) {
        return fail(
            "COUPON_BELOW_QUANTITY",
            `Add ${minQuantity - summary.eligibleQuantity} more eligible item${minQuantity - summary.eligibleQuantity > 1 ? "s" : ""} to use this code (minimum ${minQuantity} item${minQuantity > 1 ? "s" : ""}).`,
            { minQuantity, eligibleQuantity: summary.eligibleQuantity }
        );
    }

    // Minimum amount is measured against the eligible portion only, so
    // ineligible items can never push a scoped code over its threshold.
    if (summary.eligibleTotal < (Number(coupon.minOrderAmount) || 0)) {
        const shortfall = round2((Number(coupon.minOrderAmount) || 0) - summary.eligibleTotal);
        return fail(
            "COUPON_BELOW_MINIMUM",
            `Add ₹${shortfall} more to the eligible items to use this code (minimum ₹${round2(coupon.minOrderAmount)}).`,
            {
                minOrderAmount: round2(coupon.minOrderAmount),
                eligibleTotal: summary.eligibleTotal
            }
        );
    }

    if (coupon.usageLimit !== null && coupon.usageLimit !== undefined &&
        Number(coupon.usedCount) >= Number(coupon.usageLimit)) {
        return fail("COUPON_LIMIT_REACHED", "This promo code has reached its usage limit.");
    }

    if (checkUserLimit && userId) {
        const priorUses = await orderModel.countDocuments({
            user: userId,
            "coupon.couponId": coupon._id,
            "coupon.consumedAt": { $exists: true },
            status: { $ne: "cancelled" }
        });
        const perUserLimit = Number(coupon.perUserLimit) || 1;
        if (priorUses >= perUserLimit) {
            return fail(
                "COUPON_USER_LIMIT_REACHED",
                "You have already used this promo code."
            );
        }
    }

    const discountAmount = computeDiscount(coupon, summary.eligibleTotal);
    if (discountAmount <= 0) {
        return fail("COUPON_NO_DISCOUNT", "This promo code does not reduce this order.");
    }

    return {
        ok: true,
        coupon,
        discountAmount,
        eligibleTotal: summary.eligibleTotal,
        eligibleQuantity: summary.eligibleQuantity,
        ineligibleItems: summary.ineligibleItems,
        scoped: summary.scoped
    };
};

/**
 * Re-resolve the coupon already attached to a cart. Called on every cart
 * mutation, so an edit that removes the eligible item (or drops the
 * subtotal/quantity below the rule) removes the discount instead of silently
 * lying in the summary.
 */
export const resolveCartDiscount = async (cart) => {
    const code = cart?.appliedPromo?.code;
    if (!code) {
        return { ok: false, hasCoupon: false, discount: 0 };
    }

    const userId = cart.user?._id || cart.user;
    const partnerId = cart.activeRestaurant?._id || cart.activeRestaurant;
    const items = (cart.items || []).map((item) => ({
        foodItemId: item.foodItem?._id || item.foodItem,
        quantity: item.quantity,
        price: item.priceAtAdd
    }));

    const result = await validateCoupon({
        code,
        userId,
        partnerId,
        items
    });

    if (!result.ok) {
        return {
            ok: false,
            hasCoupon: true,
            discount: 0,
            code: result.code,
            message: result.message
        };
    }

    cart.appliedPromo.couponId = result.coupon._id;
    cart.appliedPromo.code = result.coupon.code;
    cart.appliedPromo.discountType = result.coupon.discountType;
    cart.appliedPromo.discountAmount = result.discountAmount;
    cart.appliedPromo.eligibleTotal = result.eligibleTotal;
    cart.appliedPromo.eligibleQuantity = result.eligibleQuantity;

    return {
        ok: true,
        hasCoupon: true,
        discount: result.discountAmount,
        eligibleTotal: result.eligibleTotal,
        eligibleQuantity: result.eligibleQuantity,
        ineligibleItems: result.ineligibleItems,
        scoped: result.scoped,
        coupon: result.coupon
    };
};

/**
 * Claim one redemption for a paid order.
 *
 * The order document is claimed first (`consumedAt`), which makes this
 * idempotent across the direct verify call and the asynchronous webhook. The
 * coupon's `usedCount` is then incremented under a conditional update, so two
 * racing orders cannot push a limited code past its cap.
 */
export const consumeCoupon = async (order) => {
    const couponId = order?.coupon?.couponId;
    if (!couponId) return { ok: true, skipped: true };

    let claimed;
    try {
        claimed = await orderModel.findOneAndUpdate(
            {
                _id: order._id,
                "coupon.couponId": couponId,
                "coupon.consumedAt": { $exists: false }
            },
            { $set: { "coupon.consumedAt": new Date() } },
            { new: true }
        );
    } catch (err) {
        // Defensive: a unique index on { coupon.couponId, user } (if one is ever added) rejected the claim — the per-user limit was reached.
        if (err?.code === 11000) {
            return { ok: false, code: "COUPON_USER_LIMIT_REACHED", honoured: false };
        }
        throw err;
    }

    if (!claimed) {
        return { ok: true, alreadyConsumed: true };
    }

    const coupon = await couponModel.findById(couponId);
    if (!coupon) {
        await orderModel.updateOne(
            { _id: order._id },
            { $unset: { "coupon.consumedAt": "" } }
        );
        return fail("COUPON_NOT_FOUND", "The promo code no longer exists.");
    }

    // Per-user guard at redemption time. Validation already checked this, but
    // a second unpaid order created before the first was paid can slip past it.
    const userId = order.user?._id || order.user;
    const perUserLimit = Number(coupon.perUserLimit) || 1;
    if (userId && perUserLimit > 0) {
        // Count only redemptions claimed strictly BEFORE this one, ordering claims by (consumedAt, _id). Concurrent checkouts each see the ones ahead of them, so exactly the first `perUserLimit` claims win even when two land in the same millisecond.
        const claimedAt = claimed.coupon.consumedAt;
        const priorUses = await orderModel.countDocuments({
            _id: { $ne: order._id },
            user: userId,
            "coupon.couponId": couponId,
            status: { $ne: "cancelled" },
            $or: [
                { "coupon.consumedAt": { $lt: claimedAt } },
                { "coupon.consumedAt": claimedAt, _id: { $lt: order._id } },
            ],
        });
        if (priorUses >= perUserLimit) {
            await orderModel.updateOne(
                { _id: order._id },
                {
                    $unset: { "coupon.consumedAt": "" },
                    $push: {
                        orderNotes: {
                            note: `Promo code ${order.coupon.code} exceeded the per-customer limit at payment time. The discount was honoured and usage was not counted.`,
                            addedBy: "system"
                        }
                    }
                }
            );
            return { ok: false, code: "COUPON_USER_LIMIT_REACHED", honoured: true };
        }
    }

    const updated = await couponModel.findOneAndUpdate(
        {
            _id: couponId,
            isActive: true,
            $or: [
                { usageLimit: null },
                { $expr: { $lt: ["$usedCount", "$usageLimit"] } }
            ]
        },
        { $inc: { usedCount: 1 } },
        { new: true }
    );

    if (!updated) {
        // The customer has already been charged the discounted amount, so the
        // payment must not fail. Record the over-redemption instead of hiding it.
        await orderModel.updateOne(
            { _id: order._id },
            {
                $unset: { "coupon.consumedAt": "" },
                $push: {
                    orderNotes: {
                        note: `Promo code ${order.coupon.code} reached its usage limit before payment completed. The discount was honoured and usage was not counted.`,
                        addedBy: "system"
                    }
                }
            }
        );
        return { ok: false, code: "COUPON_LIMIT_REACHED", honoured: true };
    }

    return { ok: true, coupon: updated };
};

/**
 * Return one redemption when an order is cancelled. Safe to call repeatedly:
 * `releasedAt` on the order makes the release idempotent.
 */
export const releaseCoupon = async (order) => {
    const couponId = order?.coupon?.couponId;
    if (!couponId) return { ok: true, skipped: true };

    const released = await orderModel.findOneAndUpdate(
        {
            _id: order._id,
            "coupon.couponId": couponId,
            "coupon.consumedAt": { $exists: true },
            "coupon.releasedAt": { $exists: false }
        },
        { $set: { "coupon.releasedAt": new Date() } },
        { new: true }
    );

    if (!released) {
        return { ok: true, alreadyReleased: true };
    }

    await couponModel.updateOne(
        { _id: couponId, usedCount: { $gt: 0 } },
        { $inc: { usedCount: -1 } }
    );

    return { ok: true };
};

/**
 * Does another restaurant already own this code? Used before a partner uploads
 * a new advertisement so a conflict is a clean 409, not a half-saved post.
 */
export const findCodeConflict = async (code, partnerId) => {
    const normalized = normalizeCode(code);
    if (!normalized) return null;
    const existing = await couponModel.findOne({ code: normalized }).select("partnerId code").lean();
    if (!existing) return null;
    if (String(existing.partnerId) === String(partnerId)) return null;
    return existing;
};

/**
 * Keep the Coupon collection in step with a partner-facing advertisement.
 *
 * The ad still displays `promoCode` (that is the marketing sticker). This
 * helper turns it into a real, redeemable fixed-amount coupon derived from the
 * advertised original/discounted prices. Returns a typed failure when no
 * discount can be derived, so the caller can warn instead of pretending.
 */
export const syncCouponForPromotion = async ({
    existingCouponId = null,
    code,
    partnerId,
    prices,
    validUntil,
    description,
    createdBy = "system"
}) => {
    const normalized = normalizeCode(code);

    const deactivateExisting = async () => {
        if (!existingCouponId) return;
        await couponModel.updateOne(
            { _id: existingCouponId, partnerId },
            { $set: { isActive: false } }
        );
    };

    if (!normalized) {
        await deactivateExisting();
        return { ok: true, coupon: null };
    }

    if (!isValidCode(normalized)) {
        return fail(
            "COUPON_INVALID_CODE",
            "Promo codes must be 5-32 characters using letters, numbers, hyphens or underscores."
        );
    }

    const original = Number(prices?.original);
    const discounted = Number(prices?.discounted);
    const discountValue = round2(original - discounted);

    if (!Number.isFinite(original) || !Number.isFinite(discounted) ||
        original <= 0 || discounted < 0 || discountValue <= 0) {
        await deactivateExisting();
        return fail(
            "COUPON_NO_DISCOUNT",
            "A promo code needs an original price and a lower discounted price so the discount can be honoured."
        );
    }

    const owner = await couponModel.findOne({ code: normalized });
    if (owner && String(owner.partnerId) !== String(partnerId)) {
        return fail("COUPON_CODE_TAKEN", `Promo code ${normalized} is already used by another restaurant.`);
    }

    let coupon = owner;
    if (coupon) {
        coupon.discountType = "fixed";
        coupon.discountValue = discountValue;
        coupon.validUntil = validUntil ? new Date(validUntil) : null;
        coupon.isActive = true;
        if (description) coupon.description = String(description).slice(0, 200);
        await coupon.save();
    } else {
        coupon = await couponModel.create({
            code: normalized,
            partnerId,
            description: description ? String(description).slice(0, 200) : "",
            discountType: "fixed",
            discountValue,
            validUntil: validUntil ? new Date(validUntil) : null,
            createdBy
        });
    }

    if (existingCouponId && String(existingCouponId) !== String(coupon._id)) {
        await deactivateExisting();
    }

    return { ok: true, coupon };
};

/**
 * Partner dashboard: each code plus what it actually cost.
 */
export const getPartnerStats = async (partnerId) => {
    const coupons = await couponModel
        .find({ partnerId })
        .sort({ createdAt: -1 })
        .lean();

    if (coupons.length === 0) return [];

    const usage = await orderModel.aggregate([
        {
            $match: {
                "coupon.couponId": { $in: coupons.map((c) => c._id) },
                "coupon.consumedAt": { $exists: true },
                status: { $ne: "cancelled" }
            }
        },
        {
            $group: {
                _id: "$coupon.couponId",
                orders: { $sum: 1 },
                discountGiven: { $sum: "$coupon.discountAmount" },
                revenue: { $sum: "$pricing.totalAmount" }
            }
        }
    ]);

    const byId = new Map(usage.map((row) => [String(row._id), row]));

    return coupons.map((coupon) => {
        const stats = byId.get(String(coupon._id));
        return {
            ...coupon,
            stats: {
                orders: stats?.orders || 0,
                discountGiven: round2(stats?.discountGiven || 0),
                revenue: round2(stats?.revenue || 0)
            }
        };
    });
};

export default {
    normalizeCode,
    isValidCode,
    MIN_CODE_LENGTH,
    MAX_CODE_LENGTH,
    computeDiscount,
    getEligibleSummary,
    validateCoupon,
    resolveCartDiscount,
    consumeCoupon,
    releaseCoupon,
    findCodeConflict,
    syncCouponForPromotion,
    getPartnerStats
};
