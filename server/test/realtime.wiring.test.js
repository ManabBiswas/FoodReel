/**
 * Regression: the realtime client and the socket service must stay in step.
 *
 * The client hook (`useEventSocket`) and the server's `foodfest.socket.service`
 * are written on opposite sides of the wire, so nothing but a test notices when
 * one side renames an event. The failure mode is silent: the page keeps polling
 * and looks healthy while realtime is simply dead.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const client = (rel) => fs.readFileSync(path.join(ROOT, '..', 'Client', 'src', rel), 'utf8');

const hook = client('hooks/useEventSocket.jsx');

test('the client hook speaks the room protocol the server listens for', () => {
    const server = read('src/services/foodfest.socket.service.js');
    // leaveEvent is not asserted: the hook disconnects instead, and the server
    // drops a disconnected socket from every room on its own.
    assert.match(hook, /emit\('joinEvent'/, 'client must emit joinEvent');
    assert.match(server, /socket\.on\('joinEvent'/, 'server must listen for joinEvent');
});

test('every event the integration pages subscribe to is one the server emits', () => {
    const server = read('src/services/foodfest.socket.service.js');
    const detail = client('pages/User/FoodFestEventDetail.jsx');
    const dashboard = client('pages/User/OrganizerDashboard.jsx');

    assert.match(server, /emit\('ticket\.sold'/, 'server must emit ticket.sold');
    assert.match(server, /emit\('zone\.update'/, 'server must emit zone.update');
    assert.match(server, /emit\('zone\.alert'/, 'server must emit zone.alert');

    assert.match(detail, /'ticket\.sold'/, 'event detail reacts to ticket.sold');
    assert.match(dashboard, /'zone\.update'/, 'organizer dashboard reacts to zone.update');
    assert.match(dashboard, /'zone\.alert'/, 'organizer dashboard reacts to zone.alert');
});

test('a paid ticket announces the sale after the inventory move', () => {
    const src = read('src/services/foodfest.ticket.service.js');
    assert.match(src, /import \{ emitTicketSold \}/, 'the finaliser must import the emitter');
    // Placed after the commit, so a failed socket write cannot roll back a paid ticket.
    const commitAt = src.indexOf('commitTransaction()');
    const emitAt = src.indexOf('emitTicketSold(event._id');
    assert.ok(commitAt > -1 && emitAt > commitAt, 'the push must follow the commit');
});

test('the hook falls back to polling when realtime must not run', () => {
    assert.match(hook, /visibilitychange/, 'a hidden tab must drop the socket');
    assert.match(hook, /prefers-reduced-motion/, 'reduced motion keeps the caller poll');
    assert.match(hook, /socket\.disconnect\(\)/, 'the socket is actually closed, not just ignored');
});
