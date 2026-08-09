import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for OAuth Password Setup Feature
 * 
 * These tests verify the complete flow of OAuth users setting up
 * passwords for dual authentication.
 * 
 * Test scenarios:
 * 1. OAuth user requests password setup
 * 2. Token verification and validation
 * 3. Password setting with strength requirements
 * 4. Error handling and edge cases
 * 5. Security features (rate limiting, token expiry)
 */

// Helper function to mock OAuth user
async function loginAsOAuthUser(page: Page) {
  // Set up mock OAuth user session
  await page.addInitScript(() => {
    localStorage.setItem('auth-mode', 'firebase');
    localStorage.setItem('firebase-token', 'mock-oauth-token');
  });
  
  // Mock API response for user profile
  await page.route('**/api/auth/user', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        provider: 'firebase',
        password: null, // OAuth user without password
        name: 'Test User'
      })
    });
  });
}

// Helper to extract token from mock email
async function getPasswordSetupToken(page: Page): Promise<string> {
  // In real tests, this would check an email service or test inbox
  // For now, we'll use a mock token
  return 'mock-setup-token-123456';
}

test.describe('OAuth Password Setup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOAuthUser(page);
  });

  test('OAuth user can request password setup from settings', async ({ page }) => {
    // Navigate to settings page
    await page.goto('/app/settings');
    
    // Click on Security tab
    await page.click('text=Security');
    
    // Check that OAuth password setup card is visible
    await expect(page.locator('text=Enable Password Authentication')).toBeVisible();
    
    // Mock API response for password setup request
    await page.route('**/api/auth/oauth/request-password-setup', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Password setup email sent'
        })
      });
    });
    
    // Click request password setup button
    await page.click('[data-testid="request-password-setup-button"]');
    
    // Verify success message
    await expect(page.locator('text=Password Setup Email Sent')).toBeVisible();
    await expect(page.locator('text=We\'ve sent a password setup link')).toBeVisible();
  });

  test('Password setup page validates token correctly', async ({ page }) => {
    const token = await getPasswordSetupToken(page);
    
    // Mock API response for token verification
    await page.route('**/api/auth/oauth/verify-setup-token', async route => {
      const body = await route.request().postDataJSON();
      
      if (body.token === token) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: true,
            email: 'test@example.com',
            expiresIn: 3600
          })
        });
      } else {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Invalid token'
          })
        });
      }
    });
    
    // Navigate to password setup page with token
    await page.goto(`/auth/setup-password?token=${token}`);
    
    // Wait for token verification
    await page.waitForSelector('text=Set Your Password');
    
    // Verify email is displayed
    await expect(page.locator('text=test@example.com')).toBeVisible();
  });

  test('Password strength requirements are enforced', async ({ page }) => {
    const token = await getPasswordSetupToken(page);
    
    // Mock token verification
    await page.route('**/api/auth/oauth/verify-setup-token', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          email: 'test@example.com',
          expiresIn: 3600
        })
      });
    });
    
    await page.goto(`/auth/setup-password?token=${token}`);
    await page.waitForSelector('text=Set Your Password');
    
    const passwordInput = page.locator('[data-testid="password-input"]');
    const confirmInput = page.locator('[data-testid="confirm-password-input"]');
    const submitButton = page.locator('[data-testid="submit-password-button"]');
    
    // Test weak password
    await passwordInput.fill('weak');
    
    // Check requirements are shown
    await expect(page.locator('text=At least 12 characters')).toBeVisible();
    await expect(page.locator('text=One uppercase letter')).toBeVisible();
    await expect(page.locator('text=One lowercase letter')).toBeVisible();
    await expect(page.locator('text=One number')).toBeVisible();
    await expect(page.locator('text=One special character')).toBeVisible();
    
    // Submit button should be disabled
    await expect(submitButton).toBeDisabled();
    
    // Test strong password
    await passwordInput.fill('StrongP@ssw0rd123');
    await confirmInput.fill('StrongP@ssw0rd123');
    
    // All requirements should be met
    await expect(page.locator('.text-green-600').filter({ hasText: 'At least 12 characters' })).toBeVisible();
    await expect(page.locator('.text-green-600').filter({ hasText: 'One uppercase letter' })).toBeVisible();
    await expect(page.locator('.text-green-600').filter({ hasText: 'One lowercase letter' })).toBeVisible();
    await expect(page.locator('.text-green-600').filter({ hasText: 'One number' })).toBeVisible();
    await expect(page.locator('.text-green-600').filter({ hasText: 'One special character' })).toBeVisible();
    
    // Submit button should be enabled
    await expect(submitButton).toBeEnabled();
  });

  test('Password mismatch prevents submission', async ({ page }) => {
    const token = await getPasswordSetupToken(page);
    
    // Mock token verification
    await page.route('**/api/auth/oauth/verify-setup-token', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          email: 'test@example.com',
          expiresIn: 3600
        })
      });
    });
    
    await page.goto(`/auth/setup-password?token=${token}`);
    await page.waitForSelector('text=Set Your Password');
    
    const passwordInput = page.locator('[data-testid="password-input"]');
    const confirmInput = page.locator('[data-testid="confirm-password-input"]');
    const submitButton = page.locator('[data-testid="submit-password-button"]');
    
    // Enter different passwords
    await passwordInput.fill('StrongP@ssw0rd123');
    await confirmInput.fill('DifferentP@ssw0rd123');
    
    // Check mismatch warning
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
    
    // Submit button should be disabled
    await expect(submitButton).toBeDisabled();
  });

  test('Successfully sets password and redirects to sign in', async ({ page }) => {
    const token = await getPasswordSetupToken(page);
    
    // Mock token verification
    await page.route('**/api/auth/oauth/verify-setup-token', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          email: 'test@example.com',
          expiresIn: 3600
        })
      });
    });
    
    // Mock password set endpoint
    await page.route('**/api/auth/oauth/set-password', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Password set successfully',
          provider: 'dual'
        })
      });
    });
    
    await page.goto(`/auth/setup-password?token=${token}`);
    await page.waitForSelector('text=Set Your Password');
    
    // Fill in password form
    await page.fill('[data-testid="password-input"]', 'StrongP@ssw0rd123');
    await page.fill('[data-testid="confirm-password-input"]', 'StrongP@ssw0rd123');
    
    // Submit form
    await page.click('[data-testid="submit-password-button"]');
    
    // Check success message
    await expect(page.locator('text=Password Set Successfully!')).toBeVisible();
    
    // Wait for redirect
    await page.waitForURL('**/auth/signIn?passwordSet=true', { timeout: 5000 });
  });

  test('Handles expired token gracefully', async ({ page }) => {
    const expiredToken = 'expired-token-123';
    
    // Mock API response for expired token
    await page.route('**/api/auth/oauth/verify-setup-token', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Token has expired'
        })
      });
    });
    
    await page.goto(`/auth/setup-password?token=${expiredToken}`);
    
    // Check error message
    await expect(page.locator('text=Invalid Token')).toBeVisible();
    await expect(page.locator('text=Token has expired')).toBeVisible();
    
    // Check return to sign in button
    await expect(page.locator('text=Return to Sign In')).toBeVisible();
  });

  test('Shows token expiry warning when time is running out', async ({ page }) => {
    const token = await getPasswordSetupToken(page);
    
    // Mock token verification with short expiry
    await page.route('**/api/auth/oauth/verify-setup-token', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          email: 'test@example.com',
          expiresIn: 300 // 5 minutes
        })
      });
    });
    
    await page.goto(`/auth/setup-password?token=${token}`);
    await page.waitForSelector('text=Set Your Password');
    
    // Check expiry warning
    await expect(page.locator('text=This link expires in')).toBeVisible();
  });

  test('@security Rate limiting prevents brute force token attempts', async ({ page }) => {
    let attemptCount = 0;
    
    // Mock API response with rate limiting
    await page.route('**/api/auth/oauth/verify-setup-token', async route => {
      attemptCount++;
      
      if (attemptCount > 5) {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Too many verification attempts'
          })
        });
      } else {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Invalid token'
          })
        });
      }
    });
    
    // Try multiple invalid tokens
    for (let i = 0; i < 6; i++) {
      await page.goto(`/auth/setup-password?token=invalid-token-${i}`);
      await page.waitForTimeout(100);
    }
    
    // Check rate limit error
    await expect(page.locator('text=Too many verification attempts')).toBeVisible();
  });

  test('@security Password cannot contain email address', async ({ page }) => {
    const token = await getPasswordSetupToken(page);
    
    // Mock token verification
    await page.route('**/api/auth/oauth/verify-setup-token', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          email: 'testuser@example.com',
          expiresIn: 3600
        })
      });
    });
    
    // Mock password set endpoint with email check
    await page.route('**/api/auth/oauth/set-password', async route => {
      const body = await route.request().postDataJSON();
      
      if (body.password.toLowerCase().includes('testuser')) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Password cannot contain your email address'
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Password set successfully'
          })
        });
      }
    });
    
    await page.goto(`/auth/setup-password?token=${token}`);
    await page.waitForSelector('text=Set Your Password');
    
    // Try password containing email
    await page.fill('[data-testid="password-input"]', 'TestUser@123456');
    await page.fill('[data-testid="confirm-password-input"]', 'TestUser@123456');
    await page.click('[data-testid="submit-password-button"]');
    
    // Check error message
    await expect(page.locator('text=Password cannot contain your email')).toBeVisible();
  });

  test('Toggle password visibility works correctly', async ({ page }) => {
    const token = await getPasswordSetupToken(page);
    
    // Mock token verification
    await page.route('**/api/auth/oauth/verify-setup-token', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          email: 'test@example.com',
          expiresIn: 3600
        })
      });
    });
    
    await page.goto(`/auth/setup-password?token=${token}`);
    await page.waitForSelector('text=Set Your Password');
    
    const passwordInput = page.locator('[data-testid="password-input"]');
    const toggleButton = page.locator('[data-testid="toggle-password-visibility"]');
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click again to hide
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});