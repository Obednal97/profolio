import "server-only";
import { AssetType } from "@prisma/client";
import { prisma } from "@/server/db";
import { MoneyUtils } from "@/server/money";

/**
 * The Symbol table: the catalogue of tickers the application knows about, and
 * the last price recorded for each.
 *
 * `Symbol.current_price` is integer cents. Everything returned from here is in
 * dollars - `searchSymbols` used to return the raw column while the other two
 * readers converted, so search results were a hundred times too large.
 */

export interface SymbolResult {
  symbol: string;
  name: string;
  type: AssetType;
  /** Dollars. */
  current_price?: number;
  day_change_percent?: number;
  is_queued?: boolean;
}

function toResult(row: {
  symbol: string;
  name: string;
  type: AssetType;
  current_price: number | null;
  day_change_percent: unknown;
}): SymbolResult {
  return {
    symbol: row.symbol,
    name: row.name || row.symbol,
    type: row.type,
    current_price:
      row.current_price === null
        ? undefined
        : MoneyUtils.fromCents(row.current_price),
    day_change_percent:
      row.day_change_percent === null
        ? undefined
        : Number(row.day_change_percent),
  };
}

export async function searchSymbols(
  query: string,
  limit = 10,
): Promise<SymbolResult[]> {
  const rows = await prisma.symbol.findMany({
    where: {
      OR: [
        { symbol: { contains: query.toUpperCase() } },
        { name: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      symbol: true,
      name: true,
      type: true,
      current_price: true,
      day_change_percent: true,
    },
    take: limit,
    orderBy: { symbol: "asc" },
  });

  return rows.map(toResult);
}

export async function findSymbol(symbol: string): Promise<SymbolResult | null> {
  const row = await prisma.symbol.findUnique({
    where: { symbol: symbol.toUpperCase() },
    select: {
      symbol: true,
      name: true,
      type: true,
      current_price: true,
      day_change_percent: true,
      last_updated: true,
    },
  });

  return row ? toResult(row) : null;
}

/** The last recorded price for a symbol, in dollars, without any live call. */
export async function findCachedPrice(symbol: string): Promise<{
  symbol: string;
  price: number | null;
  last_updated: Date | null;
  source: string;
}> {
  const row = await prisma.symbol.findUnique({
    where: { symbol: symbol.toUpperCase() },
    select: { symbol: true, current_price: true, last_updated: true },
  });

  if (!row?.current_price) {
    return {
      symbol: symbol.toUpperCase(),
      price: null,
      last_updated: row?.last_updated ?? null,
      source: "none",
    };
  }

  return {
    symbol: row.symbol,
    price: MoneyUtils.fromCents(row.current_price),
    last_updated: row.last_updated,
    source: "cached",
  };
}

export async function queueSymbol(
  symbol: string,
  userId?: string,
  assetType?: AssetType,
): Promise<void> {
  try {
    await prisma.symbolQueue.upsert({
      where: { symbol: symbol.toUpperCase() },
      update: { priority: userId ? 1 : 2, requested_by: userId },
      create: {
        symbol: symbol.toUpperCase(),
        requested_by: userId,
        asset_type: assetType,
        priority: userId ? 1 : 2,
      },
    });
  } catch (error) {
    console.error(`Could not queue symbol ${symbol}:`, error);
  }
}

/** A symbol from the catalogue, queuing it for lookup if it is unknown. */
export async function getOrQueueSymbol(
  symbol: string,
  userId?: string,
  guessedType?: AssetType,
): Promise<SymbolResult> {
  const existing = await findSymbol(symbol);
  if (existing) return { ...existing, is_queued: false };

  await queueSymbol(symbol, userId, guessedType);

  return {
    symbol: symbol.toUpperCase(),
    name: `${symbol.toUpperCase()} (processing)`,
    type: guessedType ?? "STOCK",
    is_queued: true,
  };
}

export async function getTopSymbols(
  type: AssetType,
  limit = 20,
): Promise<SymbolResult[]> {
  const rows = await prisma.symbol.findMany({
    where: { type, is_active: true, current_price: { not: null } },
    select: {
      symbol: true,
      name: true,
      type: true,
      current_price: true,
      day_change_percent: true,
    },
    orderBy: [{ market_cap: "desc" }, { volume: "desc" }],
    take: limit,
  });

  return rows.map(toResult);
}

/** Writes a fetched quote back to the catalogue. Prices arrive in dollars. */
export async function recordQuote(quote: {
  symbol: string;
  name: string;
  type: AssetType;
  price: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
}): Promise<void> {
  const data = {
    name: quote.name,
    current_price: MoneyUtils.toCents(quote.price),
    previous_close:
      quote.previousClose === undefined
        ? undefined
        : MoneyUtils.toCents(quote.previousClose),
    day_change:
      quote.change === undefined ? undefined : MoneyUtils.toCents(quote.change),
    day_change_percent: quote.changePercent,
    volume: quote.volume === undefined ? undefined : BigInt(Math.round(quote.volume)),
    last_updated: new Date(),
    error_count: 0,
    last_error: null,
  };

  await prisma.symbol.upsert({
    where: { symbol: quote.symbol.toUpperCase() },
    update: data,
    create: { symbol: quote.symbol.toUpperCase(), type: quote.type, ...data },
  });
}

export async function recordSymbolError(
  symbol: string,
  message: string,
): Promise<void> {
  await prisma.symbol
    .update({
      where: { symbol: symbol.toUpperCase() },
      data: {
        error_count: { increment: 1 },
        last_error: message.slice(0, 500),
        last_error_at: new Date(),
      },
    })
    .catch(() => {
      // The symbol may not exist yet; an error against nothing is not worth
      // failing a sync for.
    });
}

export async function getSymbolStatistics() {
  const [total, byType, recentlyUpdated, queued] = await Promise.all([
    prisma.symbol.count({ where: { is_active: true } }),
    prisma.symbol.groupBy({
      by: ["type"],
      where: { is_active: true },
      _count: { symbol: true },
    }),
    prisma.symbol.count({
      where: {
        is_active: true,
        last_updated: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.symbolQueue.count({ where: { status: "PENDING" } }),
  ]);

  return {
    totalSymbols: total,
    symbolsByType: Object.fromEntries(
      byType.map((row) => [row.type, row._count.symbol]),
    ),
    recentlyUpdated,
    queuedCount: queued,
  };
}
