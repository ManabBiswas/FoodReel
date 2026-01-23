import Razorpay from 'razorpay';
import crypto from 'crypto';

class PaymentService {
    constructor() {
        this.razorpay = null; // initialized lazily
    }

    _ensureClient() {
        if (this.razorpay) return this.razorpay;
        const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
        if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
            throw new Error('Missing Razorpay credentials. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.');
        }
        this.razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
        return this.razorpay;
    }

    async createOrder(amount, currency = 'INR', receipt, notes = {}) {
        try {
            if (typeof amount !== 'number' || !amount || amount <= 0) {
                throw new Error('Invalid amount');
            }
            // options for creating order that means creating checkout form
            const options = {
                //amount: amount * 100, // amount in paise
                amount: Math.round(amount * 100),  // amount in paise but rounding off
                currency,
                receipt,
                notes,
                payment_capture: 1 // auto capture by default because it's a one-time payment so user 
            };
            const razorpay = this._ensureClient();
            const order = await razorpay.orders.create(options);
            return {
                success: true,
                order_id: order.id,
                amount: order.amount,
                receipt: order.receipt,
                currency: order.currency,
                created_at: order.created_at,
                notes: order.notes,
                status: order.status
            }; // return the created order
        } catch (error) {
            console.error('Error creating Razorpay order:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    verifyPaymentSignature(orderId, paymentId, signature) {
        try {
            if (!orderId || !paymentId || !signature) {
                console.error('Missing required parameters for signature verification');
                return false;
            }
            const text = `${orderId}|${paymentId}`;  // Concatenate orderId and paymentId
            const generatedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(text)
                .digest('hex');

            const isValid = generatedSignature === signature;

            if (!isValid) {
                console.error('Payment signature verification failed');
            }

            return isValid;
        } catch (error) {
            console.error('Signature verification error:', error);
            return false;
        }
    }

    async getPaymentDetails(paymentId) {
        try {
            const razorpay = this._ensureClient();
            const payment = await razorpay.payments.fetch(paymentId);
            return {
                success: true,
                payment
            };
        } catch (error) {
            console.error('Error fetching payment:', error);
            throw new Error('Failed to fetch payment details');
        }
    }
    async refundPayment(paymentId, amount = null, notes = {}) {
        try {
            const refundOptions = { notes };
            if (amount) {
                refundOptions.amount = Math.round(amount * 100);
            }

            const razorpay = this._ensureClient();
            const refund = await razorpay.payments.refund(paymentId, refundOptions);
            return {
                success: true,
                refund
            };
        } catch (error) {
            console.error('Refund error:', error);
            throw new Error('Failed to process refund');
        }
    }

    verifyWebhookSignature(webhookBody, webhookSignature) {
        try {
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
                .update(JSON.stringify(webhookBody))
                .digest('hex');

            return expectedSignature === webhookSignature;
        } catch (error) {
            console.error('Webhook verification error:', error);
            return false;
        }
    }

    calculatePricing(itemPrice, quantity = 1, deliveryDistance = 0, discount = 0) {
        const basePrice = Math.round(itemPrice * quantity * 100) / 100;

        let deliveryFee = 0;
        if (deliveryDistance < 2) deliveryFee = 0;
        else if (deliveryDistance < 5) deliveryFee = 20;
        else if (deliveryDistance < 10) deliveryFee = 40;
        else deliveryFee = 60;

        const platformFee = Math.round(basePrice * 0.03 * 100) / 100;
        const subtotal = basePrice + deliveryFee + platformFee;
        const gst = Math.round(subtotal * 0.05 * 100) / 100;
        const totalAmount = Math.round((subtotal + gst - discount) * 100) / 100;

        return {
            itemPrice: basePrice,
            deliveryFee,
            platformFee,
            taxes: { gst, total: gst },
            discount,
            totalAmount
        };
    }

    getKeyId() {
        return process.env.RAZORPAY_KEY_ID;
    }
}

export default new PaymentService();