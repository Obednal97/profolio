import "server-only";
import { createCipheriv, createDecipheriv, scryptSync } from "crypto";

/**
 * AES-256-GCM for stored third-party API keys.
 *
 * The envelope is unchanged from the NestJS CryptoService - scrypt(secret,
 * "salt", 32), output `hex(iv):hex(tag):hex(ciphertext)` - because existing
 * rows have to stay readable and there is no re-encrypt path. This is a
 * different envelope from `server/crypto/encryption.ts`, which holds 2FA
 * secrets; the two are not interchangeable.
 *
 * The one change is the secret. It used to fall back to
 * "default-secret-key-change-in-production-this-must-be-32-bytes", a string
 * committed to this repository - so a deployment that forgot the variable
 * encrypted every user's API keys with a publicly known key and reported
 * success. It now refuses.
 */

let cachedKey: Buffer | null = null;

function key(): Buffer {
  if (cachedKey) return cachedKey;

  const secret = process.env.API_KEY_ENCRYPTION_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "API_KEY_ENCRYPTION_SECRET is required. Refusing to fall back to the " +
          "default: it is published in the repository, so stored keys would " +
          "be readable by anyone.",
      );
    }
    console.warn(
      "⚠️  API_KEY_ENCRYPTION_SECRET not set. Using a development-only key.",
    );
  }

  cachedKey = scryptSync(secret ?? "development-only-key", "salt", 32);
  return cachedKey;
}

export function encryptApiKey(plaintext: string): string {
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const cipher = createCipheriv("aes-256-gcm", key(), iv);

  const encrypted =
    cipher.update(plaintext, "utf8", "hex") + cipher.final("hex");

  return [
    Buffer.from(iv).toString("hex"),
    cipher.getAuthTag().toString("hex"),
    encrypted,
  ].join(":");
}

export function decryptApiKey(envelope: string): string {
  const parts = envelope.split(":");
  if (parts.length !== 3) {
    throw new Error("Stored API key is not in the expected format");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(parts[0], "hex"),
  );
  decipher.setAuthTag(Buffer.from(parts[1], "hex"));

  return decipher.update(parts[2], "hex", "utf8") + decipher.final("utf8");
}

/**
 * What a stored key looks like in a response. Never the key itself: the
 * plaintext leaves the server only when it is being sent to the provider it
 * belongs to.
 */
export function maskApiKey(plaintext: string): string {
  if (plaintext.length <= 8) return "*".repeat(plaintext.length);
  return `${plaintext.slice(0, 4)}${"*".repeat(
    Math.max(4, plaintext.length - 8),
  )}${plaintext.slice(-4)}`;
}
