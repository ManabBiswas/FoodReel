import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    foodItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "food",
        required: true
    },
    foodPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FoodPartner",
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        enum: ['INR'],
        default: 'INR'
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
        default: 'pending'
    },
    deliveryAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        PinCode: { type: String, required: true },
        country: { type: String, default: 'India' }
    },
    phoneNumber: {
        type: String,
        required: true
    },
    specialInstructions: {
        type: String
    },
    estimatedDeliveryTime: {
        type: Date
    },
    orderNotes: [{
        note: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        addedBy: { type: String, enum: ['user', 'partner', 'system'], default: 'system' }
    }],
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash_on_delivery', 'online_payment', 'wallet'],
        default: 'cash_on_delivery'
    }
}, { 
    timestamps: true 
});

// Add indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ foodPartner: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

// Calculate total amount before saving
orderSchema.pre('save', function(next) {
    this.totalAmount = this.price * this.quantity;
    next();
});

const orderModel = mongoose.model("Order", orderSchema);

export default orderModel;