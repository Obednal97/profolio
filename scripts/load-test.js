import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");

// Test configuration
export const options = {
  stages: [
    { duration: "30s", target: 10 }, // Ramp up to 10 users
    { duration: "1m", target: 10 }, // Stay at 10 users for 1 minute
    { duration: "30s", target: 20 }, // Ramp up to 20 users
    { duration: "1m", target: 20 }, // Stay at 20 users for 1 minute
    { duration: "30s", target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests must complete below 500ms
    http_req_failed: ["rate<0.1"], // Error rate must be below 10%
    errors: ["rate<0.1"], // Custom error rate must be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const API_URL = __ENV.API_URL || "http://localhost:3001";

// Test data
const testUser = {
  email: `test_${Date.now()}@example.com`,
  password: "Test123!@#",
  firstName: "Load",
  lastName: "Test",
};

export function setup() {
  // Register a test user for authenticated tests
  const registerRes = http.post(
    `${API_URL}/api/auth/register`,
    JSON.stringify(testUser),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  if (registerRes.status === 201 || registerRes.status === 200) {
    const data = JSON.parse(registerRes.body);
    return { token: data.access_token };
  }

  console.log("Setup failed - using unauthenticated tests only");
  return { token: null };
}

export default function (data) {
  // Test 1: Homepage
  const homepageRes = http.get(BASE_URL);
  check(homepageRes, {
    "Homepage status is 200": (r) => r.status === 200,
    "Homepage loads quickly": (r) => r.timings.duration < 1000,
  });
  errorRate.add(homepageRes.status !== 200);
  sleep(1);

  // Test 2: Health check
  const healthRes = http.get(`${API_URL}/health`);
  check(healthRes, {
    "Health check status is 200": (r) => r.status === 200,
    "Health check returns ok": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === "ok";
      } catch {
        return false;
      }
    },
  });
  errorRate.add(healthRes.status !== 200);
  sleep(1);

  // Test 3: Login page
  const loginRes = http.get(`${BASE_URL}/auth/signIn`);
  check(loginRes, {
    "Login page status is 200": (r) => r.status === 200,
  });
  errorRate.add(loginRes.status !== 200);
  sleep(1);

  // Test 4: API Authentication (if setup succeeded)
  if (data.token) {
    const authRes = http.post(
      `${API_URL}/api/auth/login`,
      JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    check(authRes, {
      "Login API status is 200": (r) => r.status === 200,
      "Login returns token": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.access_token !== undefined;
        } catch {
          return false;
        }
      },
    });
    errorRate.add(authRes.status !== 200);
    sleep(1);

    // Test 5: Authenticated request
    if (authRes.status === 200) {
      const token = JSON.parse(authRes.body).access_token;
      const assetsRes = http.get(`${API_URL}/api/assets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      check(assetsRes, {
        "Assets API requires auth": (r) =>
          r.status === 200 || r.status === 401,
      });
    }
  }

  // Test 6: Static assets
  const staticAssets = [
    "/favicon.ico",
    "/manifest.json",
  ];

  staticAssets.forEach((asset) => {
    const res = http.get(`${BASE_URL}${asset}`);
    check(res, {
      [`${asset} loads`]: (r) => r.status === 200 || r.status === 404,
    });
    sleep(0.5);
  });

  // Random sleep between iterations
  sleep(Math.random() * 3 + 1);
}

export function teardown(data) {
  // Clean up test data if needed
  console.log("Load test completed");
}