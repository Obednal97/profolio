import { NextRequest, NextResponse } from 'next/server';
import { verify, JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

// Secure encryption implementation using AES-256-GCM (no fallback key)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Enforce encryption key requirement at runtime (not build time)
function requireEncryptionKey(): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required for secure API key storage');
  }
  return ENCRYPTION_KEY;
}

interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

interface UserJwtPayload extends JwtPayload {
  userId?: string;
  id?: string;
  email: string;
}

// Demo token management with session-based security
const demoTokens = new Map<string, { 
  expires: number; 
  userId: string;
  email: string;
}>();

function validateDemoToken(token: string): { userId: string; email: string } | null {
  const tokenData = demoTokens.get(token);
  if (!tokenData) return null;
  
  if (Date.now() > tokenData.expires) {
    demoTokens.delete(token);
    return null;
  }
  
  return {
    userId: tokenData.userId,
    email: tokenData.email
  };
}

// Secure encryption implementation using AES-256-GCM
function encrypt(text: string): EncryptedData {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-gcm', Buffer.from(requireEncryptionKey(), 'hex'));
  cipher.setAAD(Buffer.from('profolio-api-keys'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

function decrypt(encryptedData: EncryptedData): string {
  const decipher = crypto.createDecipher('aes-256-gcm', Buffer.from(requireEncryptionKey(), 'hex'));
  decipher.setAAD(Buffer.from('profolio-api-keys'));
  decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// TODO: Replace with database storage for production (Redis or encrypted DB fields)
// Current in-memory storage will lose data on server restart
const userApiKeys = new Map<string, Record<string, EncryptedData>>();

function getUserFromToken(request: NextRequest): { userId: string; email: string; isDemo: boolean } | null {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.slice(7);
    
    // Secure demo token validation (session-based)
    if (token.startsWith('demo-')) {
      const demoUser = validateDemoToken(token);
      if (demoUser) {
        return {
          userId: demoUser.userId,
          email: demoUser.email,
          isDemo: true
        };
      }
      return null;
    }

    // Verify JWT token with proper error handling
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const decoded = verify(token, process.env.JWT_SECRET) as UserJwtPayload;
    
    return {
      userId: decoded.userId || decoded.id || '',
      email: decoded.email,
      isDemo: false
    };
  } catch (error) {
    // Sanitized error logging for production
    if (process.env.NODE_ENV === 'development') {
      console.error('Token verification failed:', error);
    } else {
      console.error('Token verification failed: Invalid or expired token');
    }
    return null;
  }
}

// GET - Retrieve user's API keys
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Demo users should use localStorage only
    if (user.isDemo) {
      return NextResponse.json({ 
        apiKeys: {},
        message: 'Demo mode: API keys stored in localStorage only',
        isDemo: true
      });
    }

    const encryptedKeys = userApiKeys.get(user.userId) || {};
    const decryptedKeys: Record<string, string> = {};

    // Decrypt API keys for response with secure error handling
    for (const [provider, encryptedData] of Object.entries(encryptedKeys)) {
      try {
        decryptedKeys[provider] = decrypt(encryptedData);
      } catch (error) {
        // Sanitized error logging for production
        if (process.env.NODE_ENV === 'development') {
          console.error(`Failed to decrypt ${provider} API key:`, error);
        } else {
          console.error(`Failed to decrypt ${provider} API key: Decryption failed`);
        }
        decryptedKeys[provider] = '';
      }
    }

    return NextResponse.json({ apiKeys: decryptedKeys });
  } catch (error) {
    // Sanitized error logging for production
    if (process.env.NODE_ENV === 'development') {
      console.error('Error retrieving API keys:', error);
    } else {
      console.error('Error retrieving API keys: Server error');
    }
    return NextResponse.json({ error: 'Failed to retrieve API keys' }, { status: 500 });
  }
}

// POST - Store user's API keys
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { apiKeys } = await request.json();
    
    if (!apiKeys || typeof apiKeys !== 'object') {
      return NextResponse.json({ error: 'Invalid API keys format' }, { status: 400 });
    }

    // Demo users should use localStorage only - don't store on server
    if (user.isDemo) {
      return NextResponse.json({ 
        success: true, 
        message: 'Demo mode: API keys stored in localStorage only',
        providersStored: Object.keys(apiKeys),
        isDemo: true
      });
    }

    // Encrypt API keys before storage for real users
    const encryptedKeys: Record<string, EncryptedData> = {};
    for (const [provider, apiKey] of Object.entries(apiKeys)) {
      if (typeof apiKey === 'string' && apiKey.trim()) {
        try {
          encryptedKeys[provider] = encrypt(apiKey.trim());
        } catch (error) {
          // Sanitized error logging for production
          if (process.env.NODE_ENV === 'development') {
            console.error(`Failed to encrypt ${provider} API key:`, error);
          } else {
            console.error(`Failed to encrypt ${provider} API key: Encryption failed`);
          }
          return NextResponse.json({ error: 'Failed to encrypt API key' }, { status: 500 });
        }
      }
    }

    // Store encrypted keys associated with user ID
    userApiKeys.set(user.userId, encryptedKeys);

    return NextResponse.json({ 
      success: true, 
      message: 'API keys stored securely',
      providersStored: Object.keys(encryptedKeys)
    });
  } catch (error) {
    // Sanitized error logging for production
    if (process.env.NODE_ENV === 'development') {
      console.error('Error storing API keys:', error);
    } else {
      console.error('Error storing API keys: Server error');
    }
    return NextResponse.json({ error: 'Failed to store API keys' }, { status: 500 });
  }
}

// DELETE - Remove specific API key
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');

    if (!provider) {
      return NextResponse.json({ error: 'Provider parameter required' }, { status: 400 });
    }

    // Demo users should use localStorage only
    if (user.isDemo) {
      return NextResponse.json({ 
        success: true, 
        message: `Demo mode: ${provider} API key removed from localStorage only`,
        isDemo: true
      });
    }

    const userKeys = userApiKeys.get(user.userId) || {};
    delete userKeys[provider];
    userApiKeys.set(user.userId, userKeys);

    return NextResponse.json({ 
      success: true, 
      message: `${provider} API key removed` 
    });
  } catch (error) {
    // Sanitized error logging for production
    if (process.env.NODE_ENV === 'development') {
      console.error('Error removing API key:', error);
    } else {
      console.error('Error removing API key: Server error');
    }
    return NextResponse.json({ error: 'Failed to remove API key' }, { status: 500 });
  }
} 