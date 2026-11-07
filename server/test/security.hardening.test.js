/**
 * Regression tests for Tier-2 hardening:
 *  - rate limiters on register and admin login
 *  - constant-time credential comparison
 *
 * Runs with NODE_ENV=production so the limiters are active (they skip in
 * development/test). Requests are kept under the global limiter's 300/15min.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.NODE_ENV = 'production';
process.env.FRONTEND_URL = 'https://foodreel.netlify.app';

const { default: app } = await import('../src/app.js');
const { timingSafeStringEqual } = await import('../src/utils/secureCompare.js');

let server;
let basePort;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  basePort = server.address().port;
});

after(() => new Promise((resolve) => server.close(resolve)));

function request({ method = 'GET', path = '/', headers = {}, body = '' }) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: basePort,
        method,
        path,
        headers: { 'Content-Type': 'application/json', ...headers },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }
    );
    req.on('error', reject);
    req.end(body);
  });
}

test('timingSafeStringEqual matches identical secrets', () => {
  assert.equal(timingSafeStringEqual('secret-code-123', 'secret-code-123'), true);
});

test('timingSafeStringEqual rejects different secrets', () => {
  assert.equal(timingSafeStringEqual('secret-code-123', 'secret-code-124'), false);
  assert.equal(timingSafeStringEqual('secret', 'completely-different-longer-value'), false);
  assert.equal(timingSafeStringEqual('', 'x'), false);
  assert.equal(timingSafeStringEqual(undefined, undefined), true);
});

test('user register is rate-limited (H4)', async () => {
  const body = JSON.stringify({}); // fails validation fast, no DB access
  let last;
  // authRateLimiter allows 10 per 10 minutes; the 11th must be blocked.
  for (let i = 0; i < 11; i++) {
    last = await request({ method: 'POST', path: '/api/auth/user/register', body });
    if (last.status === 429) break;
  }
  assert.equal(last.status, 429, 'register should 429 after 10 attempts');
});

test('admin login is rate-limited (H3)', async () => {
  const body = JSON.stringify({}); // fails validation fast, no DB access
  let last;
  // adminRateLimiter allows 120/min; the 121st must be blocked.
  for (let i = 0; i < 121; i++) {
    last = await request({ method: 'POST', path: '/api/admin/login', body });
    if (last.status === 429) break;
  }
  assert.equal(last.status, 429, 'admin login should 429 after 120 attempts');
});
