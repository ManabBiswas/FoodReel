import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEventWindow } from '../src/utils/eventDates.js';

const window = {
    startTime: '2026-11-01T10:00:00.000Z',
    endTime: '2026-11-01T18:00:00.000Z',
    salesStart: '2026-10-01T00:00:00.000Z',
    salesEnd: '2026-10-31T23:59:59.000Z'
};

test('accepts a coherent event window', () => {
    assert.equal(validateEventWindow(window), null);
});

test('rejects an event that ends before it starts', () => {
    assert.match(
        validateEventWindow({ ...window, startTime: window.endTime }),
        /startTime must be before endTime/
    );
});

test('rejects an inverted sales window', () => {
    assert.match(
        validateEventWindow({ ...window, salesStart: window.salesEnd }),
        /salesStart must be before salesEnd/
    );
});

test('rejects ticket sales after the event ends', () => {
    assert.match(
        validateEventWindow({ ...window, salesEnd: '2026-11-02T00:00:00.000Z' }),
        /salesEnd must not be after endTime/
    );
});

test('rejects missing or malformed dates', () => {
    assert.match(validateEventWindow({ ...window, startTime: null }), /valid dates/);
    assert.match(validateEventWindow({ ...window, endTime: 'not-a-date' }), /valid dates/);
    assert.match(validateEventWindow({}), /valid dates/);
});
