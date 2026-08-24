const request = require('supertest');
const { app } = require('../src/app');

describe('Security & CORS Integration Tests', () => {
  test('Whitelisted origin receives matching Access-Control-Allow-Origin header and credentials header', async () => {
    const allowedOrigin = 'http://localhost:3000';

    const res = await request(app)
      .get('/health')
      .set('Origin', allowedOrigin);

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(allowedOrigin);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  test('Non-whitelisted malicious origin must NOT receive allowed origin header or wildcard header', async () => {
    const maliciousOrigin = 'http://evil-malicious-site.com';

    const res = await request(app)
      .get('/health')
      .set('Origin', maliciousOrigin);

    // Assert evil origin is never reflected in Access-Control-Allow-Origin
    expect(res.headers['access-control-allow-origin']).not.toBe(maliciousOrigin);
    expect(res.headers['access-control-allow-origin']).not.toBe('*');
  });
});
