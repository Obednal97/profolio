import { NextRequest, NextResponse } from 'next/server';
import { verify, JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';

// Simple encryption/decryption for API keys
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here!';
const ALGORITHM = 'aes-256-gcm';

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

function encrypt(text: string): EncryptedData {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  
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
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// In-memory storage for demo (in production, use database)
const userApiKeys = new Map<string, Record<string, EncryptedData>>();

function getUserFromToken(request: NextRequest): { userId: string; email: string } | null {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.slice(7);
    
    // Handle demo token specifically
    if (token === 'demo-token-secure-123') {
      return {
        userId: 'demo-user-id',
        email: 'demo@profolio.com'
      };
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'fallback-secret') as UserJwtPayload;
    
    return {
      userId: decoded.userId || decoded.id || '',
      email: decoded.email
    };
  } catch (error) {
    console.error('Token verification failed:', error);
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

    const encryptedKeys = userApiKeys.get(user.userId) || {};
    const decryptedKeys: Record<string, string> = {};

    // Decrypt API keys for response
    for (const [provider, encryptedData] of Object.entries(encryptedKeys)) {
      try {
        decryptedKeys[provider] = decrypt(encryptedData);
      } catch (error) {
        console.error(`Failed to decrypt ${provider} API key:`, error);
        decryptedKeys[provider] = '';
      }
    }

    return NextResponse.json({ apiKeys: decryptedKeys });
  } catch (error) {
    console.error('Error retrieving API keys:', error);
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

    // Encrypt API keys before storage
    const encryptedKeys: Record<string, EncryptedData> = {};
    for (const [provider, apiKey] of Object.entries(apiKeys)) {
      if (typeof apiKey === 'string' && apiKey.trim()) {
        encryptedKeys[provider] = encrypt(apiKey.trim());
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
    console.error('Error storing API keys:', error);
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

    const userKeys = userApiKeys.get(user.userId) || {};
    delete userKeys[provider];
    userApiKeys.set(user.userId, userKeys);

    return NextResponse.json({ 
      success: true, 
      message: `${provider} API key removed` 
    });
  } catch (error) {
    console.error('Error removing API key:', error);
    return NextResponse.json({ error: 'Failed to remove API key' }, { status: 500 });
  }
} 