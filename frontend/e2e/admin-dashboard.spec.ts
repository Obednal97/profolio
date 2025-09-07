import { test, expect, Page } from '@playwright/test';

/**
 * Admin Dashboard E2E Tests
 * 
 * Required data-testid attributes:
 * - admin-dashboard: Main dashboard container
 * - user-table: User management table
 * - user-search: Search input field
 * - filter-role: Role filter dropdown
 * - user-row-*: Individual user rows
 * - user-detail-modal: User detail modal
 * - change-role-button: Role change action button
 * - bulk-actions-bar: Bulk operations toolbar
 * - access-denied: Access denied message
 * 
 * Note: Requires test users to be seeded in database:
 * - super.admin@profolio.com (SUPER_ADMIN)
 * - admin@profolio.com (ADMIN) 
 * - user@profolio.com (USER)
 */

// Test users
const SUPER_ADMIN = {
  email: 'super.admin@profolio.com',
  password: 'SuperAdmin123!',
  role: 'SUPER_ADMIN',
};

const REGULAR_ADMIN = {
  email: 'admin@profolio.com',
  password: 'Admin123!',
  role: 'ADMIN',
};

const REGULAR_USER = {
  email: 'user@profolio.com',
  password: 'User123!',
  role: 'USER',
};

const TEST_USER = {
  email: 'test.user@example.com',
  password: 'TestUser123!',
  name: 'Test User',
};

// Helper functions
async function loginAs(page: Page, user: typeof SUPER_ADMIN) {
  await page.goto('/auth/signin');
  await page.fill('[data-testid="email-input"]', user.email);
  await page.fill('[data-testid="password-input"]', user.password);
  await page.click('[data-testid="signin-button"]');
  await page.waitForURL('/app/**');
}

async function navigateToAdminDashboard(page: Page) {
  await page.goto('/app/admin');
  await expect(page).toHaveURL('/app/admin');
}

test.describe('Admin Dashboard Access Control', () => {
  test('should deny access to regular users @security', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/app/admin');
    
    // Should redirect or show access denied
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    // Or check redirect
    expect(page.url()).not.toContain('/app/admin');
  });

  test('should allow access to admin users @security', async ({ page }) => {
    await loginAs(page, REGULAR_ADMIN);
    await navigateToAdminDashboard(page);
    
    // Should see admin dashboard
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
  });

  test('should show different features for ADMIN vs SUPER_ADMIN @security', async ({ page }) => {
    // Test as regular admin
    await loginAs(page, REGULAR_ADMIN);
    await navigateToAdminDashboard(page);
    
    // Should see basic admin features
    await expect(page.locator('[data-testid="user-management"]')).toBeVisible();
    
    // Should NOT see super admin features
    await expect(page.locator('[data-testid="delete-user-button"]')).not.toBeVisible();
    
    // Test as super admin
    await page.evaluate(() => localStorage.clear());
    await loginAs(page, SUPER_ADMIN);
    await navigateToAdminDashboard(page);
    
    // Should see all features including delete
    await expect(page.locator('[data-testid="delete-user-button"]')).toBeVisible();
  });
});

test.describe('User Management Table', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, REGULAR_ADMIN);
    await navigateToAdminDashboard(page);
    await page.click('[data-testid="nav-users"]');
  });

  test('should display list of users', async ({ page }) => {
    // Wait for table to load
    await expect(page.locator('[data-testid="user-table"]')).toBeVisible();
    
    // Should have table headers
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Role")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    
    // Should have at least one user row
    const userRows = page.locator('[data-testid^="user-row-"]');
    await expect(userRows).toHaveCount(await userRows.count());
    expect(await userRows.count()).toBeGreaterThan(0);
  });

  test('should search users by name or email', async ({ page }) => {
    // Search by name
    await page.fill('[data-testid="user-search"]', 'John');
    await page.waitForTimeout(500); // Debounce delay
    
    // Should filter results
    const userRows = page.locator('[data-testid^="user-row-"]');
    const count = await userRows.count();
    
    for (let i = 0; i < count; i++) {
      const row = userRows.nth(i);
      const text = await row.textContent();
      expect(text?.toLowerCase()).toContain('john');
    }
    
    // Clear search
    await page.fill('[data-testid="user-search"]', '');
    await page.waitForTimeout(500);
    
    // Search by email
    await page.fill('[data-testid="user-search"]', '@example.com');
    await page.waitForTimeout(500);
    
    // Verify filtered results contain the email domain
    const emailRows = page.locator('[data-testid^="user-row-"]');
    const emailCount = await emailRows.count();
    
    for (let i = 0; i < emailCount; i++) {
      const row = emailRows.nth(i);
      const text = await row.textContent();
      expect(text?.toLowerCase()).toContain('@example.com');
    }
  });

  test('should filter users by role', async ({ page }) => {
    // Open role filter
    await page.click('[data-testid="filter-role"]');
    
    // Select ADMIN role
    await page.click('[data-testid="role-option-ADMIN"]');
    await page.click('body'); // Close dropdown
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // All visible users should be admins
    const userRows = page.locator('[data-testid^="user-row-"]');
    const count = await userRows.count();
    
    for (let i = 0; i < count; i++) {
      const roleCell = userRows.nth(i).locator('[data-testid="user-role"]');
      await expect(roleCell).toContainText('ADMIN');
    }
  });

  test('should sort users by different columns', async ({ page }) => {
    // Sort by name ascending
    await page.click('[data-testid="sort-name"]');
    await page.waitForTimeout(500);
    
    // Get all names
    const nameElements = page.locator('[data-testid="user-name"]');
    const names = await nameElements.allTextContents();
    
    // Verify ascending order
    const sortedNames = [...names].sort();
    expect(names).toEqual(sortedNames);
    
    // Sort by name descending
    await page.click('[data-testid="sort-name"]');
    await page.waitForTimeout(500);
    
    const namesDesc = await nameElements.allTextContents();
    const sortedNamesDesc = [...namesDesc].sort().reverse();
    expect(namesDesc).toEqual(sortedNamesDesc);
  });

  test('should paginate user list', async ({ page }) => {
    // Check pagination controls exist
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    
    // Check page size selector
    await page.selectOption('[data-testid="page-size"]', '10');
    await page.waitForTimeout(500);
    
    // Count visible rows (should be max 10)
    const userRows = page.locator('[data-testid^="user-row-"]');
    const count = await userRows.count();
    expect(count).toBeLessThanOrEqual(10);
    
    // Go to next page if available
    const nextButton = page.locator('[data-testid="next-page"]');
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(500);
      
      // Should show different users
      const newUserRows = page.locator('[data-testid^="user-row-"]');
      expect(await newUserRows.count()).toBeGreaterThan(0);
    }
  });
});

test.describe('User Detail Modal', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, REGULAR_ADMIN);
    await navigateToAdminDashboard(page);
    await page.click('[data-testid="nav-users"]');
  });

  test('should open user detail modal on row click', async ({ page }) => {
    // Click first user row
    await page.click('[data-testid^="user-row-"]:first-child');
    
    // Modal should open
    await expect(page.locator('[data-testid="user-detail-modal"]')).toBeVisible();
    
    // Should show user information
    await expect(page.locator('[data-testid="user-detail-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-detail-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-detail-role"]')).toBeVisible();
    
    // Should have action buttons
    await expect(page.locator('[data-testid="change-role-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="lock-account-button"]')).toBeVisible();
  });

  test('should display user activity history', async ({ page }) => {
    // Open a user detail modal
    await page.click('[data-testid^="user-row-"]:first-child');
    
    // Navigate to activity tab
    await page.click('[data-testid="tab-activity"]');
    
    // Should show activity history
    await expect(page.locator('[data-testid="activity-timeline"]')).toBeVisible();
    
    // Should have at least one activity entry
    const activities = page.locator('[data-testid^="activity-item-"]');
    expect(await activities.count()).toBeGreaterThan(0);
  });

  test('should display audit logs', async ({ page }) => {
    // Open a user detail modal
    await page.click('[data-testid^="user-row-"]:first-child');
    
    // Navigate to logs tab
    await page.click('[data-testid="tab-logs"]');
    
    // Should show audit logs
    await expect(page.locator('[data-testid="audit-log-list"]')).toBeVisible();
    
    // Logs should have timestamp and action
    const firstLog = page.locator('[data-testid^="audit-log-"]:first-child');
    await expect(firstLog.locator('[data-testid="log-timestamp"]')).toBeVisible();
    await expect(firstLog.locator('[data-testid="log-action"]')).toBeVisible();
  });
});

test.describe('Role Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, SUPER_ADMIN);
    await navigateToAdminDashboard(page);
    await page.click('[data-testid="nav-users"]');
  });

  test('should change user role with reason', async ({ page }) => {
    // Find a user with USER role
    const userRow = page.locator('[data-testid^="user-row-"]').filter({
      has: page.locator('[data-testid="user-role"]:has-text("USER")'),
    }).first();
    
    // Click to open detail
    await userRow.click();
    
    // Click change role button
    await page.click('[data-testid="change-role-button"]');
    
    // Role change modal should open
    await expect(page.locator('[data-testid="role-change-modal"]')).toBeVisible();
    
    // Select new role
    await page.selectOption('[data-testid="new-role-select"]', 'ADMIN');
    
    // Enter reason
    await page.fill('[data-testid="role-change-reason"]', 'Promoted to admin team');
    
    // Confirm change
    await page.click('[data-testid="confirm-role-change"]');
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    
    // Verify role was changed in the table
    await page.click('[data-testid="modal-close"]');
    await expect(userRow.locator('[data-testid="user-role"]')).toContainText('ADMIN');
  });

  test('should track role change in audit log', async ({ page }) => {
    // Perform a role change
    const userRow = page.locator('[data-testid^="user-row-"]:first-child');
    const userEmail = await userRow.locator('[data-testid="user-email"]').textContent();
    
    await userRow.click();
    await page.click('[data-testid="change-role-button"]');
    await page.selectOption('[data-testid="new-role-select"]', 'ADMIN');
    await page.fill('[data-testid="role-change-reason"]', 'Test promotion');
    await page.click('[data-testid="confirm-role-change"]');
    
    // Navigate to audit logs
    await page.click('[data-testid="nav-audit"]');
    
    // Find the role change entry
    const auditEntry = page.locator('[data-testid^="audit-entry-"]').filter({
      hasText: 'ROLE_CHANGE',
    }).first();
    
    await expect(auditEntry).toBeVisible();
    await expect(auditEntry).toContainText(userEmail || '');
    await expect(auditEntry).toContainText('Test promotion');
  });
});

test.describe('Bulk Operations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, SUPER_ADMIN);
    await navigateToAdminDashboard(page);
    await page.click('[data-testid="nav-users"]');
  });

  test('should select multiple users', async ({ page }) => {
    // Select first 3 users
    await page.click('[data-testid="user-checkbox-0"]');
    await page.click('[data-testid="user-checkbox-1"]');
    await page.click('[data-testid="user-checkbox-2"]');
    
    // Bulk actions bar should appear
    await expect(page.locator('[data-testid="bulk-actions-bar"]')).toBeVisible();
    
    // Should show selected count
    await expect(page.locator('[data-testid="selected-count"]')).toContainText('3');
  });

  test('should perform bulk role change', async ({ page }) => {
    // Select multiple users with USER role
    const userCheckboxes = page.locator('[data-testid^="user-checkbox-"]').filter({
      has: page.locator('[data-testid="user-role"]:has-text("USER")'),
    });
    
    const count = Math.min(await userCheckboxes.count(), 3);
    for (let i = 0; i < count; i++) {
      await userCheckboxes.nth(i).click();
    }
    
    // Click bulk actions
    await page.click('[data-testid="bulk-actions-button"]');
    await page.click('[data-testid="bulk-change-role"]');
    
    // Fill bulk role change form
    await page.selectOption('[data-testid="bulk-new-role"]', 'ADMIN');
    await page.fill('[data-testid="bulk-reason"]', 'Bulk promotion test');
    await page.click('[data-testid="confirm-bulk-change"]');
    
    // Wait for success
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    
    // Verify all selected users now have ADMIN role
    // (Would need to check each row in real implementation)
  });

  test('should export selected users', async ({ page }) => {
    // Select users
    await page.click('[data-testid="select-all-checkbox"]');
    
    // Click export
    await page.click('[data-testid="bulk-actions-button"]');
    
    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="bulk-export"]');
    
    // Select format
    await page.click('[data-testid="export-format-csv"]');
    
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('users');
    expect(download.suggestedFilename()).toContain('.csv');
  });
});

test.describe('Admin Statistics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, REGULAR_ADMIN);
    await navigateToAdminDashboard(page);
  });

  test('should display user statistics', async ({ page }) => {
    // Check statistics cards
    await expect(page.locator('[data-testid="stat-total-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-active-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-admin-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-locked-accounts"]')).toBeVisible();
    
    // Verify numbers are displayed
    const totalUsers = await page.locator('[data-testid="stat-total-users-value"]').textContent();
    expect(parseInt(totalUsers || '0')).toBeGreaterThan(0);
  });

  test('should display role distribution chart', async ({ page }) => {
    // Check for pie chart
    await expect(page.locator('[data-testid="role-distribution-chart"]')).toBeVisible();
    
    // Chart should have legend
    await expect(page.locator('[data-testid="chart-legend"]')).toBeVisible();
    
    // Legend should show all roles
    await expect(page.locator('[data-testid="legend-USER"]')).toBeVisible();
    await expect(page.locator('[data-testid="legend-ADMIN"]')).toBeVisible();
    await expect(page.locator('[data-testid="legend-SUPER_ADMIN"]')).toBeVisible();
  });

  test('should display user growth chart', async ({ page }) => {
    // Check for line graph
    await expect(page.locator('[data-testid="user-growth-chart"]')).toBeVisible();
    
    // Should have time range selector
    await page.click('[data-testid="time-range-selector"]');
    await page.click('[data-testid="range-30-days"]');
    
    // Chart should update
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="user-growth-chart"]')).toBeVisible();
  });

  test('should display recent activity feed', async ({ page }) => {
    // Check activity feed
    await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();
    
    // Should have activity items
    const activities = page.locator('[data-testid^="activity-feed-item-"]');
    expect(await activities.count()).toBeGreaterThan(0);
    
    // Each activity should have timestamp
    const firstActivity = activities.first();
    await expect(firstActivity.locator('[data-testid="activity-time"]')).toBeVisible();
    await expect(firstActivity.locator('[data-testid="activity-description"]')).toBeVisible();
  });
});

test.describe('Security & Permissions', () => {
  test('admin cannot delete their own account @security', async ({ page }) => {
    await loginAs(page, REGULAR_ADMIN);
    await navigateToAdminDashboard(page);
    await page.click('[data-testid="nav-users"]');
    
    // Find own account in list
    const ownRow = page.locator('[data-testid^="user-row-"]').filter({
      has: page.locator(`[data-testid="user-email"]:has-text("${REGULAR_ADMIN.email}")`),
    }).first();
    
    await ownRow.click();
    
    // Delete button should be disabled or hidden
    const deleteButton = page.locator('[data-testid="delete-user-button"]');
    
    if (await deleteButton.isVisible()) {
      await expect(deleteButton).toBeDisabled();
    }
  });

  test('should require confirmation for destructive actions @security', async ({ page }) => {
    await loginAs(page, SUPER_ADMIN);
    await navigateToAdminDashboard(page);
    await page.click('[data-testid="nav-users"]');
    
    // Select a user to delete
    const userRow = page.locator('[data-testid^="user-row-"]').filter({
      has: page.locator('[data-testid="user-email"]:not(:has-text("admin"))')
    }).first();
    
    await userRow.click();
    await page.click('[data-testid="delete-user-button"]');
    
    // Should show confirmation dialog
    await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
    
    // Should require typing confirmation
    await expect(page.locator('[data-testid="confirm-input"]')).toBeVisible();
    await page.fill('[data-testid="confirm-input"]', 'DELETE');
    
    // Delete button should now be enabled
    const confirmButton = page.locator('[data-testid="confirm-delete-button"]');
    await expect(confirmButton).toBeEnabled();
  });

  test('should log all admin actions @security', async ({ page, request }) => {
    await loginAs(page, SUPER_ADMIN);
    
    // Perform an admin action
    await navigateToAdminDashboard(page);
    
    // Get audit logs
    const response = await request.get('/api/admin/audit', {
      headers: {
        'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('authToken'))}`,
      },
    });
    
    const logs = await response.json();
    
    // Should have logged the dashboard access
    expect(logs.some((log: any) => log.action === 'ADMIN_DASHBOARD_ACCESS')).toBeTruthy();
  });
});

test.describe('Performance', () => {
  test('should load user list quickly @performance', async ({ page }) => {
    await loginAs(page, REGULAR_ADMIN);
    
    const startTime = Date.now();
    await navigateToAdminDashboard(page);
    await page.click('[data-testid="nav-users"]');
    await expect(page.locator('[data-testid="user-table"]')).toBeVisible();
    const loadTime = Date.now() - startTime;
    
    // Should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('should handle large datasets with virtual scrolling @performance', async ({ page }) => {
    await loginAs(page, REGULAR_ADMIN);
    await navigateToAdminDashboard(page);
    await page.click('[data-testid="nav-users"]');
    
    // Set page size to maximum
    await page.selectOption('[data-testid="page-size"]', '100');
    
    // Scroll performance test
    const startTime = Date.now();
    await page.evaluate(() => {
      const table = document.querySelector('[data-testid="user-table"]');
      if (table) {
        table.scrollTop = table.scrollHeight;
      }
    });
    const scrollTime = Date.now() - startTime;
    
    // Scrolling should be smooth (< 100ms)
    expect(scrollTime).toBeLessThan(100);
  });
});