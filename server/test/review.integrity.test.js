/**
 * Review-integrity regressions.
 *
 * These pin the Stage-3 fixes: hidden reviews must not leak through public or
 * partner read paths, edits of rejected/flagged reviews return to moderation,
 * and the partner rating aggregate must be correct and observable.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const { computeRatingBreakdown } = await import('../src/controllers/review.controller.js');

test('public food reviews only include approved reviews', () => {
    const src = read('src/controllers/food.controller.js');
    const start = src.indexOf('const getReviews = async');
    assert.ok(start > -1, 'getReviews must exist');
    const block = src.slice(start, start + 1600);
    const filters = block.match(/status: 'approved'/g) || [];
    assert.ok(
        filters.length >= 3,
        'the list, count and average queries must all filter approved reviews'
    );
});

test('the partner review dashboard only includes approved reviews', () => {
    const src = read('src/controllers/foodPartner.controller.js');
    const start = src.indexOf('async function getReviews');
    assert.ok(start > -1, 'getReviews must exist');
    assert.match(src.slice(start, start + 600), /status: 'approved'/);
});

test('another user cannot read non-approved reviews', () => {
    const src = read('src/controllers/review.controller.js');
    const start = src.indexOf('export const getUserReviews');
    assert.ok(start > -1);
    const block = src.slice(start, start + 1200);
    assert.match(block, /String\(userId\) !== String\(req\.user\._id\)/);
    assert.match(block, /query\.status = 'approved'/);
});

test('interactions only target approved, active reviews', () => {
    const src = read('src/controllers/review.controller.js');
    for (const fn of ['markReviewHelpful', 'addReviewReply', 'respondToReview']) {
        const start = src.indexOf(`export const ${fn}`);
        assert.ok(start > -1, `${fn} must exist`);
        assert.match(
            src.slice(start, start + 900),
            /status: 'approved'/,
            `${fn} must not expose or mutate hidden reviews`
        );
    }
});

test('editing a rejected or flagged review returns it to moderation', () => {
    const src = read('src/controllers/review.controller.js');
    for (const fn of ['createReview', 'updateReview']) {
        const start = src.indexOf(`export const ${fn}`);
        assert.ok(start > -1, `${fn} must exist`);
        const block = src.slice(start, start + 5000);
        assert.match(block, /status === 'rejected'/, `${fn} must re-moderate edited reviews`);
        assert.match(block, /status = 'pending'/);
    }

    const foodSrc = read('src/controllers/food.controller.js');
    const addStart = foodSrc.indexOf('const addReview = async');
    const addBlock = foodSrc.slice(addStart, addStart + 1800);
    assert.match(addBlock, /status === 'rejected'/);
    assert.match(addBlock, /status = 'pending'/);
});

test('rating breakdown averages each dimension over its own reviewers', () => {
    const breakdown = computeRatingBreakdown([
        { ratings: { food: 5, service: 1 } },
        { ratings: { service: 5, ambiance: 5 } },
        { ratings: { value: 4 } }
    ]);
    assert.deepEqual(breakdown, { food: 5, service: 3, ambiance: 5, value: 4 });
});

test('a dimension with no scores stays at zero', () => {
    assert.deepEqual(computeRatingBreakdown([{ ratings: { food: 4 } }]), {
        food: 4,
        service: 0,
        ambiance: 0,
        value: 0
    });
});

test('a failed rating recalculation is not swallowed', () => {
    const src = read('src/controllers/review.controller.js');
    const start = src.indexOf('export async function updateFoodPartnerRatings');
    assert.ok(start > -1);
    assert.match(src.slice(start, start + 1400), /throw error/);
});

test('admin review deletion recalculates the partner aggregate', () => {
    const src = read('src/controllers/admin.controller.js');
    const start = src.indexOf('async function deleteReview');
    assert.ok(start > -1);
    const block = src.slice(start, start + 1400);
    assert.match(block, /updateFoodPartnerRatings\(review\.foodPartner\)/);
    assert.match(block, /reviewsCount: -1/);
});
