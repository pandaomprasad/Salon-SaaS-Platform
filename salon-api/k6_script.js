import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Ramp to 50 concurrent users
    { duration: '20s', target: 50 },  // Hold at 50 users
    { duration: '10s', target: 200 }, // Spike to 200 concurrent users
    { duration: '20s', target: 200 }, // Hold at 200 users
    { duration: '10s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],   // Error rate below 5%
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
  },
};

const BASE_URL = 'http://localhost:6969';

export default function () {
  // Step 1: Browse Salons
  const resBrowse = http.get(`${BASE_URL}/api/v1/browse/salons`);
  check(resBrowse, { 'browse status is 200': (r) => r.status === 200 });
  sleep(Math.random() * 2 + 1); // 1-3s think time

  // Step 2: View Salon Details
  const resDetail = http.get(`${BASE_URL}/api/v1/browse/salons`);
  check(resDetail, { 'detail status is 200': (r) => r.status === 200 });
  sleep(Math.random() * 2 + 1); // 1-3s think time

  // Step 3: Health Check
  const resHealth = http.get(`${BASE_URL}/health`);
  check(resHealth, { 'health status is 200': (r) => r.status === 200 });
  sleep(Math.random() * 2 + 1); // 1-3s think time
}
