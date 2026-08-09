import "server-only";

/**
 * Yahoo Finance, via yahoo-finance2.
 *
 * The NestJS service kept a circuit breaker, a rolling backoff and a rotating
 * pool of browser user agents in instance fields. None of that survives here:
 * on serverless each invocation is a fresh instance, so a per-process breaker
 * protects nothing and a 10-second minimum delay between requests just makes
 * every request slow. The user agents were left over from scraping
 * query1.finance.yahoo.com directly, which stopped working when Yahoo began
 * requiring a cookie/crumb handshake - yahoo-finance2 performs that handshake,
 * which is why it is here at all.
 *
 * A failed lookup returns null. It never substitutes a placeholder price: a
 * fabricated number in a portfolio tracker is worse than a missing one.
 */

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  currency: string;
}

interface YahooClient {
  quote(symbol: string): Promise<{
    regularMarketPrice?: number;
    regularMarketPreviousClose?: number;
    regularMarketChange?: number;
    regularMarketChangePercent?: number;
    regularMarketVolume?: number;
    shortName?: string;
    longName?: string;
    currency?: string;
  }>;
}

const globalForYahoo = globalThis as unknown as {
  yahooClient?: Promise<YahooClient>;
};

/** The package is ESM-only, so the import stays dynamic. */
function client(): Promise<YahooClient> {
  globalForYahoo.yahooClient ??= import("yahoo-finance2").then((mod) => {
    const YahooFinance = mod.default;
    return new YahooFinance({
      // Suppress the library's interactive console notices; this is a server.
      suppressNotices: ["yahooSurvey"],
    }) as unknown as YahooClient;
  });

  return globalForYahoo.yahooClient;
}

export async function fetchQuote(symbol: string): Promise<Quote | null> {
  try {
    const quote = await (await client()).quote(symbol);

    if (!quote?.regularMarketPrice) return null;

    return {
      symbol: symbol.toUpperCase(),
      name: quote.shortName || quote.longName || symbol.toUpperCase(),
      price: quote.regularMarketPrice,
      previousClose: quote.regularMarketPreviousClose,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      volume: quote.regularMarketVolume,
      currency: quote.currency || "USD",
    };
  } catch (error) {
    console.error(`Yahoo Finance lookup failed for ${symbol}:`, error);
    return null;
  }
}
