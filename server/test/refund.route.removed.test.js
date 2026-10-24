/**
 * Regression: the customer-facing refund endpoint was removed.
 *
 * POST /api/payment/refund let any logged-in user refund their own order while
 * the partner was still fulfilling it: the read-side policy checked payment
 * state but never the order's lifecycle. Refunds now go exclusively through
 * the cancellation flow (customer cancel -> auto refund, partner cancel ->
 * admin approval) and the admin refund queue.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('payment routes no longer expose /refund', () => {
    const src = read('src/routes/payment.route.js');
    assert.doesNotMatch(
        src,
        /router\.post\(\s*['"]\/refund['"]/,
        'the customer refund route must stay deleted'
    );
});

test('the refund controller and its read-side policy are gone', () => {
    const controller = read('src/controllers/payment.controller.js');
    assert.doesNotMatch(controller, /export const initiateRefund/);

    const policy = read('src/services/refund.policy.js');
    assert.doesNotMatch(
        policy,
        /decideRefundRequest/,
        'refund requests are authorised by the cancellation flow only'
    );
});

test('the client no longer advertises a refund endpoint', (t) => {
    const apiPath = path.join(ROOT, '..', 'Client', 'src', 'config', 'Api.jsx');
    if (!fs.existsSync(apiPath)) {
        t.skip('client tree not present (server-only checkout)');
        return;
    }
    assert.doesNotMatch(fs.readFileSync(apiPath, 'utf8'), /payment\/refund/);
});

test('the finaliser refunds captured money on a ticket that left pending_payment', () => {
    const src = read('src/services/foodfest.ticket.service.js');
    assert.match(src, /TICKET_EXPIRED/);
    assert.match(src, /refundUnfinalisedTicket/);
    assert.match(
        src,
        /paymentService\.refundPayment/,
        'the expiry path must actually refund, not just report it'
    );
});
