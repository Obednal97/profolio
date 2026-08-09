import "server-only";
import { prisma } from "@/server/db";
import { findActiveKey } from "@/server/modules/api-keys/service";
import { fetchQuote } from "./yahoo";

/**
 * Price lookup across the providers a user has configured, falling back to
 * Yahoo Finance, which needs no key.
 *
 * PRICES ARE IN DOLLARS. Everything in this file returns a dollar amount, and
 * the caller converts before storing. Passing one of these through
 * MoneyUtils.fromCents divided every synced valuation by 100 - a $313.33 share
 * read as $3.13 - which is why it is stated here rather than assumed.
 */

export interface PriceData {
  symbol: string;
  /** Dollars. */
  price: number;
  timestamp: Date;
  source: string;
  currency?: string;
}

async function fetchCoinGecko(
  symbol: string,
  apiKey?: string,
): Promise<PriceData | null> {
  try {
    const headers: Record<string, string> = {};
    if (apiKey) headers["x-cg-demo-api-key"] = apiKey;

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd&include_last_updated_at=true`,
      { headers, signal: AbortSignal.timeout(10_000) },
    );
    if (!response.ok) return null;

    const data = (await response.json()) as Record<
      string,
      { usd: number; last_updated_at: number } | undefined
    >;
    const coin = data[symbol.toLowerCase()];
    if (!coin) return null;

    return {
      symbol: symbol.toUpperCase(),
      price: coin.usd,
      timestamp: new Date(coin.last_updated_at * 1000),
      source: "COINGECKO",
      currency: "USD",
    };
  } catch (error) {
    console.error(`CoinGecko lookup failed for ${symbol}:`, error);
    return null;
  }
}

async function fetchAlphaVantage(
  symbol: string,
  apiKey: string,
): Promise<PriceData | null> {
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(10_000) },
    );

    const data = (await response.json()) as {
      "Global Quote"?: { "05. price": string };
      "Error Message"?: string;
      Note?: string;
    };

    // "Note" is how Alpha Vantage reports a rate limit, with a 200 status.
    if (data["Error Message"] || data.Note) return null;

    const price = Number.parseFloat(data["Global Quote"]?.["05. price"] ?? "");
    if (!Number.isFinite(price)) return null;

    return {
      symbol: symbol.toUpperCase(),
      price,
      timestamp: new Date(),
      source: "ALPHA_VANTAGE",
      currency: "USD",
    };
  } catch (error) {
    console.error(`Alpha Vantage lookup failed for ${symbol}:`, error);
    return null;
  }
}

async function fetchTwelveData(
  symbol: string,
  apiKey: string,
): Promise<PriceData | null> {
  try {
    const response = await fetch(
      `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(10_000) },
    );

    const data = (await response.json()) as { price?: string; status?: string };
    if (data.status === "error") return null;

    const price = Number.parseFloat(data.price ?? "");
    if (!Number.isFinite(price)) return null;

    return {
      symbol: symbol.toUpperCase(),
      price,
      timestamp: new Date(),
      source: "TWELVE_DATA",
      currency: "USD",
    };
  } catch (error) {
    console.error(`Twelve Data lookup failed for ${symbol}:`, error);
    return null;
  }
}

/**
 * The current price for a symbol, in dollars, or null.
 *
 * Crypto goes to CoinGecko, which works without a key at a lower rate limit.
 * Stocks try the user's own providers first and fall back to Yahoo.
 */
export async function getCurrentPrice(
  userId: string,
  symbol: string,
  assetType: "STOCK" | "CRYPTO",
): Promise<PriceData | null> {
  if (assetType === "CRYPTO") {
    const key = await findActiveKey(userId, "COINGECKO");
    return fetchCoinGecko(symbol, key ?? undefined);
  }

  const alphaVantage = await findActiveKey(userId, "ALPHA_VANTAGE");
  if (alphaVantage) {
    const price = await fetchAlphaVantage(symbol, alphaVantage);
    if (price) return price;
  }

  const twelveData = await findActiveKey(userId, "TWELVE_DATA");
  if (twelveData) {
    const price = await fetchTwelveData(symbol, twelveData);
    if (price) return price;
  }

  const quote = await fetchQuote(symbol);
  if (!quote) return null;

  return {
    symbol: quote.symbol,
    price: quote.price,
    timestamp: new Date(),
    source: "YAHOO_FINANCE",
    currency: quote.currency,
  };
}

/**
 * Records a price against an asset.
 *
 * PriceHistory.price is integer cents; the incoming price is dollars. The
 * unique constraint on (assetId, timestamp, source) makes a repeated sync a
 * no-op rather than a duplicate row.
 */
export async function storePriceData(
  assetId: string,
  price: PriceData,
): Promise<void> {
  try {
    await prisma.priceHistory.upsert({
      where: {
        assetId_timestamp_source: {
          assetId,
          timestamp: price.timestamp,
          source: price.source,
        },
      },
      create: {
        assetId,
        symbol: price.symbol,
        price: Math.round(price.price * 100),
        timestamp: price.timestamp,
        source: price.source,
      },
      update: {},
    });
  } catch (error) {
    // A missing Symbol row is the usual cause: PriceHistory.symbol is a
    // foreign key. Never fail the caller's request over a history write.
    console.error(`Could not record price history for ${price.symbol}:`, error);
  }
}
