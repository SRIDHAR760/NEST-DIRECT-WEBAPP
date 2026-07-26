/*
 * Load test suite for NestDirect, using k6.
 *
 * SAFETY NOTE: /api/chat and /api/generate-agreement call the real Gemini
 * API using your real (rate-limited, potentially billed) key. This script
 * does NOT load-test those endpoints by default — hammering them with
 * dozens/hundreds of virtual users would exhaust your quota instantly and
 * could incur real charges if billing is enabled. That scenario is included
 * but gated behind an explicit environment variable (INCLUDE_API_LOAD=true)
 * so it can never run by accident.
 *
 * Scenarios included:
 *   1. smoke        - 1 VU, 1 iteration  — sanity check, always safe to run
 *   2. average_load - ramps to 50 VUs    — simulates realistic traffic
 *   3. stress       - ramps to 200 VUs   — finds the breaking point
 *   4. spike        - sudden jump to 300 VUs — simulates a traffic spike
 *   5. api_load     - OPT-IN ONLY, hits /api/chat at low, controlled rate
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://nest-direct-webapp.vercel.app';
const INCLUDE_API_LOAD = __ENV.INCLUDE_API_LOAD === 'true';

export const options = {
  scenarios: {
    smoke: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      exec: 'smokeTest',
    },
    average_load: {
      executor: 'ramping-vus',
      exec: 'pageLoadTest',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
      startTime: '5s',
    },
    stress: {
      executor: 'ramping-vus',
      exec: 'pageLoadTest',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 0 },
      ],
      startTime: '2m10s',
    },
    spike: {
      executor: 'ramping-vus',
      exec: 'pageLoadTest',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 300 },
        { duration: '30s', target: 300 },
        { duration: '10s', target: 0 },
      ],
      startTime: '4m',
    },
    // Only runs if INCLUDE_API_LOAD=true is explicitly passed. Deliberately
    // tiny (5 VUs, few iterations) to protect your Gemini quota/budget.
    ...(INCLUDE_API_LOAD ? {
      api_load: {
        executor: 'shared-iterations',
        vus: 5,
        iterations: 10,
        exec: 'apiLoadTest',
        startTime: '5m30s',
      },
    } : {}),
  },
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // 95% of requests should complete under 3s
    http_req_failed: ['rate<0.05'],      // error rate should stay under 5%
  },
};

export function smokeTest() {
  const res = http.get(BASE_URL);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'contains NestDirect': (r) => r.body.includes('NestDirect'),
  });
}

export function pageLoadTest() {
  const res = http.get(BASE_URL);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 5000,
  });
  sleep(Math.random() * 2 + 1); // simulate real user think-time (1-3s)
}

// Gated behind INCLUDE_API_LOAD=true — see safety note above.
export function apiLoadTest() {
  const res = http.post(
    `${BASE_URL}/api/chat`,
    JSON.stringify({ message: 'What are the best areas to rent in Chennai?', history: [] }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(res, {
    'status is 200 or graceful 429': (r) => r.status === 200 || r.status === 429,
  });
  sleep(3); // deliberately slow pacing to avoid hammering the Gemini quota
}
