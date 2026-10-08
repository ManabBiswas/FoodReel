/**
 * Whether a stored gateway order may be handed back for a retried checkout.
 */

/** How long a gateway order stays reusable for a retried checkout. */
export const GATEWAY_ORDER_REUSE_WINDOW_MS = 30 * 60 * 1000; // 30 minutes because that's industry follows 

/**
 * @param {object} order
 * @returns {boolean} true when the existing gateway order is still good to reuse
 */
export const isGatewayOrderReusable = (order) => {
    const details = order?.paymentDetails;
    if (!details || typeof details !== 'object') return false;

    const { razorpayOrderId, status, razorpayOrderCreatedAt } = details;
    if (!razorpayOrderId || status !== 'processing') return false;
    if (!razorpayOrderCreatedAt) return false;

    const createdAt = new Date(razorpayOrderCreatedAt).getTime();
    if (!Number.isFinite(createdAt)) return false;

    const age = Date.now() - createdAt;
    // age < 0 means a future timestamp, i.e. clock skew — do not trust it
    return age >= 0 && age < GATEWAY_ORDER_REUSE_WINDOW_MS;
};
