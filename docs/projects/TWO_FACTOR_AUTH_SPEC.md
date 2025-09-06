# Two-Factor Authentication (2FA) Implementation Specification

## 1. Executive Summary

This specification outlines the implementation of Two-Factor Authentication (2FA) for Profolio, adding an additional security layer beyond password authentication. The implementation will use Time-based One-Time Password (TOTP) algorithm, compatible with standard authenticator apps like Google Authenticator, Authy, and 1Password.

**Key Benefits:**
- Significantly enhanced account security
- Protection against password compromise
- Industry-standard TOTP implementation
- Seamless integration with existing auth flows

**Estimated Timeline:** 2-3 weeks
**Complexity:** High
**Priority:** P1 (Critical Security Feature)

## 2. Current State Analysis

### Existing Authentication System

Currently, Profolio supports two authentication modes:
- **Local Mode:** JWT-based authentication with email/password
- **Firebase Mode:** OAuth providers (Google) with Firebase token validation

**Current Auth Controller:** `backend/src/app/api/auth/auth.controller.ts`
- Rate limiting implemented for login attempts
- Password hashing with bcrypt
- JWT token generation with 24-hour expiry
- Firebase token exchange for OAuth users

**User Model:** `backend/prisma/schema.prisma`
```prisma
model User {
  id                  String         @id @default(uuid())
  email               String         @unique
  password            String         // Empty for OAuth users
  provider            String?        // "firebase" or null
  emailVerified       Boolean        @default(false)
  // ... other fields
}
```

### Security Gaps
1. No additional authentication factor beyond password
2. Vulnerable to password compromise
3. No backup authentication methods
4. Limited account recovery options

## 3. Proposed Solution

### Overview
Implement TOTP-based 2FA as an optional security feature that users can enable. The system will:
- Generate user-specific secrets
- Provide QR codes for authenticator app setup
- Validate TOTP codes during login
- Generate backup codes for recovery
- Support 2FA bypass for account recovery

### User Experience Flow

#### Setup Flow
1. User navigates to Settings → Security
2. Clicks "Enable Two-Factor Authentication"
3. Enters current password for verification
4. System generates secret and displays QR code
5. User scans QR code with authenticator app
6. User enters verification code to confirm setup
7. System displays backup codes (one-time view)
8. User confirms backup codes saved

#### Login Flow with 2FA
1. User enters email and password
2. If credentials valid AND 2FA enabled:
   - Prompt for 6-digit TOTP code
   - Validate code against secret
   - Allow 30-second time window
3. On success, generate JWT token
4. On failure, increment failed attempts

#### Recovery Flow
1. User selects "Use backup code" option
2. Enters one of their backup codes
3. System validates and marks code as used
4. Prompts user to set up 2FA again

## 4. Technical Architecture

### Database Schema Changes

```prisma
// Add to schema.prisma

model TwoFactorAuth {
  id             String   @id @default(uuid())
  userId         String   @unique
  secret         String   // Encrypted TOTP secret
  enabled        Boolean  @default(false)
  verifiedAt     DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  backupCodes    TwoFactorBackupCode[]
  
  @@index([userId, enabled])
}

model TwoFactorBackupCode {
  id             String   @id @default(uuid())
  twoFactorId    String
  code           String   // Hashed backup code
  usedAt         DateTime?
  createdAt      DateTime @default(now())
  
  twoFactor      TwoFactorAuth @relation(fields: [twoFactorId], references: [id], onDelete: Cascade)
  
  @@unique([twoFactorId, code])
  @@index([twoFactorId])
}

model TwoFactorVerification {
  id             String   @id @default(uuid())
  userId         String
  token          String   // Temporary verification token
  expiresAt      DateTime
  createdAt      DateTime @default(now())
  
  @@index([token])
  @@index([userId, expiresAt])
}
```

### Backend Implementation

#### Dependencies
```json
{
  "otplib": "^12.0.1",
  "qrcode": "^1.5.3"
}
```

#### Service Layer (`two-factor.service.ts`)
```typescript
@Injectable()
export class TwoFactorService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService
  ) {}

  async generateSecret(userId: string): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    // Generate TOTP secret
    const secret = authenticator.generateSecret();
    
    // Generate QR code
    const otpauth = authenticator.keyuri(
      user.email,
      'Profolio',
      secret
    );
    const qrCode = await QRCode.toDataURL(otpauth);
    
    // Generate backup codes
    const backupCodes = this.generateBackupCodes(10);
    
    // Store encrypted secret
    await this.storeTwoFactorSetup(userId, secret, backupCodes);
    
    return { secret, qrCode, backupCodes };
  }

  async verifyToken(userId: string, token: string): Promise<boolean> {
    const twoFactor = await this.prisma.twoFactorAuth.findUnique({
      where: { userId }
    });
    
    if (!twoFactor) return false;
    
    const secret = this.encryptionService.decrypt(twoFactor.secret);
    return authenticator.verify({
      token,
      secret,
      window: 1 // Allow 30 seconds before/after
    });
  }

  private generateBackupCodes(count: number): string[] {
    return Array.from({ length: count }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
  }
}
```

#### Controller Updates (`auth.controller.ts`)
```typescript
@Post('2fa/setup')
@UseGuards(JwtAuthGuard)
async setupTwoFactor(@Req() req) {
  return this.twoFactorService.generateSecret(req.user.id);
}

@Post('2fa/verify')
@UseGuards(JwtAuthGuard)
async verifyTwoFactor(@Body() dto: VerifyTwoFactorDto) {
  const isValid = await this.twoFactorService.verifyToken(
    dto.userId,
    dto.token
  );
  
  if (isValid) {
    await this.twoFactorService.enableTwoFactor(dto.userId);
    return { success: true };
  }
  
  throw new UnauthorizedException('Invalid verification code');
}

@Post('signin')
async signIn(@Body() dto: SignInDto) {
  // Existing password validation...
  
  const twoFactor = await this.twoFactorService.getTwoFactorStatus(user.id);
  
  if (twoFactor?.enabled) {
    // Return partial token for 2FA verification
    return {
      requiresTwoFactor: true,
      verificationToken: this.generateVerificationToken(user.id)
    };
  }
  
  // Normal JWT generation for non-2FA users
  return { token: this.generateToken(user) };
}

@Post('2fa/complete')
async completeTwoFactor(@Body() dto: CompleteTwoFactorDto) {
  const userId = await this.validateVerificationToken(dto.verificationToken);
  
  const isValid = await this.twoFactorService.verifyToken(
    userId,
    dto.code
  );
  
  if (!isValid) {
    throw new UnauthorizedException('Invalid 2FA code');
  }
  
  return { token: this.generateToken(user) };
}
```

### Frontend Implementation

#### Components Structure
```
frontend/src/components/settings/security/
├── TwoFactorSetup.tsx       // Setup wizard component
├── TwoFactorVerification.tsx // Login verification
├── BackupCodesDisplay.tsx    // Backup codes display
├── QRCodeDisplay.tsx         // QR code with instructions
└── TwoFactorStatus.tsx       // Current 2FA status card
```

#### Setup Component (`TwoFactorSetup.tsx`)
```typescript
export function TwoFactorSetup() {
  const [step, setStep] = useState<'password' | 'qr' | 'verify' | 'backup'>('password');
  const [qrCode, setQrCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  
  const setupMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiClient.post('/api/auth/2fa/setup', { password });
      return response.data;
    },
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setBackupCodes(data.backupCodes);
      setStep('qr');
    }
  });
  
  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiClient.post('/api/auth/2fa/verify', { code });
    },
    onSuccess: () => {
      setStep('backup');
    }
  });
  
  return (
    <div className="liquid-glass-card p-6">
      {step === 'password' && (
        <PasswordVerification onVerify={setupMutation.mutate} />
      )}
      
      {step === 'qr' && (
        <QRCodeDisplay 
          qrCode={qrCode}
          onContinue={() => setStep('verify')}
        />
      )}
      
      {step === 'verify' && (
        <CodeVerification onVerify={verifyMutation.mutate} />
      )}
      
      {step === 'backup' && (
        <BackupCodesDisplay 
          codes={backupCodes}
          onComplete={() => window.location.reload()}
        />
      )}
    </div>
  );
}
```

#### Login Verification (`TwoFactorVerification.tsx`)
```typescript
export function TwoFactorVerification({ 
  verificationToken,
  onSuccess 
}: TwoFactorVerificationProps) {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  
  const verifyMutation = useMutation({
    mutationFn: async () => {
      const endpoint = useBackupCode 
        ? '/api/auth/2fa/backup'
        : '/api/auth/2fa/complete';
        
      return apiClient.post(endpoint, {
        verificationToken,
        code
      });
    },
    onSuccess: (data) => {
      // Store token and redirect
      localStorage.setItem('token', data.token);
      onSuccess();
    }
  });
  
  return (
    <div className="liquid-glass-card p-6">
      <h2 className="text-xl font-semibold mb-4">
        Two-Factor Authentication
      </h2>
      
      <p className="text-sm text-gray-600 mb-4">
        {useBackupCode 
          ? 'Enter one of your backup codes'
          : 'Enter the 6-digit code from your authenticator app'}
      </p>
      
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
        className="w-full p-3 border rounded-lg"
        maxLength={useBackupCode ? 9 : 6}
        data-testid="2fa-code-input"
      />
      
      <button
        onClick={() => verifyMutation.mutate()}
        disabled={code.length < 6}
        className="w-full mt-4 bg-blue-600 text-white p-3 rounded-lg"
        data-testid="2fa-verify-button"
      >
        Verify
      </button>
      
      <button
        onClick={() => setUseBackupCode(!useBackupCode)}
        className="w-full mt-2 text-sm text-blue-600"
        data-testid="2fa-toggle-backup"
      >
        {useBackupCode ? 'Use authenticator app' : 'Use backup code'}
      </button>
    </div>
  );
}
```

## 5. Database Changes

### Migration Script
```sql
-- Create TwoFactorAuth table
CREATE TABLE "TwoFactorAuth" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "TwoFactorAuth_pkey" PRIMARY KEY ("id")
);

-- Create unique index
CREATE UNIQUE INDEX "TwoFactorAuth_userId_key" ON "TwoFactorAuth"("userId");
CREATE INDEX "TwoFactorAuth_userId_enabled_idx" ON "TwoFactorAuth"("userId", "enabled");

-- Add foreign key
ALTER TABLE "TwoFactorAuth" 
ADD CONSTRAINT "TwoFactorAuth_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- Create TwoFactorBackupCode table
CREATE TABLE "TwoFactorBackupCode" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "twoFactorId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "TwoFactorBackupCode_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "TwoFactorBackupCode_twoFactorId_code_key" 
ON "TwoFactorBackupCode"("twoFactorId", "code");

CREATE INDEX "TwoFactorBackupCode_twoFactorId_idx" 
ON "TwoFactorBackupCode"("twoFactorId");
```

## 6. API Changes

### New Endpoints

#### POST `/api/auth/2fa/setup`
**Auth Required:** Yes  
**Request Body:**
```json
{
  "password": "string"
}
```
**Response:**
```json
{
  "qrCode": "data:image/png;base64,...",
  "backupCodes": ["XXXX-XXXX", "YYYY-YYYY", ...]
}
```

#### POST `/api/auth/2fa/verify`
**Auth Required:** Yes  
**Request Body:**
```json
{
  "code": "123456"
}
```
**Response:**
```json
{
  "success": true
}
```

#### POST `/api/auth/2fa/complete`
**Auth Required:** No  
**Request Body:**
```json
{
  "verificationToken": "string",
  "code": "123456"
}
```
**Response:**
```json
{
  "token": "jwt.token.here",
  "user": { ... }
}
```

#### POST `/api/auth/2fa/disable`
**Auth Required:** Yes  
**Request Body:**
```json
{
  "password": "string",
  "code": "123456"
}
```
**Response:**
```json
{
  "success": true
}
```

#### GET `/api/auth/2fa/status`
**Auth Required:** Yes  
**Response:**
```json
{
  "enabled": true,
  "verifiedAt": "2025-01-06T10:00:00Z",
  "backupCodesRemaining": 8
}
```

### Modified Endpoints

#### POST `/api/auth/signin`
**Modified Response (when 2FA enabled):**
```json
{
  "requiresTwoFactor": true,
  "verificationToken": "temporary.token.here"
}
```

## 7. UI/UX Design

### Settings Page - Security Section

```
┌─────────────────────────────────────────────┐
│ Security Settings                           │
├─────────────────────────────────────────────┤
│ Two-Factor Authentication                   │
│ ┌─────────────────────────────────────────┐ │
│ │ Status: [Enabled ✓] / [Disabled ✗]     │ │
│ │                                         │ │
│ │ Add an extra layer of security to your │ │
│ │ account with 2FA                       │ │
│ │                                         │ │
│ │ [Enable 2FA] / [Manage 2FA]           │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Setup Flow Wireframes

#### Step 1: Password Verification
```
┌─────────────────────────────────────────────┐
│ Set Up Two-Factor Authentication           │
├─────────────────────────────────────────────┤
│ Verify your password to continue           │
│                                             │
│ Password: [_______________]                │
│                                             │
│ [Cancel]                    [Continue →]   │
└─────────────────────────────────────────────┘
```

#### Step 2: QR Code Display
```
┌─────────────────────────────────────────────┐
│ Scan QR Code                               │
├─────────────────────────────────────────────┤
│          ┌──────────────┐                  │
│          │              │                  │
│          │   QR CODE    │                  │
│          │              │                  │
│          └──────────────┘                  │
│                                             │
│ 1. Install an authenticator app            │
│ 2. Scan this QR code                       │
│ 3. Enter the 6-digit code                  │
│                                             │
│ Manual entry: XXXX XXXX XXXX XXXX         │
│                                             │
│ [← Back]                    [Continue →]   │
└─────────────────────────────────────────────┘
```

#### Step 3: Code Verification
```
┌─────────────────────────────────────────────┐
│ Verify Setup                               │
├─────────────────────────────────────────────┤
│ Enter the 6-digit code from your app       │
│                                             │
│        [_] [_] [_] [_] [_] [_]            │
│                                             │
│ [← Back]                      [Verify →]   │
└─────────────────────────────────────────────┘
```

#### Step 4: Backup Codes
```
┌─────────────────────────────────────────────┐
│ Save Your Backup Codes                     │
├─────────────────────────────────────────────┤
│ ⚠️ Save these codes in a secure place      │
│                                             │
│ • XXXX-XXXX    • YYYY-YYYY                │
│ • ZZZZ-ZZZZ    • AAAA-AAAA                │
│ • BBBB-BBBB    • CCCC-CCCC                │
│ • DDDD-DDDD    • EEEE-EEEE                │
│ • FFFF-FFFF    • GGGG-GGGG                │
│                                             │
│ [📋 Copy]        [⬇️ Download]             │
│                                             │
│ ☐ I have saved my backup codes             │
│                                             │
│                            [Complete ✓]    │
└─────────────────────────────────────────────┘
```

## 8. Security Considerations

### Threat Model

1. **TOTP Secret Exposure**
   - Risk: Database compromise exposes secrets
   - Mitigation: AES-256-GCM encryption at rest
   - Implementation: Use existing EncryptionService

2. **Phishing Attacks**
   - Risk: Users entering codes on fake sites
   - Mitigation: Clear domain display in authenticator apps
   - Implementation: Include "Profolio" in keyuri

3. **Time Synchronization**
   - Risk: Server/client time mismatch
   - Mitigation: 30-second window (1 step before/after)
   - Implementation: `window: 1` in otplib config

4. **Backup Code Security**
   - Risk: Backup codes compromised
   - Mitigation: Hash with bcrypt, single-use only
   - Implementation: Mark as used after successful auth

5. **Brute Force Attacks**
   - Risk: Automated code guessing
   - Mitigation: Rate limiting on verification attempts
   - Implementation: Extend existing rate limiter

### Security Requirements

- **Encryption:** All secrets encrypted with AES-256-GCM
- **Hashing:** Backup codes hashed with bcrypt (cost 10)
- **Rate Limiting:** Max 5 verification attempts per 5 minutes
- **Session Security:** Verification tokens expire in 5 minutes
- **Audit Logging:** Log all 2FA events (setup, verify, disable)
- **Recovery:** Require both password and code to disable 2FA

### Compliance Considerations

- **GDPR:** Users can disable 2FA and delete all related data
- **Accessibility:** Provide manual secret entry option
- **Privacy:** No third-party services for TOTP generation

## 9. Testing Strategy

### Unit Tests

#### Backend Tests
```typescript
// two-factor.service.spec.ts
describe('TwoFactorService', () => {
  it('should generate valid TOTP secret', async () => {
    const result = await service.generateSecret(userId);
    expect(result.secret).toHaveLength(32);
    expect(result.qrCode).toContain('data:image/png');
    expect(result.backupCodes).toHaveLength(10);
  });
  
  it('should verify valid TOTP token', async () => {
    const token = authenticator.generate(secret);
    const isValid = await service.verifyToken(userId, token);
    expect(isValid).toBe(true);
  });
  
  it('should reject expired TOTP token', async () => {
    // Test with token from 2 minutes ago
    const oldToken = authenticator.generate(secret, Date.now() - 120000);
    const isValid = await service.verifyToken(userId, oldToken);
    expect(isValid).toBe(false);
  });
});
```

#### Frontend Tests
```typescript
// TwoFactorSetup.test.tsx
describe('TwoFactorSetup', () => {
  it('should progress through setup steps', async () => {
    render(<TwoFactorSetup />);
    
    // Step 1: Password
    const passwordInput = screen.getByTestId('password-input');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(screen.getByText('Continue'));
    
    // Step 2: QR Code
    await waitFor(() => {
      expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('Continue'));
    
    // Step 3: Verify
    const codeInput = screen.getByTestId('2fa-code-input');
    await userEvent.type(codeInput, '123456');
    await userEvent.click(screen.getByText('Verify'));
    
    // Step 4: Backup codes
    await waitFor(() => {
      expect(screen.getByText('Save Your Backup Codes')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests

```typescript
// tests/e2e/two-factor-auth.spec.ts
test.describe('Two-Factor Authentication', () => {
  test('should complete full 2FA setup flow @security', async ({ page }) => {
    // Login
    await loginAsTestUser(page);
    
    // Navigate to settings
    await page.goto('/app/settings');
    await page.click('[data-testid="security-tab"]');
    
    // Start 2FA setup
    await page.click('[data-testid="enable-2fa-button"]');
    
    // Enter password
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="continue-button"]');
    
    // Wait for QR code
    await page.waitForSelector('[data-testid="qr-code"]');
    
    // Get secret from page for testing
    const secret = await page.getAttribute('[data-testid="manual-secret"]', 'data-secret');
    
    // Generate valid TOTP code
    const token = authenticator.generate(secret);
    
    // Enter verification code
    await page.fill('[data-testid="2fa-code-input"]', token);
    await page.click('[data-testid="verify-button"]');
    
    // Verify backup codes displayed
    await page.waitForSelector('[data-testid="backup-codes"]');
    
    // Complete setup
    await page.check('[data-testid="backup-codes-saved"]');
    await page.click('[data-testid="complete-button"]');
    
    // Verify 2FA is enabled
    await expect(page.locator('[data-testid="2fa-status"]')).toContainText('Enabled');
  });
  
  test('should require 2FA code on login @security', async ({ page }) => {
    // Setup user with 2FA enabled
    const { email, password, secret } = await createUserWith2FA();
    
    // Attempt login
    await page.goto('/signin');
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="signin-button"]');
    
    // Should show 2FA prompt
    await page.waitForSelector('[data-testid="2fa-verification"]');
    
    // Enter valid code
    const token = authenticator.generate(secret);
    await page.fill('[data-testid="2fa-code-input"]', token);
    await page.click('[data-testid="verify-button"]');
    
    // Should redirect to dashboard
    await page.waitForURL('/app/dashboard');
  });
  
  test('should handle backup codes @security', async ({ page }) => {
    const { email, password, backupCode } = await createUserWith2FAAndBackupCodes();
    
    // Login with backup code
    await page.goto('/signin');
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="signin-button"]');
    
    // Use backup code option
    await page.click('[data-testid="use-backup-code"]');
    await page.fill('[data-testid="backup-code-input"]', backupCode);
    await page.click('[data-testid="verify-button"]');
    
    // Should succeed
    await page.waitForURL('/app/dashboard');
  });
});
```

### Security Tests

```typescript
test.describe('2FA Security Tests', () => {
  test('should rate limit verification attempts @security', async ({ page }) => {
    // Attempt multiple failed verifications
    for (let i = 0; i < 6; i++) {
      await page.fill('[data-testid="2fa-code-input"]', '000000');
      await page.click('[data-testid="verify-button"]');
    }
    
    // Should show rate limit error
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Too many attempts');
  });
  
  test('should prevent XSS in QR code generation @security', async ({ page }) => {
    // Attempt XSS in setup
    const xssPayload = '<script>alert("XSS")</script>';
    // Test various injection points
  });
  
  test('should prevent timing attacks @security', async ({ page }) => {
    // Measure response times for valid vs invalid codes
    // Should be constant-time comparison
  });
});
```

## 10. Migration Plan

### Phase 1: Backend Implementation (Week 1)
1. **Day 1-2:** Database schema and migrations
2. **Day 3-4:** TwoFactorService implementation
3. **Day 5:** Controller updates and API endpoints
4. **Day 6-7:** Unit tests and security review

### Phase 2: Frontend Implementation (Week 2)
1. **Day 8-9:** Setup flow components
2. **Day 10-11:** Login verification flow
3. **Day 12:** Settings page integration
4. **Day 13-14:** Frontend tests

### Phase 3: Integration & Testing (Week 3)
1. **Day 15-16:** E2E test suite
2. **Day 17:** Security testing
3. **Day 18:** Performance testing
4. **Day 19:** Documentation
5. **Day 20-21:** Bug fixes and polish

### Rollout Strategy

#### Stage 1: Internal Testing
- Enable for admin accounts only
- Monitor for issues
- Gather feedback

#### Stage 2: Opt-in Beta
- Allow users to enable via feature flag
- Provide clear documentation
- Monitor adoption and issues

#### Stage 3: General Availability
- Enable for all users as optional feature
- Promote via in-app notifications
- Consider making mandatory for admin users

### Rollback Plan

If critical issues discovered:
1. Disable 2FA verification requirement
2. Keep setup disabled
3. Maintain existing 2FA data
4. Fix issues and re-deploy

## 11. Success Metrics

### Adoption Metrics
- **Target:** 30% of active users enable 2FA within 3 months
- **Admin adoption:** 100% of admin users within 1 month
- **Setup completion rate:** >80% of users who start setup

### Security Metrics
- **Account compromise reduction:** 90% reduction in unauthorized access
- **Failed login attempts:** Decrease by 50%
- **Support tickets:** <5% increase in auth-related tickets

### Performance Metrics
- **Setup flow completion:** <2 minutes average
- **Login with 2FA:** <5 seconds additional time
- **API response times:** <100ms for verification

### User Satisfaction
- **NPS for 2FA users:** >8/10
- **Setup flow satisfaction:** >4/5 stars
- **Support ticket sentiment:** >80% positive

## 12. Risk Assessment

### High Risks

1. **Secret Key Compromise**
   - Impact: Complete 2FA bypass
   - Likelihood: Low
   - Mitigation: Encryption at rest, secure key management
   - Contingency: Force reset all 2FA, require re-enrollment

2. **User Lockout**
   - Impact: Users unable to access accounts
   - Likelihood: Medium
   - Mitigation: Backup codes, admin override capability
   - Contingency: Support team recovery process

### Medium Risks

3. **Poor Adoption**
   - Impact: Security goals not met
   - Likelihood: Medium
   - Mitigation: User education, incentives
   - Contingency: Consider mandatory for high-value accounts

4. **Performance Degradation**
   - Impact: Slower login times
   - Likelihood: Low
   - Mitigation: Caching, optimized queries
   - Contingency: Performance tuning, scaling

### Low Risks

5. **Authenticator App Compatibility**
   - Impact: Some users cannot use preferred apps
   - Likelihood: Low
   - Mitigation: Standard TOTP implementation
   - Contingency: Support multiple algorithms

## 13. Timeline & Milestones

### Week 1: Backend Foundation
- **Milestone 1.1:** Database schema implemented and migrated
- **Milestone 1.2:** TwoFactorService with full test coverage
- **Milestone 1.3:** API endpoints functional with Postman tests
- **Deliverable:** Backend PR ready for review

### Week 2: Frontend Implementation
- **Milestone 2.1:** Setup flow complete with all steps
- **Milestone 2.2:** Login integration working end-to-end
- **Milestone 2.3:** Settings page shows 2FA status
- **Deliverable:** Frontend PR with screenshots

### Week 3: Testing & Polish
- **Milestone 3.1:** E2E test suite passing
- **Milestone 3.2:** Security audit complete
- **Milestone 3.3:** Documentation updated
- **Deliverable:** Feature ready for release

### Success Criteria
- [ ] All unit tests passing (>90% coverage)
- [ ] All E2E tests passing
- [ ] Security review approved
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Code review approved
- [ ] No critical bugs in staging

### Post-Launch Monitoring (Week 4+)
- Daily adoption metrics
- Error rate monitoring
- User feedback collection
- Performance metrics tracking
- Security incident monitoring

---

## Appendix A: Technical References

- [RFC 6238 - TOTP](https://datatracker.ietf.org/doc/html/rfc6238)
- [otplib Documentation](https://github.com/yeojz/otplib)
- [OWASP 2FA Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)

## Appendix B: Alternative Approaches Considered

1. **SMS-based 2FA:** Rejected due to SIM swapping risks
2. **Hardware tokens:** Rejected due to complexity and cost
3. **WebAuthn:** Deferred to future enhancement
4. **Email-based codes:** Rejected as not true second factor

## Appendix C: Future Enhancements

1. **WebAuthn/Passkeys support**
2. **Multiple 2FA methods per account**
3. **Trusted devices management**
4. **Risk-based authentication**
5. **Admin-enforced 2FA policies**