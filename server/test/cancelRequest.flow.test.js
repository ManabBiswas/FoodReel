/**
 * The "unable to serve" cancellation request flow.
 *
 * A partner whose food is already being prepared used to have no way out: the
 * direct cancel endpoint only allowed 'pending' and 'confirmed', so a partner
 * who started cooking and then found the item unavailable was stuck with a
 * customer waiting for food that was never coming.
 *
 * These tests pin the wiring that the policy tests cannot see: that the route
 * exists, that the model accepts the new status, and that the two places that
 * could silently ignore the new status do not.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const { ORDER_STATUSES } = await import('../src/models/order.model.js');

describe('the cancel-request endpoints are wired up', () => {
    test('the partner route exists and is behind the partner auth', () => {
        const src = read('src/routes/order.route.js');
        assert.match(src, /router\.post\('\/partner\/:orderId\/cancel-request'/, 'the partner route must exist');
        assert.match(
            src,
            /router\.post\('\/partner\/:orderId\/cancel-request',[\s\S]{0,200}isFoodPartnerLoggedin/,
            'the partner route must require a logged-in food partner'
        );
    });

    test('the admin review routes exist and are behind the admin auth', () => {
        const src = read('src/routes/admin.route.js');
        assert.match(src, /router\.get\('\/cancel-requests'/, 'the admin queue route must exist');
        assert.match(src, /router\.post\('\/orders\/:orderId\/cancel-request\/decision'/, 'the admin decision route must exist');
        assert.match(
            src,
            /router\.get\('\/cancel-requests', isAdmin/,
            'the admin queue must require an admin'
        );
        assert.match(
            src,
            /router\.post\('\/orders\/:orderId\/cancel-request\/decision', isAdmin/,
            'the admin decision must require an admin'
        );
    });

    test('the partner route is not reachable by a customer', () => {
        // The order route file mounts the customer cancel at '/:orderId/cancel'.
        // A partner-only path must not be shadowed by it, and the customer
        // cancel must not be able to reach a preparing order.
        const src = read('src/routes/order.route.js');
        const customerCancel = src.slice(src.indexOf("router.post('/:orderId/cancel'"));
        assert.doesNotMatch(customerCancel, /cancel-request/, 'the customer cancel must not expose the request path');
    });
});

describe('the order model accepts the new status', () => {
    test('cancel_requested is in the exported status list', () => {
        assert.ok(ORDER_STATUSES.includes('cancel_requested'));
    });

    test('a brand new order does not look like it already has a pending request', () => {
        // Mongoose materialises a nested object with its defaults, so a
        // default of 'pending' on cancelRequest.status made EVERY new order
        // look like it had a request awaiting review — and the first request
        // a partner raised was refused as a duplicate. The policy unit tests
        // use plain objects and could not see this.
        const src = read('src/models/order.model.js');
        const block = src.slice(src.indexOf('cancelRequest: {'), src.indexOf('orderSchema.index'));
        assert.doesNotMatch(
            block,
            /status:\s*\{[^}]*default:\s*'pending'/,
            'cancelRequest.status must not default to pending'
        );
        assert.doesNotMatch(
            block,
            /requestedBy:\s*\{[^}]*default:/,
            'cancelRequest.requestedBy must not have a default'
        );
        assert.doesNotMatch(
            block,
            /requestedAt:\s*\{[^}]*default:/,
            'cancelRequest.requestedAt must not have a default'
        );
    });

    test('the schema enum matches the exported list', () => {
        // If these drift apart, the model rejects a status the controllers
        // think is valid (or the other way round) — a 500 on a real order.
        const src = read('src/models/order.model.js');
        const enumMatch = src.match(/enum:\s*\[([^\]]*'cancel_requested'[^\]]*)\]/);
        assert.ok(enumMatch, 'the status enum must contain cancel_requested');
        const schemaStatuses = enumMatch[1]
            .split(',')
            .map((s) => s.trim().replace(/^'|'$/g, ''))
            .filter(Boolean);
        assert.deepEqual(schemaStatuses, ORDER_STATUSES, 'the enum and ORDER_STATUSES must not drift');
    });

    test('the cancelRequest subdocument records who asked and what they said', () => {
        const src = read('src/models/order.model.js');
        assert.match(src, /cancelRequest:\s*\{/, 'the order must carry a cancelRequest');
        assert.match(src, /requestedBy:/, 'it must record who asked');
        assert.match(src, /previousStatus:/, 'it must remember the status to resume on rejection');
        assert.match(src, /enum:\s*\['pending', 'approved', 'rejected'\]/, 'it must track the decision');
    });

    test('the admin queue is indexed', () => {
        const src = read('src/models/order.model.js');
        assert.match(src, /orderSchema\.index\(\{ 'cancelRequest\.status': 1/, 'the review queue needs an index');
    });

    test('decidedBy distinguishes a human admin from the system', () => {
        // The enum used to be ['admin'] only, which forced the customer-cancel
        // path to write 'admin' for a decision no admin made.
        const src = read('src/models/order.model.js');
        const match = src.match(/decidedBy:\s*\{\s*[^}]*enum:\s*\[([^\]]*)\]/s);
        assert.ok(match, 'decidedBy must be an enum');
        const values = match[1].split(',').map((v) => v.trim().replace(/^'|'$/g, '')).filter(Boolean);
        assert.deepEqual(values, ['admin', 'system'], 'decidedBy must allow admin and system only');
    });
});

describe('the status filters do not silently drop the new status', () => {
    test('every status filter in the order controller uses ORDER_STATUSES', () => {
        // The list used to be written out by hand in four places, so adding a
        // status meant finding all four. They now read from one constant.
        const src = read('src/controllers/order.controller.js');
        const literals = src.match(/'pending',\s*'confirmed',\s*'preparing',\s*'ready',\s*'delivered',\s*'cancelled'/g);
        assert.equal(literals, null, 'no hand-written status list may remain in the order controller');
        assert.match(src, /ORDER_STATUSES\.includes\(status\)/, 'the filters must read the shared constant');
    });

    test('a cancel_requested order cannot be moved on by the partner', () => {
        const src = read('src/controllers/order.controller.js');
        assert.match(
            src,
            /'cancel_requested':\s*\[\]/,
            'cancel_requested must have no outgoing partner transitions'
        );
    });
});

describe('the partner request does not cancel the order', () => {
    test('the handler parks the order atomically instead of cancelling it', () => {
        const src = read('src/controllers/order.controller.js');
        const fn = src.slice(src.indexOf('const partnerRequestCancel'));
        // A plain read-then-save let a concurrent customer cancellation be
        // clobbered back into 'cancel_requested'. The park must be claimed
        // with a conditional update that only matches the status we saw.
        assert.match(fn, /findOneAndUpdate/, 'the park must be a conditional claim');
        assert.match(
            fn,
            /\$set:\s*\{[\s\S]*status: 'cancel_requested'/,
            'it must park the order inside the claim'
        );
        assert.doesNotMatch(
            fn,
            /order\.cancellation = \{/,
            'it must not mark the order cancelled — an admin decides that'
        );
        assert.doesNotMatch(
            fn,
            /initiateClaimedRefund/,
            'it must not move money — no refund until the admin approves'
        );
    });

    test('it records why, and the status to go back to', () => {
        const src = read('src/controllers/order.controller.js');
        const fn = src.slice(src.indexOf('const partnerRequestCancel'));
        assert.match(fn, /previousStatus: order\.status/, 'it must remember where to resume');
        assert.match(fn, /reason: decision\.reason/, 'it must store the reason');
    });

    test('a lost race answers with what the order is now', () => {
        const src = read('src/controllers/order.controller.js');
        const fn = src.slice(src.indexOf('const partnerRequestCancel'));
        assert.match(fn, /!claimed/, 'the claim result must be checked');
        assert.match(fn, /ORDER_STATE|REQUEST_ALREADY_PENDING/, 'a refused park must be reported as a conflict');
    });
});

describe('the admin decision does the cancelling', () => {
    test('approving cancels the order and releases the refund', () => {
        const src = read('src/controllers/adminCancelRequest.controller.js');
        const fn = src.slice(src.indexOf('export const decideCancelRequest'));
        assert.match(fn, /order\.status = 'cancelled'/, 'approving must cancel the order');
        assert.match(fn, /isCancelled: true/, 'it must set the cancellation flag');
        assert.match(fn, /initiateClaimedRefund/, 'it must release the refund');
    });

    test('the decision fails closed', () => {
        // A missing body or a typo used to normalise to 'approve' — which
        // cancels the order and releases the refund. Only an exact,
        // deliberate 'approve' or 'reject' may pass.
        const src = read('src/controllers/adminCancelRequest.controller.js');
        const fn = src.slice(src.indexOf('export const decideCancelRequest'));
        assert.match(fn, /INVALID_DECISION/, 'an invalid decision must be refused');
        assert.doesNotMatch(
            fn,
            /decision === 'reject' \? 'reject' : 'approve'/,
            'the decision must not default to approve'
        );
        assert.match(
            fn,
            /decision !== 'approve' && decision !== 'reject'/,
            'the guard must require an exact approve/reject'
        );
    });

    test('rejecting resumes the order and moves no money', () => {
        const src = read('src/controllers/adminCancelRequest.controller.js');
        const fn = src.slice(src.indexOf('export const decideCancelRequest'));
        // Scope to the rejection branch only — the approve branch that follows
        // it is the one that refunds.
        const rejectionBranch = fn.slice(
            fn.indexOf('if (verdict.rejection)'),
            fn.indexOf('// Approving cancels the order')
        );
        assert.match(rejectionBranch, /order\.status = order\.cancelRequest\.previousStatus/, 'it must resume the previous status');
        assert.doesNotMatch(rejectionBranch, /initiateClaimedRefund/, 'a rejection must not refund anything');
        assert.doesNotMatch(rejectionBranch, /isCancelled: true/, 'a rejection must not cancel the order');
    });

    test('the decision is claimed atomically so two admins cannot both win', () => {
        const src = read('src/controllers/adminCancelRequest.controller.js');
        assert.match(
            src,
            /findOneAndUpdate\(\s*\{ _id: orderId, status: 'cancel_requested', 'cancelRequest\.status': 'pending' \}/,
            'the request must be claimed with a conditional update'
        );
        assert.match(src, /REQUEST_ALREADY_DECIDED/, 'a second decision must be refused');
    });
});

describe('the customer cancelling first', () => {
    test('a customer may cancel while the request is still awaiting review', () => {
        const src = read('src/controllers/order.controller.js');
        const fn = src.slice(src.indexOf('const cancelOrder = async'));
        assert.match(
            fn,
            /'pending', 'confirmed', 'preparing', 'cancel_requested'/,
            'a cancel_requested order is still live, so the customer must be able to cancel it'
        );
    });

    test('the pending request is closed out so the admin queue does not show it', () => {
        const src = read('src/controllers/order.controller.js');
        const fn = src.slice(src.indexOf('const cancelOrder = async'));
        assert.match(
            fn,
            /order\.cancelRequest\??\.status === 'pending'/,
            'the request must be found'
        );
        assert.match(
            fn,
            /order\.cancelRequest\.status = 'rejected'/,
            'the request must be closed out'
        );
    });

    test('closing the request records the closer as system, not admin', () => {
        // No admin decided anything here — writing 'admin' forged an audit
        // trail. The model now allows 'system' and this path must use it.
        const src = read('src/controllers/order.controller.js');
        const fn = src.slice(src.indexOf('const cancelOrder = async'));
        assert.doesNotMatch(
            fn,
            /decidedBy = 'admin'/,
            'the customer path must not forge an admin decision'
        );
        assert.match(fn, /decidedBy = 'system'/, 'the closer must be recorded as system');
    });
});

describe('the admin queue UI', () => {
    test('the decision note is per request, not one shared field', () => {
        // One shared note used to leak across the queue: text typed for
        // request A was submitted with the decision on request B.
        const src = fs.readFileSync(path.join(ROOT, '..', 'Client/src/Components/admin/tabs/CancelRequestsTab.jsx'), 'utf8');
        assert.match(src, /notes\[r\.orderId\]/, 'the note input must be keyed by request');
        assert.match(src, /notes\[orderId\]/, 'the decision body must read the note for that request');
        assert.doesNotMatch(src, /setNote\(''\)/, 'the old shared setter must be gone');
    });

    test('the partner dashboard has no bare comments inside JSX', () => {
        // JSX children parse unbraced text as content, so these comment lines
        // rendered as literal text on every order card.
        const src = fs.readFileSync(path.join(ROOT, '..', 'Client/src/pages/FoodPartner/Dashboard.jsx'), 'utf8');
        assert.doesNotMatch(src, /^\s*\/\/ pending and confirmed orders/m);
        assert.doesNotMatch(src, /^\s*\/\/ Once the food is being made/m);
        assert.match(src, /\{\/\* pending and confirmed/, 'the intent must survive as a proper JSX comment');
    });
});

describe('the video upload limit', () => {
    test('the server limit is 10MB', () => {
        const src = read('src/middlewares/fileUpload.js');
        assert.match(src, /VIDEO: envBytes\('MAX_VIDEO_SIZE', 10 \* 1024 \* 1024\)/, 'the video limit must be 10MB');
    });

    test('the client limits match the server', () => {
        // The two used to disagree (10 vs 15MB), so a file the client accepted
        // was rejected by the server with a 413.
        for (const file of ['Client/src/pages/FoodPartner/CreateFood.jsx', 'Client/src/pages/User/CreatePost.jsx']) {
            const src = fs.readFileSync(path.join(ROOT, '..', file), 'utf8');
            assert.match(src, /isVideo \? 10 \* 1024 \* 1024 : 5 \* 1024 \* 1024/, `${file} must use the 10MB video limit`);
            assert.doesNotMatch(src, /15MB/, `${file} must not mention 15MB any more`);
        }
    });
});
