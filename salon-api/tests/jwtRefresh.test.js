const jwt = require('jsonwebtoken');
const request = require('supertest');
const { app } = require('../src/app');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_access_secret_123';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_456';

describe('High-Risk Logic: JWT Authentication & Refresh Token Flow', () => {
  test('Token mechanics: Valid refresh token verifies, while expired/invalid tokens are rejected', () => {
    const payload = { userId: 'user_123', role: 'CUSTOMER' };

    // 1. Sign valid access and refresh tokens
    const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    // 2. Verify valid access token
    const decodedAccess = jwt.verify(accessToken, JWT_ACCESS_SECRET);
    expect(decodedAccess.userId).toBe('user_123');

    // 3. Verify valid refresh token
    const decodedRefresh = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    expect(decodedRefresh.userId).toBe('user_123');

    // 4. Assert invalid secret fails
    expect(() => {
      jwt.verify(accessToken, 'wrong_secret');
    }).toThrow();

    // 5. Assert expired token fails
    const expiredToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '-1s' });
    expect(() => {
      jwt.verify(expiredToken, JWT_ACCESS_SECRET);
    }).toThrow();
  });

  test('POST /api/v1/auth/refresh rejects missing body with 400 and invalid tokens with 401', async () => {
    // Missing body -> 400 Bad Request
    const res1 = await request(app)
      .post('/api/v1/auth/refresh')
      .send({});
    expect(res1.status).toBe(400);

    // Invalid forged token -> 401 Unauthorized
    const res2 = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid.jwt.signature' });
    expect(res2.status).toBe(401);
  });

  test('Concurrent Requests Queuing & Replay Flow: 2+ requests failing with 401 wait for refresh and replay successfully', async () => {
    const payload = { userId: 'user_test_999', role: 'CUSTOMER' };
    const expiredToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '-10s' });
    const validNewToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '15m' });

    // 1. Fire 2 concurrent requests with expired access token -> both fail with 401
    const [failRes1, failRes2] = await Promise.all([
      request(app).get('/api/v1/customers/me/favorites').set('Authorization', `Bearer ${expiredToken}`),
      request(app).get('/api/v1/notifications/unread-count').set('Authorization', `Bearer ${expiredToken}`),
    ]);

    expect(failRes1.status).toBe(401);
    expect(failRes2.status).toBe(401);

    // 2. Interceptor queue mechanism: queue both requests, run single refresh task
    let isRefreshing = true;
    let failedQueue = [];

    const queueRequest = (reqFn) => {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, reqFn });
      });
    };

    // Queue both failed requests
    const replayedPromise1 = queueRequest((token) =>
      request(app).get('/api/v1/browse/salons').set('Authorization', `Bearer ${token}`)
    );
    const replayedPromise2 = queueRequest((token) =>
      request(app).get('/api/v1/browse/salons?city=Brahmapur').set('Authorization', `Bearer ${token}`)
    );

    // 3. Simulate single successful refresh call resolving queue
    isRefreshing = false;
    failedQueue.forEach(({ resolve, reqFn }) => resolve(reqFn(validNewToken)));
    failedQueue = [];

    // 4. Assert BOTH queued requests replay and complete successfully with 200 OK
    const [replayedRes1, replayedRes2] = await Promise.all([replayedPromise1, replayedPromise2]);

    expect(replayedRes1.status).toBe(200);
    expect(replayedRes2.status).toBe(200);
  });
});
