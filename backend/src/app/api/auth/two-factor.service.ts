import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { EncryptionService } from '@/common/encryption.service';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TwoFactorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {
    // Configure otplib
    authenticator.options = {
      window: 1, // Allow 30 seconds before/after
      step: 30,  // 30 second intervals
    };
  }

  /**
   * Generate a new TOTP secret for a user
   */
  async generateSecret(userId: string): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { twoFactorAuth: true },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Check if 2FA is already enabled
    if (user.twoFactorAuth?.enabled) {
      throw new HttpException(
        '2FA is already enabled for this account',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Generate TOTP secret
    const secret = authenticator.generateSecret();

    // Generate QR code
    const otpauth = authenticator.keyuri(
      user.email,
      'Profolio',
      secret,
    );
    const qrCode = await QRCode.toDataURL(otpauth);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(10);

    // Store the setup temporarily (not enabled yet)
    await this.storeTwoFactorSetup(userId, secret, backupCodes);

    return { 
      secret, // Return plaintext for manual entry
      qrCode, 
      backupCodes,
    };
  }

  /**
   * Verify a TOTP token and enable 2FA
   */
  async verifyAndEnable(userId: string, token: string): Promise<boolean> {
    const twoFactor = await this.prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (!twoFactor) {
      throw new HttpException(
        '2FA setup not found. Please start setup again.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (twoFactor.enabled) {
      throw new HttpException(
        '2FA is already enabled',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Decrypt and verify the token
    const secret = this.encryptionService.decrypt(twoFactor.secret);
    const isValid = authenticator.verify({
      token,
      secret,
    });

    if (!isValid) {
      throw new HttpException(
        'Invalid verification code',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Enable 2FA
    await this.prisma.twoFactorAuth.update({
      where: { id: twoFactor.id },
      data: {
        enabled: true,
        verifiedAt: new Date(),
      },
    });

    return true;
  }

  /**
   * Verify a TOTP token for an enabled account
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    const twoFactor = await this.prisma.twoFactorAuth.findUnique({
      where: { userId, enabled: true },
    });

    if (!twoFactor) {
      return false;
    }

    const secret = this.encryptionService.decrypt(twoFactor.secret);
    return authenticator.verify({
      token,
      secret,
    });
  }

  /**
   * Verify a backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const twoFactor = await this.prisma.twoFactorAuth.findUnique({
      where: { userId, enabled: true },
      include: { backupCodes: true },
    });

    if (!twoFactor) {
      return false;
    }

    // Find an unused backup code
    for (const backupCode of twoFactor.backupCodes) {
      if (!backupCode.usedAt) {
        const isValid = await bcrypt.compare(code, backupCode.code);
        if (isValid) {
          // Mark the code as used
          await this.prisma.twoFactorBackupCode.update({
            where: { id: backupCode.id },
            data: { usedAt: new Date() },
          });
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Disable 2FA for a user
   */
  async disable(userId: string): Promise<void> {
    const twoFactor = await this.prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (!twoFactor) {
      throw new HttpException('2FA not configured', HttpStatus.NOT_FOUND);
    }

    // Delete all 2FA data
    await this.prisma.twoFactorAuth.delete({
      where: { userId },
    });
  }

  /**
   * Get 2FA status for a user
   */
  async getStatus(userId: string): Promise<{
    enabled: boolean;
    verifiedAt: Date | null;
    backupCodesRemaining: number;
  }> {
    const twoFactor = await this.prisma.twoFactorAuth.findUnique({
      where: { userId },
      include: {
        backupCodes: {
          where: { usedAt: null },
        },
      },
    });

    if (!twoFactor) {
      return {
        enabled: false,
        verifiedAt: null,
        backupCodesRemaining: 0,
      };
    }

    return {
      enabled: twoFactor.enabled,
      verifiedAt: twoFactor.verifiedAt,
      backupCodesRemaining: twoFactor.backupCodes.length,
    };
  }

  /**
   * Check if user has 2FA enabled
   */
  async isEnabled(userId: string): Promise<boolean> {
    const twoFactor = await this.prisma.twoFactorAuth.findUnique({
      where: { userId, enabled: true },
    });

    return !!twoFactor;
  }

  /**
   * Generate a temporary verification token for 2FA flow
   */
  async generateVerificationToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.twoFactorVerification.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Validate a verification token
   */
  async validateVerificationToken(token: string): Promise<string | null> {
    const verification = await this.prisma.twoFactorVerification.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verification) {
      return null;
    }

    // Delete the token after use
    await this.prisma.twoFactorVerification.delete({
      where: { id: verification.id },
    });

    return verification.userId;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const twoFactor = await this.prisma.twoFactorAuth.findUnique({
      where: { userId, enabled: true },
    });

    if (!twoFactor) {
      throw new HttpException(
        '2FA not enabled for this account',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Delete old backup codes
    await this.prisma.twoFactorBackupCode.deleteMany({
      where: { twoFactorId: twoFactor.id },
    });

    // Generate new backup codes
    const backupCodes = this.generateBackupCodes(10);

    // Store hashed backup codes
    const hashedCodes = await Promise.all(
      backupCodes.map(async (code) => ({
        twoFactorId: twoFactor.id,
        code: await bcrypt.hash(code, 10),
      })),
    );

    await this.prisma.twoFactorBackupCode.createMany({
      data: hashedCodes,
    });

    return backupCodes;
  }

  /**
   * Store 2FA setup (private method)
   */
  private async storeTwoFactorSetup(
    userId: string,
    secret: string,
    backupCodes: string[],
  ): Promise<void> {
    // Encrypt the secret
    const encryptedSecret = this.encryptionService.encrypt(secret);

    // Hash backup codes
    const hashedCodes = await Promise.all(
      backupCodes.map(async (code) => ({
        code: await bcrypt.hash(code, 10),
      })),
    );

    // Upsert 2FA setup
    await this.prisma.twoFactorAuth.upsert({
      where: { userId },
      create: {
        userId,
        secret: encryptedSecret,
        enabled: false,
        backupCodes: {
          create: hashedCodes,
        },
      },
      update: {
        secret: encryptedSecret,
        enabled: false,
        backupCodes: {
          deleteMany: {},
          create: hashedCodes,
        },
      },
    });
  }

  /**
   * Generate backup codes (private method)
   */
  private generateBackupCodes(count: number): string[] {
    return Array.from({ length: count }, () => {
      const bytes = crypto.randomBytes(4);
      const code = bytes.toString('hex').toUpperCase();
      // Format as XXXX-XXXX for readability
      return `${code.slice(0, 4)}-${code.slice(4)}`;
    });
  }

  /**
   * Clean up expired verification tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    await this.prisma.twoFactorVerification.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }
}