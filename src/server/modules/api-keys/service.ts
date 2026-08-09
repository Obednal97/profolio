import "server-only";
import { ApiProvider } from "@prisma/client";
import { prisma } from "@/server/db";
import { assertNotDemo, requireUser } from "@/server/auth/session";
import { decryptApiKey, encryptApiKey, maskApiKey } from "./crypto";

/**
 * Third-party API keys belonging to a user - market data providers and
 * Trading212. Stored encrypted, returned masked, and decrypted only on the
 * server at the moment of calling the provider.
 */

/** The default name given to a key saved through the settings modal. */
const DEFAULT_NAME = "Default";

/**
 * The keys a user has, masked, keyed by provider.
 *
 * Shaped as a map because that is what the settings modal reads; the row-level
 * detail the NestJS controller returned has no consumer.
 */
export async function listApiKeysMasked(): Promise<Record<string, string>> {
  const user = await requireUser();

  const keys = await prisma.apiKey.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const masked: Record<string, string> = {};
  for (const key of keys) {
    if (masked[key.provider]) continue;
    try {
      masked[key.provider] = maskApiKey(
        decryptApiKey(key.user_api_key_encrypted_value),
      );
    } catch {
      // A key encrypted under a secret we no longer hold cannot be shown. Say
      // so rather than dropping it silently, so the user knows to re-enter it.
      masked[key.provider] = "unreadable - please re-enter";
    }
  }

  return masked;
}

/**
 * Saves a batch of keys, one per provider.
 *
 * A blank value removes that provider's key, which is how the modal clears
 * one. Unknown provider names are ignored rather than failing the whole batch:
 * the modal sends every field it renders.
 */
export async function saveApiKeys(
  keys: Record<string, string>,
): Promise<{ success: true; providersStored: string[] }> {
  const user = await requireUser();
  assertNotDemo(user);

  const stored: string[] = [];

  for (const [rawProvider, value] of Object.entries(keys)) {
    const provider = rawProvider.toUpperCase();
    if (!(provider in ApiProvider)) continue;

    const typedProvider = provider as ApiProvider;
    const trimmed = typeof value === "string" ? value.trim() : "";

    if (trimmed === "") {
      await prisma.apiKey.deleteMany({
        where: { userId: user.id, provider: typedProvider },
      });
      continue;
    }

    // A masked value coming back from the form is the user not editing that
    // field. Storing it would overwrite a working key with asterisks.
    if (trimmed.includes("*")) continue;

    await prisma.apiKey.upsert({
      where: {
        userId_provider_user_api_key_display_name: {
          userId: user.id,
          provider: typedProvider,
          user_api_key_display_name: DEFAULT_NAME,
        },
      },
      create: {
        userId: user.id,
        provider: typedProvider,
        user_api_key_display_name: DEFAULT_NAME,
        user_api_key_encrypted_value: encryptApiKey(trimmed),
      },
      update: {
        user_api_key_encrypted_value: encryptApiKey(trimmed),
        isActive: true,
      },
    });

    stored.push(typedProvider);
  }

  return { success: true, providersStored: stored };
}

/**
 * The decrypted key for a provider, or null.
 *
 * Server-side only, and takes an explicit userId because the callers are
 * background jobs that have no session.
 */
export async function findActiveKey(
  userId: string,
  provider: ApiProvider,
): Promise<string | null> {
  const key = await prisma.apiKey.findFirst({
    where: {
      userId,
      provider,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { testedAt: "desc" },
  });

  if (!key) return null;

  try {
    return decryptApiKey(key.user_api_key_encrypted_value);
  } catch {
    console.error(`Could not decrypt the ${provider} key for user ${userId}`);
    return null;
  }
}
