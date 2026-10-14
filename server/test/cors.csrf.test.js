/**
 * Regression tests for the CORS preflight allowlist and the CSRF origin
 * gate in src/app.js.
 *
 * NODE_ENV=production is set before app.js is imported because the cookie-less
 * origin check only hard-blocks in production (development must keep letting
 * curl/Postman through). Rate limiters are therefore active, so this suite
 * deliberately keeps the request count low (global limit is 300/15min).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

const FRONTEND = 'https://foodreel.netlify.app';
process.env.NODE_ENV = 'production';
process.env.FRONTEND_URL = FRONTEND;

const { default: app } = await import('../src/app.js');

let server;
let basePort;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  basePort = server.address().port;
});

after(() => new Promise((resolve) => server.close(resolve)));

function request({ method = 'GET', path = '/', headers = {} }) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port: basePort, method, path, headers },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () =>
          resolve({ status: res.statusCode, headers: res.headers, body })
        );
      }
    );
    req.on('error', reject);
    req.end();
  });
}

test('preflight allows the Idempotency-Key request header', async () => {
  const res = await request({
    method: 'OPTIONS',
    path: '/api/orders',
    headers: {
      Origin: FRONTEND,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'idempotency-key,content-type',
    },
  });

  assert.equal(res.status, 204);
  assert.equal(res.headers['access-control-allow-origin'], FRONTEND);
  assert.equal(res.headers['access-control-allow-credentials'], 'true');
  const allowed = (res.headers['access-control-allow-headers'] || '').toLowerCase();
  assert.ok(
    allowed.includes('idempotency-key'),
    `Idempotency-Key missing from allow-headers: "${allowed}"`
  );
});

test('preflight rejects a foreign origin', async () => {
  const res = await request({
    method: 'OPTIONS',
    path: '/api/orders',
    headers: {
      Origin: 'https://evil.example',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  });

  // cors answers the preflight without ACAO - the browser then blocks it.
  assert.equal(res.headers['access-control-allow-origin'], undefined);
});

test('mutation with a foreign Origin is blocked even with cookies', async () => {
  const res = await request({
    method: 'POST',
    path: '/api/auth/user/logout',
    headers: {
      Origin: 'https://evil.example',
      Cookie: 'token=forged',
      'Content-Type': 'application/json',
    },
  });

  assert.equal(res.status, 403);
  assert.match(res.body, /Cross-site request blocked/);
});

test('cookie-bearing mutation without an Origin is blocked in production', async () => {
  const res = await request({
    method: 'POST',
    path: '/api/auth/user/logout',
    headers: { Cookie: 'token=victim-session' },
  });

  assert.equal(res.status, 403);
  assert.match(res.body, /Cross-site request blocked/);
});

test('cookie-less non-browser client still passes the gate', async () => {
  const res = await request({
    method: 'POST',
    path: '/api/auth/user/logout',
  });

  assert.notEqual(res.status, 403);
  assert.doesNotMatch(res.body, /Cross-site request blocked/);
});

test('mutation from the allowed frontend origin reaches the route', async () => {
  const res = await request({
    method: 'POST',
    path: '/api/auth/user/logout',
    headers: { Origin: FRONTEND, Cookie: 'token=real-session' },
  });

  assert.notEqual(res.status, 403);
  assert.doesNotMatch(res.body, /Cross-site request blocked/);
});

test('GET requests are exempt from the origin gate', async () => {
  const res = await request({
    method: 'GET',
    path: '/health',
    headers: { Origin: 'https://evil.example' },
  });

  assert.equal(res.status, 200);
});

test('Razorpay webhook route is exempt (server-to-server, HMAC-authenticated)', async () => {
  const res = await request({
    method: 'POST',
    path: '/api/payment/webhook',
    headers: { 'Content-Type': 'application/json' },
    body: undefined,
  });

  assert.notEqual(res.status, 403);
  assert.doesNotMatch(res.body, /Cross-site request blocked/);
});
