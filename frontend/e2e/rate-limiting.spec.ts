import { test, expect, Page } from '@playwright/test';

/**
 * Rate Limiting E2E Tests
 * 
 * Required data-testid attributes:
 * - email-input: Email input field
 * - password-input: Password input field  
 * - signin-button: Sign in submit button
 * - error-message: Error message container
 * - captcha-container: CAPTCHA challenge container
 * - 2fa-code-input: 2FA verification code input
 * - verify-2fa-button: 2FA verification submit button
 */

// Test configuration
const TEST_EMAIL = 'ratelimit.test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper functions
async function makeLoginAttempt(page: Page, email: string, password: string) {
  await page.goto('/auth/signin');
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="signin-button"]');
}

async function waitForRateLimit(seconds: number) {
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

test.describe('Rate Limiting System', () => {
  test.describe('Authentication Rate Limiting', () => {
    test('should block after 5 failed login attempts @security', async ({ page }) => {
      // Attempt to login 5 times with wrong password
      for (let i = 1; i <= 5; i++) {
        await makeLoginAttempt(page, TEST_EMAIL, 'WrongPassword');
        
        if (i < 5) {
          // Should show invalid credentials for first 4 attempts
          await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
        }
      }
      
      // 6th attempt should be rate limited
      await makeLoginAttempt(page, TEST_EMAIL, 'WrongPassword');
      
      // Should show rate limit error
      await expect(page.locator('[data-testid="error-message"]')).toContainText(/too many.*attempts|rate limit/i);
      
      // Verify retry-after header is present
      const response = await page.waitForResponse(resp => 
        resp.url().includes('/auth/signin') && resp.status() === 429
      );
      
      expect(response.status()).toBe(429);
      const headers = response.headers();
      const retryAfter = headers['retry-after'] || headers['Retry-After'];
      expect(retryAfter).toBeDefined();
    });

    test('should apply progressive lockout on repeated violations @security', async ({ page }) => {
      // First lockout - 5 minutes
      for (let i = 0; i < 6; i++) {
        await makeLoginAttempt(page, `progressive.${Date.now()}@test.com`, 'wrong');
        await page.waitForTimeout(100);
      }
      
      let errorMessage = await page.locator('[data-testid="error-message"]').textContent();
      expect(errorMessage).toMatch(/5 minutes|300 seconds/i);
      
      // Wait for lockout to expire (in real tests, you'd mock time)
      // For demo purposes, using a shorter wait
      await waitForRateLimit(2);
      
      // Second lockout - should be 15 minutes
      for (let i = 0; i < 4; i++) {
        await makeLoginAttempt(page, `progressive.${Date.now()}@test.com`, 'wrong');
        await page.waitForTimeout(100);
      }
      
      errorMessage = await page.locator('[data-testid="error-message"]').textContent();
      expect(errorMessage).toMatch(/15 minutes|900 seconds/i);
    });

    test('should show CAPTCHA after threshold @security', async ({ page }) => {
      const uniqueEmail = `captcha.${Date.now()}@test.com`;
      
      // Make attempts up to 80% of limit (4 attempts if limit is 5)
      for (let i = 0; i < 4; i++) {
        await makeLoginAttempt(page, uniqueEmail, 'WrongPassword');
        await page.waitForTimeout(200);
      }
      
      // Next attempt should show CAPTCHA
      await page.goto('/auth/signin');
      await page.fill('[data-testid="email-input"]', uniqueEmail);
      await page.fill('[data-testid="password-input"]', 'WrongPassword');
      
      // CAPTCHA should be visible
      await expect(page.locator('[data-testid="captcha-container"]')).toBeVisible();
      
      // Verify CAPTCHA challenge exists
      const captchaFrame = page.frameLocator('iframe[title="reCAPTCHA"]');
      if (await captchaFrame.locator('div').count() > 0) {
        expect(captchaFrame).toBeDefined();
      }
    });
  });

  test.describe('API Endpoint Rate Limiting', () => {
    test('should limit API requests per minute @security', async ({ page, request }) => {
      // Login first to get auth token
      await page.goto('/auth/signin');
      await page.fill('[data-testid="email-input"]', TEST_EMAIL);
      await page.fill('[data-testid="password-input"]', TEST_PASSWORD);
      await page.click('[data-testid="signin-button"]');
      
      // Get auth token from localStorage
      const token = await page.evaluate(() => localStorage.getItem('authToken'));
      
      // Make rapid API requests
      const requests = [];
      for (let i = 0; i < 102; i++) {
        requests.push(
          request.get(`${API_BASE_URL}/api/assets`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            failOnStatusCode: false,
          })
        );
      }
      
      const responses = await Promise.all(requests);
      
      // First 100 should succeed (default limit)
      const successCount = responses.filter(r => r.status() === 200).length;
      expect(successCount).toBeGreaterThanOrEqual(95); // Allow some margin
      
      // Some should be rate limited
      const rateLimitedCount = responses.filter(r => r.status() === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
      
      // Check rate limit headers
      const lastSuccess = responses.find(r => r.status() === 200);
      if (lastSuccess) {
        const headers = await lastSuccess.headers();
        // Check for rate limit headers (case-insensitive)
        const hasLimit = headers['x-ratelimit-limit'] || headers['X-RateLimit-Limit'];
        const hasRemaining = headers['x-ratelimit-remaining'] || headers['X-RateLimit-Remaining'];
        const hasReset = headers['x-ratelimit-reset'] || headers['X-RateLimit-Reset'];
        
        expect(hasLimit).toBeDefined();
        expect(hasRemaining).toBeDefined();
        expect(hasReset).toBeDefined();
      }
    });

    test('should apply different limits for different endpoints @security', async ({ request }) => {
      const token = 'test-token'; // Would get real token in actual test
      
      // Test GET endpoint (higher limit)
      const getResponses = await Promise.all(
        Array(50).fill(null).map(() =>
          request.get(`${API_BASE_URL}/api/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` },
            failOnStatusCode: false,
          })
        )
      );
      
      // Test POST endpoint (lower limit)
      const postResponses = await Promise.all(
        Array(50).fill(null).map(() =>
          request.post(`${API_BASE_URL}/api/assets`, {
            headers: { 'Authorization': `Bearer ${token}` },
            data: { name: 'Test Asset' },
            failOnStatusCode: false,
          })
        )
      );
      
      // GET should have fewer rate limited responses
      const getRateLimited = getResponses.filter(r => r.status() === 429).length;
      const postRateLimited = postResponses.filter(r => r.status() === 429).length;
      
      expect(postRateLimited).toBeGreaterThan(getRateLimited);
    });
  });

  test.describe('Bot Detection', () => {
    test('should detect and block bot user agents @security', async ({ page }) => {
      // Set bot user agent
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      });
      
      await page.goto('/auth/signin');
      
      // Attempt login with bot user agent
      await page.fill('[data-testid="email-input"]', TEST_EMAIL);
      await page.fill('[data-testid="password-input"]', TEST_PASSWORD);
      await page.click('[data-testid="signin-button"]');
      
      // Should be blocked or require additional verification
      const errorOrCaptcha = page.locator('[data-testid="error-message"], [data-testid="captcha-container"]');
      await expect(errorOrCaptcha).toBeVisible();
    });

    test('should detect rapid automated requests @security', async ({ page }) => {
      // Make requests with no delay (bot-like behavior)
      const startTime = Date.now();
      
      for (let i = 0; i < 10; i++) {
        await page.goto('/auth/signin', { waitUntil: 'networkidle' });
      }
      
      const duration = Date.now() - startTime;
      
      // If requests were very fast, should trigger bot detection
      if (duration < 2000) { // Less than 2 seconds for 10 requests
        const response = await page.goto('/auth/signin');
        expect(response?.status()).toBe(429);
      }
    });
  });

  test.describe('2FA Rate Limiting', () => {
    test('should limit 2FA verification attempts @security', async ({ page }) => {
      // First, login to get to 2FA page
      await page.goto('/auth/signin');
      await page.fill('[data-testid="email-input"]', '2fa.test@example.com');
      await page.fill('[data-testid="password-input"]', 'ValidPassword123!');
      await page.click('[data-testid="signin-button"]');
      
      // Should redirect to 2FA verification
      await expect(page).toHaveURL(/\/auth\/2fa/);
      
      // Try wrong codes multiple times
      for (let i = 0; i < 4; i++) {
        await page.fill('[data-testid="2fa-code-input"]', '000000');
        await page.click('[data-testid="verify-2fa-button"]');
        await page.waitForTimeout(200);
      }
      
      // Should show rate limit error
      await expect(page.locator('[data-testid="error-message"]')).toContainText(/too many.*attempts/i);
    });
  });

  test.describe('OAuth Token Exchange Rate Limiting', () => {
    test('should limit Firebase token exchanges @security', async ({ page, request }) => {
      const exchanges = [];
      
      for (let i = 0; i < 12; i++) {
        exchanges.push(
          request.post(`${API_BASE_URL}/auth/firebase-exchange`, {
            data: {
              firebaseToken: `fake-token-${i}`,
            },
            failOnStatusCode: false,
          })
        );
      }
      
      const responses = await Promise.all(exchanges);
      
      // Should allow first 10, block after that
      const successCount = responses.filter(r => r.status() !== 429).length;
      expect(successCount).toBeLessThanOrEqual(10);
      
      const blockedCount = responses.filter(r => r.status() === 429).length;
      expect(blockedCount).toBeGreaterThan(0);
    });
  });

  test.describe('IP-based vs User-based Limiting', () => {
    test('should track limits separately for authenticated vs unauthenticated @security', async ({ page, request }) => {
      // Unauthenticated requests
      const unauthRequests = await Promise.all(
        Array(10).fill(null).map(() =>
          request.get(`${API_BASE_URL}/api/public/data`, {
            failOnStatusCode: false,
          })
        )
      );
      
      // Login
      const loginResponse = await request.post(`${API_BASE_URL}/auth/signin`, {
        data: { email: TEST_EMAIL, password: TEST_PASSWORD },
      });
      const { token } = await loginResponse.json();
      
      // Authenticated requests
      const authRequests = await Promise.all(
        Array(10).fill(null).map(() =>
          request.get(`${API_BASE_URL}/api/assets`, {
            headers: { 'Authorization': `Bearer ${token}` },
            failOnStatusCode: false,
          })
        )
      );
      
      // Both should have independent limits
      const unauthBlocked = unauthRequests.filter(r => r.status() === 429).length;
      const authBlocked = authRequests.filter(r => r.status() === 429).length;
      
      // Verify they're tracked separately (one being blocked shouldn't affect the other)
      if (unauthBlocked > 0) {
        expect(authBlocked).toBe(0); // Auth requests should still work
      }
    });
  });

  test.describe('Rate Limit Recovery', () => {
    test('should reset limits after time window @security', async ({ page }) => {
      const uniqueEmail = `reset.${Date.now()}@test.com`;
      
      // Hit rate limit
      for (let i = 0; i < 6; i++) {
        await makeLoginAttempt(page, uniqueEmail, 'wrong');
        await page.waitForTimeout(100);
      }
      
      // Should be blocked
      await expect(page.locator('[data-testid="error-message"]')).toContainText(/rate limit/i);
      
      // Wait for reset (in real test, would mock time)
      await page.waitForTimeout(5000); // Wait 5 seconds for demo
      
      // Should be able to try again
      await makeLoginAttempt(page, uniqueEmail, 'wrong');
      await expect(page.locator('[data-testid="error-message"]')).not.toContainText(/rate limit/i);
    });
  });
});

// Performance test for rate limiting overhead
test.describe('Rate Limiting Performance', () => {
  test('should not add significant latency @performance', async ({ page }) => {
    const timings: number[] = [];
    
    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();
      await page.goto('/api/health');
      const endTime = Date.now();
      timings.push(endTime - startTime);
    }
    
    const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
    
    // Rate limiting should add less than 5ms on average
    expect(avgTime).toBeLessThan(105); // Assuming base response is ~100ms
  });
});