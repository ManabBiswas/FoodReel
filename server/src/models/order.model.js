import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
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
            min: 1
        },
        priceAtOrder: {
            type: Number,
            required: true
        },
        foodPartner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FoodPartner",
            required: true
        },
    }],
    currency: {
        type: String,
        enum: ['INR'],
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
        default: 'pending'
    },
    statusTimestamps: {
        confirmedAt: Date,
        preparingAt: Date,
        readyAt: Date,
        deliveredAt: Date,
        cancelledAt: Date
    },
    orderSource: {
        type: String,
        enum: ['reel', 'home', 'menu', 'search', 'cart', 'other'],
        default: 'reel',
        required: true
    },
    // CONSOLIDATED PAYMENT INFORMATION (removed duplicates)
    paymentDetails: {
        method: {
            type: String,
            enum: ['razorpay', 'cod'],
            required: true
        },
        razorpayOrderId: String,
        razorpayPaymentId: String,
        razorpaySignature: String,
        transactionId: String,
        paidAt: Date,
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
            default: 'pending'
        }
    },
    deliveryAddress: {
        fullName: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            match: /^(0?[6-9]\d{9})$/,
            required: true
        },
        addressLine1: {
            type: String,
            required: true
        },
        addressLine2: String,
        landmark: String,
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        pincode: {
            type: String,
            match: /^\d{6}$/,
            required: true
        },
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    // CONSOLIDATED PRICING (this is the single source of truth)
    pricing: {
        itemPrice: {
            type: Number,
            required: true,
            min: 0
        },
        deliveryFee: {
            type: Number,
            default: 0,
            min: 0
        },
        platformFee: {
            type: Number,
            default: 0,
            min: 0
        },
        taxes: {
            gst: {
                type: Number,
                default: 0
            },
            total: {
                type: Number,
                default: 0
            }
        },
        discount: {
            type: Number,
            default: 0,
            min: 0
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        }
    },
    specialInstructions: {
        type: String
    },
    estimatedDeliveryTime: {
        type: Date
    },
    orderNotes: [{
        note: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        addedBy: {
            type: String,
            enum: ['user', 'partner', 'system'],
            default: 'system'
        }
    }],
    cancellation: {
        isCancelled: {
            type: Boolean,
            default: false
        },
        cancelledBy: {
            type: String,
            enum: ['user', 'partner', 'admin'],
        },
        cancelledAt: Date,
        reason: String,
        refundStatus: {
            type: String,
            enum: ['not_applicable', 'pending', 'processing', 'completed'],
            default: 'not_applicable'
        },
        refundAmount: Number
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ 'items.foodPartner': 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'paymentDetails.status': 1 });
orderSchema.index({ 'paymentDetails.razorpayOrderId': 1 }, { unique: true, sparse: true });

// Calculate pricing before saving
orderSchema.pre('save', function (next) {
    if (this.pricing && this.isModified('pricing')) {
        const { itemPrice, deliveryFee, platformFee, taxes, discount } = this.pricing;

        // Auto-calculate total amount
        this.pricing.totalAmount = Math.max(
            itemPrice + deliveryFee + platformFee + (taxes?.total || 0) - (discount || 0),
            0
        );
    }
    next();
});

// Virtual fields - only keep necessary ones
orderSchema.set('toJSON', { virtuals: true, getters: true });
orderSchema.set('toObject', { virtuals: true, getters: true });

const orderModel = mongoose.model("Order", orderSchema);

export default orderModel;