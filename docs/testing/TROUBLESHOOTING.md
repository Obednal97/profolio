# 🔧 Test Troubleshooting Guide

## Common Test Issues & Solutions

### 1. All Playwright Tests Failing

**Error**: `Executable doesn't exist at /Users/.../ms-playwright/...`

**Solution**:
```bash
cd frontend
pnpm exec playwright install --with-deps
```

This installs the required browser binaries for Playwright.

### 2. Lighthouse Performance Test Failing

**Error**: `No Chrome installations found`

**Solution Options**:

**Option A - Install Google Chrome:**
```bash
# macOS
brew install --cask google-chrome

# Linux
sudo apt-get install google-chrome-stable
```

**Option B - Use Chromium from Playwright:**
```bash
# Set CHROME_PATH to use Playwright's Chromium
export CHROME_PATH="$(pnpm exec playwright show chromium | grep 'executable' | awk '{print $2}')"
```

### 3. Tests Can't Connect to Application

**Error**: Tests timeout trying to reach `localhost:3000` or `localhost:3001`

**Solution**:
```bash
# Ensure both services are running
cd backend && pnpm run dev  # Terminal 1
cd frontend && pnpm run dev # Terminal 2

# Or use the test runner with auto-start
./scripts/run-tests.sh e2e true
```

### 4. Port Already in Use

**Error**: `Port 3000/3001 is already in use`

**Solution**:
```bash
# Kill processes on test ports
lsof -ti:3000,3001 | xargs kill -9

# Or use the cleanup script
./scripts/cleanup-ports.sh
```

### 5. Test Reports Not Generated

**Error**: `./reports/lighthouse-report.json cannot be written`

**Solution**:
```bash
# Create reports directory
cd frontend
mkdir -p reports
```

## Quick Setup Script

Run this to fix most test issues:
```bash
./scripts/setup-test-environment.sh
```

## Test Execution Guide

### Basic Test Commands

```bash
# Run all E2E tests
cd frontend && pnpm run test:e2e

# Run with visual UI
cd frontend && pnpm run test:e2e:ui

# Run security tests only
cd frontend && pnpm run test:e2e:security

# Run performance tests (requires Chrome)
cd frontend && pnpm run test:performance
```

### Using the Test Runner

The test runner script handles service startup automatically:

```bash
# Run E2E tests (auto-starts services if needed)
./scripts/run-tests.sh e2e true

# Run with UI
./scripts/run-tests.sh e2e:ui true

# Run without auto-start (services must be running)
./scripts/run-tests.sh e2e false
```

## Browser Support

Playwright tests run on multiple browsers:
- Chromium
- Firefox
- WebKit (Safari)
- Mobile Chrome
- Mobile Safari
- Microsoft Edge
- Google Chrome

To install all browsers:
```bash
cd frontend
pnpm exec playwright install --with-deps chromium firefox webkit
```

## Debugging Failed Tests

### View Test Reports

After tests run, view the HTML report:
```bash
cd frontend
pnpm exec playwright show-report
```

### Debug Single Test

```bash
# Run specific test in debug mode
cd frontend
pnpm exec playwright test auth.spec.ts --debug
```

### View Test Traces

```bash
# Run with trace recording
cd frontend
pnpm exec playwright test --trace on

# View trace
pnpm exec playwright show-trace trace.zip
```

## CI/CD Test Failures

If tests fail in GitHub Actions but pass locally:

1. **Check Node version**: CI uses Node 18
2. **Check environment variables**: Ensure all required env vars are set
3. **Check service startup**: CI needs explicit service configuration
4. **Check browser versions**: Update Playwright to match CI

## Performance Tips

1. **Run tests in parallel** (when possible):
   ```bash
   pnpm exec playwright test --workers 4
   ```

2. **Run specific test suites**:
   ```bash
   pnpm exec playwright test auth.spec.ts
   ```

3. **Skip visual regression tests** for faster runs:
   ```bash
   pnpm exec playwright test --grep-invert "visual"
   ```

## Need Help?

- Check test logs in `frontend/playwright-report/`
- Review `frontend/playwright.config.ts` for configuration
- Ensure all dependencies are installed: `cd frontend && pnpm install`