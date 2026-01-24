import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true // One cart per user
    },
    items: [{
        foodItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "food",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        // Store current price to detect price changes
        priceAtAdd: {
            type: Number,
            required: true
        },
        // Store food partner to enforce single-restaurant rule
        foodPartner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FoodPartner",
            required: true
        },
        // Optional: Store customizations/add-ons
        customizations: {
            type: Map,
            of: String
        },
        specialInstructions: {
            type: String,
            maxLength: 200
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Cart metadata
    lastModified: {
        type: Date,
        default: Date.now
    },
    // Optional: Store which restaurant the cart is for (enforce single restaurant)
    activeRestaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FoodPartner"
    },
    // Cart totals (calculated on backend)
    totals: {
        itemsTotal: {
            type: Number,
            default: 0
        },
        deliveryFee: {
            type: Number,
            default: 0
        },
        platformFee: {
            type: Number,
            default: 0
        },
        taxes: {
            type: Number,
            default: 0
        },
        discount: {
            type: Number,
            default: 0
        },
        grandTotal: {
            type: Number,
            default: 0
        }
    },
    // Applied coupon/promo code
    appliedPromo: {
        code: String,
        discountAmount: Number,
        discountType: {
            type: String,
            enum: ['percentage', 'fixed']
        }
    }
}, {
    timestamps: true
});

// Indexes for performance
cartSchema.index({ 'items.foodItem': 1 });
cartSchema.index({ lastModified: 1 }); // For cleanup of old carts

// Update lastModified on any change
cartSchema.pre('save', function(next) {
    this.lastModified = new Date();
    next();
});

// Virtual to get total items count
cartSchema.virtual('itemCount').get(function() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

const cartModel = mongoose.model("Cart", cartSchema);

export default cartModel;