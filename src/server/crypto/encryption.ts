import 'server-only';
import * as crypto from 'crypto';

/**
 * AES-256-GCM envelope encryption for 2FA secrets.
 *
 * Ported from the NestJS service with the key derivation and output format
 * UNCHANGED: PBKDF2-SHA256, 100k iterations, 32-byte key, static salt
 * sha256('profolio-salt'), output base64(iv | tag | ciphertext). Altering any
 * of these makes every existing encrypted row unreadable, and there is no
 * re-encrypt path in the codebase.
 */

class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly saltLength = 64; // 512 bits
  private readonly iterations = 100000;
  private readonly digest = 'sha256';
  
  private encryptionKey: Buffer;

  constructor() {
    // A missing key used to fall back to a randomly generated one. That is
    // silently destructive on serverless: every cold start derives a different
    // key, so anything encrypted by one instance cannot be read by the next,
    // and 2FA secrets become permanently unrecoverable. Fail closed instead.
    const configured = process.env.API_ENCRYPTION_KEY;

    if (!configured) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'API_ENCRYPTION_KEY is required. Refusing to start with a generated key: ' +
            'it would change on every cold start and make stored secrets undecryptable.',
        );
      }
      console.warn(
        '⚠️  API_ENCRYPTION_KEY not set. Using a development-only generated key; ' +
          'anything encrypted now will not decrypt after a restart.',
      );
    }

    const keyString = configured || this.generateKeyString();

    // Derive a proper key from the string
    const salt = crypto.createHash('sha256').update('profolio-salt').digest();
    this.encryptionKey = crypto.pbkdf2Sync(keyString, salt, this.iterations, this.keyLength, this.digest);
  }

  /**
   * Encrypt a string value
   */
  encrypt(text: string): string {
    try {
      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
      
      // Encrypt the text
      const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final(),
      ]);
      
      // Get the authentication tag
      const tag = cipher.getAuthTag();
      
      // Combine IV, tag, and encrypted data
      const combined = Buffer.concat([iv, tag, encrypted]);
      
      // Return base64 encoded string
      return combined.toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt a string value
   */
  decrypt(encryptedText: string): string {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedText, 'base64');
      
      // Extract IV, tag, and encrypted data
      const iv = combined.slice(0, this.ivLength);
      const tag = combined.slice(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = combined.slice(this.ivLength + this.tagLength);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(tag);
      
      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash a value (one-way, cannot be decrypted)
   */
  hash(text: string): string {
    return crypto
      .createHash('sha256')
      .update(text)
      .digest('hex');
  }

  /**
   * Verify a hash
   */
  verifyHash(text: string, hash: string): boolean {
    const textHash = this.hash(text);
    return crypto.timingSafeEqual(
      Buffer.from(textHash),
      Buffer.from(hash)
    );
  }

  /**
   * Generate a random key string for development
   */
  private generateKeyString(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate a secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate a secure random string with custom alphabet
   */
  generateSecureString(length: number = 16, alphabet?: string): string {
    const chars = alphabet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomBytes = crypto.randomBytes(length);
    const result = new Array(length);
    
    for (let i = 0; i < length; i++) {
      result[i] = chars[randomBytes[i] % chars.length];
    }
    
    return result.join('');
  }
}
/**
 * Shared instance. The key is derived once in the constructor, so this must
 * not be re-instantiated per request.
 */
export const encryption = new EncryptionService();
