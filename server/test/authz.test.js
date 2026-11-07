/**
 * API authorization regression suite.
 *
 * Every protected route must answer 401 - not 200, not 500 - when called
 * with no session cookie. A route that forgets its auth middleware (or a
 * middleware reordering) fails these tests instead of shipping as a public
 * endpoint.
 *
 * Runs with NODE_ENV=production so CSRF/rate-limit middleware behave as in
 * production. No cookies are sent, so the auth middlewares short-circuit
 * before any database query - no Mongo connection is required.
 * Requests stay well under the global limiter's 300/15min.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.NODE_ENV = 'production';
process.env.FRONTEND_URL = 'https://foodreel-watch.netlify.app';

const { default: app } = await import('../src/app.js');

let server;
let basePort;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  basePort = server.address().port;
});

after(() => new Promise((resolve) => server.close(resolve)));

function request({ method = 'GET', path = '/', body = '' }) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: basePort,
        method,
        path,
        headers: { 'Content-Type': 'application/json' },
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

// A syntactically valid ObjectId so no handler can 500 on a cast error
// before the auth middleware would have rejected the request.
const ID = '64b000000000000000000000';

const protectedRoutes = [
  // --- user session (isLoggedin) ---
  { method: 'GET', path: '/api/cart' },
  { method: 'DELETE', path: '/api/cart/clear' },
  { method: 'GET', path: '/api/cart/validate' },
  { method: 'POST', path: '/api/cart/checkout' },
  { method: 'POST', path: '/api/orders' },
  { method: 'GET', path: '/api/orders' },
  { method: 'GET', path: `/api/orders/${ID}` },
  { method: 'GET', path: '/api/user/stats' },
  { method: 'GET', path: '/api/user/activity' },
  { method: 'PUT', path: '/api/auth/user/profile' },
  { method: 'PUT', path: '/api/user/preferences' },
  { method: 'POST', path: `/api/food/${ID}/like` },
  { method: 'POST', path: `/api/food/${ID}/save` },
  { method: 'POST', path: `/api/food/${ID}/review` },
  { method: 'POST', path: '/api/reviews/create' },
  { method: 'PUT', path: `/api/reviews/${ID}` },
  { method: 'DELETE', path: `/api/reviews/${ID}` },
  { method: 'POST', path: `/api/reviews/${ID}/helpful` },
  { method: 'POST', path: '/api/comments/create' },
  { method: 'PUT', path: `/api/comments/${ID}` },
  { method: 'DELETE', path: `/api/comments/${ID}` },
  { method: 'POST', path: '/api/follow/follow' },
  { method: 'POST', path: '/api/follow/unfollow' },
  { method: 'GET', path: '/api/follow/suggestions' },
  { method: 'POST', path: '/api/foodfest/user/tickets/purchase' },
  { method: 'GET', path: '/api/foodfest/user/my-tickets' },
  { method: 'POST', path: '/api/advertisement' },

  // --- partner session (isFoodPartnerLoggedin) ---
  { method: 'GET', path: '/api/food/my-posts' },
  { method: 'GET', path: '/api/food/statistics' },
  { method: 'POST', path: '/api/food' },
  { method: 'PUT', path: `/api/food/${ID}` },
  { method: 'DELETE', path: `/api/food/${ID}` },
  { method: 'GET', path: '/api/auth/partner/profile' },
  { method: 'PUT', path: '/api/auth/partner/bio' },
  { method: 'GET', path: '/api/auth/partner/reviews' },
  { method: 'GET', path: '/api/orders/partner' },
  { method: 'PUT', path: `/api/orders/partner/${ID}/status` },
  { method: 'GET', path: '/api/foodfest/partner/my-applications' },
  { method: 'POST', path: '/api/foodfest/partner/events/64b0000000000000000000aa/apply' },

  // --- admin session (isAdmin) ---
  { method: 'GET', path: '/api/admin/dashboard' },
  { method: 'GET', path: '/api/admin/users' },
  { method: 'GET', path: '/api/admin/partners' },
  { method: 'GET', path: '/api/admin/orders' },
  { method: 'GET', path: '/api/admin/reviews' },
  { method: 'DELETE', path: `/api/admin/reviews/${ID}` },
  { method: 'PATCH', path: `/api/admin/reviews/${ID}/status` },
  { method: 'GET', path: '/api/admin/support-tickets' },

  // --- gate scan (admin) ---
  { method: 'POST', path: '/api/foodfest/gate/scan' },
  { method: 'POST', path: '/api/foodfest/gate/checkout' },
];

test(`unauthenticated requests get 401 on ${protectedRoutes.length} protected routes`, async () => {
  const failures = [];
  for (const route of protectedRoutes) {
    const res = await request({
      ...route,
      body: route.method === 'GET' || route.method === 'DELETE' ? '' : '{}',
    });
    if (res.status !== 401) {
      failures.push(`${route.method} ${route.path} -> ${res.status}`);
    }
  }
  assert.deepEqual(
    failures,
    [],
    `routes not returning 401 without a session:\n${failures.join('\n')}`
  );
});

test('unauthenticated health check still answers (liveness must not require auth)', async () => {
  const res = await request({ method: 'GET', path: '/health' });
  assert.equal(res.status, 200);
  const body = JSON.parse(res.body);
  assert.ok(body.status === 'ok' || body.status === 'degraded');
});
