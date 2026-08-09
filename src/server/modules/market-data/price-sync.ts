import "server-only";
import { prisma } from "@/server/db";
import { MoneyUtils } from "@/server/money";
import { fetchQuote } from "./yahoo";
import { storePriceData } from "./providers";
import { recordQuote, recordSymbolError } from "./symbols";

/**
 * Scheduled price synchronisation.
 *
 * Rewritten rather than ported. The NestJS version carried three pieces of
 * per-process state that cannot work on serverless - `startupCompleted`, set
 * by a 30-second constructor timer that a cold start never reaches;
 * `isRunning`; and `lastSuccessfulSync` - and the first of them meant the
 * Vercel cron ran, found the flag false and returned having done nothing. It
 * also paused 30 seconds between symbols, which does not fit inside a function
 * invocation.
 *
 * Two real defects are fixed here:
 *
 *  1. It wrote `current_value: priceData.price` for every asset holding a
 *     symbol. `current_value` is integer CENTS and a POSITION TOTAL, while
 *     `price` is a unit price in DOLLARS - so a $200 share wrote 200, meaning
 *     $2.00, and the quantity was ignored entirely. Every synced holding was
 *     silently repriced to a hundredth of its unit price. Each asset is now
 *     updated individually with `quantity x price`.
 *  2. Nothing was ever written to PriceHistory, so the portfolio chart had no
 *     data to draw. Each fetched price is recorded against every asset that
 *     holds the symbol.
 */

/** Only refresh a symbol if its assets have not been synced within this. */
const STALE_AFTER_MS = 4 * 60 * 60 * 1000;

/** Bounded so a run fits comfortably inside one function invocation. */
const MAX_SYMBOLS_PER_RUN = 25;

/** A courtesy gap between provider calls. */
const DELAY_BETWEEN_SYMBOLS_MS = 250;

export interface SyncResult {
  symbolsConsidered: number;
  updated: number;
  failed: number;
  assetsRepriced: number;
  errors: string[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Refreshes prices for every symbol held by any user, oldest first.
 *
 * Symbols rather than assets: two users holding AAPL is one provider call.
 */
export async function syncAllPrices(): Promise<SyncResult> {
  const result: SyncResult = {
    symbolsConsidered: 0,
    updated: 0,
    failed: 0,
    assetsRepriced: 0,
    errors: [],
  };

  const cutoff = new Date(Date.now() - STALE_AFTER_MS);

  const stale = await prisma.asset.findMany({
    where: {
      symbol: { not: null },
      type: { in: ["STOCK", "CRYPTO"] },
      OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: cutoff } }],
    },
    select: { symbol: true, type: true },
    distinct: ["symbol"],
    orderBy: { lastSyncedAt: "asc" },
    take: MAX_SYMBOLS_PER_RUN,
  });

  result.symbolsConsidered = stale.length;
  if (stale.length === 0) return result;

  for (const [index, entry] of stale.entries()) {
    const symbol = entry.symbol;
    if (!symbol) continue;

    try {
      const quote = await fetchQuote(symbol);

      if (!quote) {
        result.failed++;
        result.errors.push(`No quote for ${symbol}`);
        await recordSymbolError(symbol, "No quote returned");
        continue;
      }

      await recordQuote({ ...quote, type: entry.type });
      result.assetsRepriced += await repriceAssets(symbol, quote.price);
      result.updated++;
    } catch (error) {
      result.failed++;
      const message = error instanceof Error ? error.message : "Unknown error";
      result.errors.push(`${symbol}: ${message}`);
      await recordSymbolError(symbol, message);
    }

    if (index < stale.length - 1) await sleep(DELAY_BETWEEN_SYMBOLS_MS);
  }

  return result;
}

/**
 * Applies a unit price to every holding of that symbol.
 *
 * Per asset rather than `updateMany`, because the stored value is
 * `quantity x price` and the quantity differs per holding. This is the
 * correction described at the top of the file.
 */
async function repriceAssets(symbol: string, price: number): Promise<number> {
  const assets = await prisma.asset.findMany({
    where: { symbol },
    select: { id: true, quantity: true },
  });

  const timestamp = new Date();

  for (const asset of assets) {
    const quantity = Number(asset.quantity) || 0;

    await prisma.asset.update({
      where: { id: asset.id },
      data: {
        current_value: MoneyUtils.toCents(
          MoneyUtils.safeMultiply(quantity, price),
        ),
        lastSyncedAt: timestamp,
      },
    });

    await storePriceData(asset.id, {
      symbol,
      price,
      timestamp,
      source: "YAHOO_FINANCE",
    });
  }

  return assets.length;
}

/** Refreshes a single asset, used when one is created or edited. */
export async function syncAssetPrice(assetId: string): Promise<void> {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { id: true, symbol: true, type: true, quantity: true },
  });

  if (!asset?.symbol || (asset.type !== "STOCK" && asset.type !== "CRYPTO")) {
    return;
  }

  const quote = await fetchQuote(asset.symbol);
  if (!quote) return;

  await recordQuote({ ...quote, type: asset.type });

  const timestamp = new Date();

  await prisma.asset.update({
    where: { id: asset.id },
    data: {
      current_value: MoneyUtils.toCents(
        MoneyUtils.safeMultiply(Number(asset.quantity) || 0, quote.price),
      ),
      lastSyncedAt: timestamp,
    },
  });

  await storePriceData(asset.id, {
    symbol: asset.symbol,
    price: quote.price,
    timestamp,
    source: "YAHOO_FINANCE",
  });
}
