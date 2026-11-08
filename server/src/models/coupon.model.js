import mongoose from "mongoose";

/**
 * A promo code is money, not decoration.
 * Scope is deliberately one restaurant per code. A cart is already restricted to a single restaurant, 
 * so the match is exact and cannot be gamed by mixing items from two kitchens.
 */
const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        minlength: 5,
        maxlength: 32,
        match: [/^[A-Z0-9_-]+$/, 'Code may only contain letters, numbers, hyphens and underscores']
    },
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FoodPartner",
        required: true,
        index: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: 200,
        default: ""
    },
    discountType: {
        type: String,
        enum: ["percentage", "fixed"],
        required: true
    },
    // 20 = 20% for percentage, or ₹20 for fixed.
    discountValue: {
        type: Number,
        required: true,
        min: 0.01
    },
    // Optional cap for percentage codes (e.g. 20% off up to ₹150).
    maxDiscount: {
        type: Number,
        min: 0,
        default: null
    },
    minOrderAmount: {
        type: Number,
        min: 0,
        default: 0
    },
    // Empty = the code works on every item in the cart (legacy + whole-cart
    // ads). Non-empty = the discount, the minimum-order check and the minimum
    // quantity all count ONLY these items; anything else in the cart pays
    // full price. Never copy this by hand — it is set via the partner form.
    applicableItemIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "food"
    }],
    // Minimum eligible items (a count, not an amount). 1 = no quantity rule.
    minQuantity: {
        type: Number,
        min: 1,
        default: 1
    },
    // null = unlimited total redemptions.
    usageLimit: {
        type: Number,
        min: 1,
        default: null
    },
    usedCount: {
        type: Number,
        min: 0,
        default: 0
    },
    perUserLimit: {
        type: Number,
        min: 1,
        default: 1
    },
    validFrom: {
        type: Date,
        default: Date.now
    },
    // null = no expiry.
    validUntil: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: String,
        enum: ["partner", "admin", "system"],
        default: "partner"
    }
}, {
    timestamps: true
});

// Partner dashboard: "my codes, newest first".
couponSchema.index({ partnerId: 1, isActive: 1, createdAt: -1 });

couponSchema.methods.isWithinWindow = function (now = new Date()) {
    if (this.validFrom && now < this.validFrom) return false;
    if (this.validUntil && now > this.validUntil) return false;
    return true;
};

couponSchema.set('toJSON', { virtuals: true });
couponSchema.set('toObject', { virtuals: true });

const couponModel = mongoose.model("Coupon", couponSchema);

export default couponModel;
