import "server-only";
import { Prisma } from "@prisma/client";
import { waitUntil } from "@vercel/functions";
import { prisma } from "@/server/db";
import { syncAssetPrice } from "@/server/modules/market-data/price-sync";
import { MoneyUtils } from "@/server/money";
import { assertNotDemo, requireUser } from "@/server/auth/session";
import { NotFound } from "@/server/http/errors";
import type {
  CreateAssetInput,
  UpdateAssetInput,
} from "./schemas";

/**
 * Assets: holdings of every kind, from a share position to a savings account.
 *
 * Money is integer cents in the database and dollars on the wire; see
 * schemas.ts for the full wire contract. `current_value` is a position total,
 * so nothing here multiplies it by quantity again.
 */

const ASSET_SELECT = {
  id: true,
  userId: true,
  name: true,
  type: true,
  symbol: true,
  quantity: true,
  source: true,
  externalId: true,
  currency: true,
  current_value: true,
  valueOverride: true,
  purchasePrice: true,
  purchaseDate: true,
  initialAmount: true,
  interestRate: true,
  interestType: true,
  paymentFrequency: true,
  termLength: true,
  maturityDate: true,
  lastSyncedAt: true,
  autoSync: true,
  notes: true,
  vesting_start_date: true,
  vesting_end_date: true,
  vesting_schedule: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AssetSelect;

type AssetRow = Prisma.AssetGetPayload<{ select: typeof ASSET_SELECT }>;

export interface AssetResponse {
  id: string;
  userId: string;
  name: string;
  type: string;
  symbol: string | null;
  quantity: number;
  source: string | null;
  externalId: string | null;
  currency: string | null;
  current_value: number | null;
  valueOverride: number | null;
  purchase_price: number | null;
  purchase_date: string | null;
  initialAmount: number | null;
  interestRate: number | null;
  interestType: string | null;
  paymentFrequency: string | null;
  termLength: number | null;
  maturityDate: Date | null;
  lastSyncedAt: Date | null;
  autoSync: boolean;
  notes: string | null;
  vesting_schedule: Prisma.JsonValue;
  vesting_start_date: Date | null;
  vesting_end_date: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/*
 * There are no unit conversions in this module any more.
 *
 * Money is integer cents and rates are integer basis points, on the wire and at
 * rest, so a row goes out exactly as stored. What used to be here - a
 * dollars/cents pair and a percentage-to-basis-points helper - was where the
 * rate bug lived: the read and the write disagreed with liabilities about what
 * a rate meant, and stored every one a hundred times too large.
 */

function toResponse(asset: AssetRow): AssetResponse {
  const quantity = Number(asset.quantity) || 0;
  const purchasePrice = asset.purchasePrice;
  let currentValue = asset.current_value;

  // No stored valuation: fall back to what the position cost. This is a
  // derived figure from the user's own purchase price, not a market quote, and
  // it is the only estimate this module makes. Rounded because the product of
  // an integer number of cents and a fractional quantity is not one.
  if (currentValue === null && purchasePrice !== null && quantity > 0) {
    currentValue = Math.round(
      MoneyUtils.safeMultiply(purchasePrice, quantity),
    );
  }

  return {
    id: asset.id,
    userId: asset.userId,
    name: asset.name,
    type: asset.type,
    symbol: asset.symbol,
    quantity,
    source: asset.source,
    externalId: asset.externalId,
    currency: asset.currency,
    current_value: currentValue,
    valueOverride: asset.valueOverride,
    purchase_price: purchasePrice,
    purchase_date: asset.purchaseDate
      ? asset.purchaseDate.toISOString().split("T")[0]
      : null,
    initialAmount: asset.initialAmount,
    interestRate: asset.interestRate,
    interestType: asset.interestType,
    paymentFrequency: asset.paymentFrequency,
    termLength: asset.termLength,
    maturityDate: asset.maturityDate,
    lastSyncedAt: asset.lastSyncedAt,
    autoSync: asset.autoSync,
    notes: asset.notes,
    vesting_schedule: asset.vesting_schedule,
    vesting_start_date: asset.vesting_start_date,
    vesting_end_date: asset.vesting_end_date,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };
}

/**
 * `Asset.symbol` is a foreign key to `Symbol.symbol`, and the Symbol table is
 * populated by market-data sync - so on a fresh install it is empty and any
 * holding with a ticker failed on the foreign key. Register the ticker on
 * demand; price sync fills in the market fields later.
 */
async function ensureSymbol(
  symbol: string,
  name: string,
  type: AssetRow["type"],
): Promise<void> {
  await prisma.symbol.upsert({
    where: { symbol },
    update: {},
    create: { symbol, name: name || symbol, type },
  });
}

export async function createAsset(
  input: CreateAssetInput,
): Promise<AssetResponse> {
  const user = await requireUser();
  assertNotDemo(user);

  if (input.symbol) {
    await ensureSymbol(input.symbol, input.name, input.type);
  }

  const asset = await prisma.asset.create({
    data: {
      userId: user.id,
      name: input.name,
      type: input.type,
      symbol: input.symbol,
      quantity: input.quantity,
      currency: input.currency,
      source: input.source,
      externalId: input.externalId,
      notes: input.notes,
      autoSync: input.autoSync,
      current_value: input.current_value,
      valueOverride: input.valueOverride,
      purchasePrice: input.purchase_price,
      initialAmount: input.initialAmount,
      interestRate:
        input.interestRate === undefined
          ? undefined
          : input.interestRate,
      interestType: input.interestType,
      paymentFrequency: input.paymentFrequency,
      termLength: input.termLength,
      maturityDate: input.maturityDate ? new Date(input.maturityDate) : undefined,
      purchaseDate: input.purchase_date ? new Date(input.purchase_date) : undefined,
      vesting_start_date: input.vesting_start_date
        ? new Date(input.vesting_start_date)
        : undefined,
      vesting_end_date: input.vesting_end_date
        ? new Date(input.vesting_end_date)
        : undefined,
      vesting_schedule: input.vesting_schedule ?? undefined,
    },
    select: ASSET_SELECT,
  });

  // Fetch an opening price for a tradeable holding, without making the caller
  // wait for a third-party API. This used to be a bare un-awaited call, which
  // on serverless is simply dropped: the instance freezes the moment the
  // response is sent. waitUntil keeps it alive until the work finishes.
  if (asset.symbol && (asset.type === "STOCK" || asset.type === "CRYPTO")) {
    waitUntil(
      syncAssetPrice(asset.id).catch((error: unknown) => {
        console.error(`Opening price fetch failed for ${asset.symbol}:`, error);
      }),
    );
  }

  return toResponse(asset);
}

export async function listAssets(query: {
  type?: AssetRow["type"];
}): Promise<AssetResponse[]> {
  const user = await requireUser();

  const assets = await prisma.asset.findMany({
    where: { userId: user.id, ...(query.type ? { type: query.type } : {}) },
    select: ASSET_SELECT,
    orderBy: { createdAt: "desc" },
  });

  return assets.map(toResponse);
}

export async function getAsset(id: string): Promise<AssetResponse> {
  const user = await requireUser();

  // Scoped by userId in the query itself: an asset belonging to someone else
  // is indistinguishable from one that does not exist.
  const asset = await prisma.asset.findFirst({
    where: { id, userId: user.id },
    select: ASSET_SELECT,
  });
  if (!asset) throw new NotFound("Asset not found");

  return toResponse(asset);
}

export async function updateAsset(
  id: string,
  input: UpdateAssetInput,
): Promise<AssetResponse> {
  const user = await requireUser();
  assertNotDemo(user);

  const existing = await prisma.asset.findFirst({
    where: { id, userId: user.id },
    select: { id: true, name: true, type: true },
  });
  if (!existing) throw new NotFound("Asset not found");

  if (input.symbol) {
    await ensureSymbol(
      input.symbol,
      input.name ?? existing.name,
      input.type ?? existing.type,
    );
  }

  // Unchecked, because `symbol` is a foreign key: the checked variant expects
  // a nested relation write, and the column is what we are setting.
  const data: Prisma.AssetUncheckedUpdateInput = {
    name: input.name,
    type: input.type,
    symbol: input.symbol,
    quantity: input.quantity,
    currency: input.currency,
    source: input.source,
    externalId: input.externalId,
    notes: input.notes,
    autoSync: input.autoSync,
    current_value: input.current_value,
    valueOverride: input.valueOverride,
    purchasePrice: input.purchase_price,
    initialAmount: input.initialAmount,
    interestType: input.interestType,
    paymentFrequency: input.paymentFrequency,
    termLength: input.termLength,
  };

  if (input.interestRate !== undefined) {
    data.interestRate = input.interestRate;
  }
  if (input.purchase_date !== undefined) {
    data.purchaseDate = new Date(input.purchase_date);
  }
  if (input.maturityDate !== undefined) {
    data.maturityDate = new Date(input.maturityDate);
  }
  if (input.vesting_start_date !== undefined) {
    data.vesting_start_date = new Date(input.vesting_start_date);
  }
  if (input.vesting_end_date !== undefined) {
    data.vesting_end_date = new Date(input.vesting_end_date);
  }
  if (input.vesting_schedule !== undefined) {
    // An explicit null means "clear it", which for a Json column has to be
    // spelled DbNull - a bare null is how you set JSON's own null literal.
    data.vesting_schedule = input.vesting_schedule ?? Prisma.DbNull;
  }

  const asset = await prisma.asset.update({
    where: { id },
    data,
    select: ASSET_SELECT,
  });

  return toResponse(asset);
}

export async function deleteAsset(id: string): Promise<{ success: true }> {
  const user = await requireUser();
  assertNotDemo(user);

  const existing = await prisma.asset.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new NotFound("Asset not found");

  await prisma.asset.delete({ where: { id } });

  return { success: true };
}

export interface AssetSummary {
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  percentageChange: number;
  assetsByType: Record<
    string,
    { count: number; value: number; allocation: number }
  >;
  assetCount: number;
  topPerformers: Array<
    AssetResponse & { gainLoss: number; gainLossPercent: number }
  >;
  lastUpdated: Date;
}

/** What a position cost: savings track the deposit, everything else price x quantity. */
function investedIn(asset: AssetResponse): number {
  if (asset.type === "SAVINGS") return asset.initialAmount ?? 0;
  return MoneyUtils.safeMultiply(asset.purchase_price ?? 0, asset.quantity);
}

export async function getAssetSummary(): Promise<AssetSummary> {
  const assets = await listAssets({});

  const totalValue = MoneyUtils.safeAdd(
    ...assets.map((asset) => asset.current_value ?? 0),
  );

  const assetsByType: AssetSummary["assetsByType"] = {};
  for (const asset of assets) {
    const bucket = (assetsByType[asset.type] ??= {
      count: 0,
      value: 0,
      allocation: 0,
    });
    bucket.count += 1;
    bucket.value = MoneyUtils.safeAdd(bucket.value, asset.current_value ?? 0);
  }
  for (const bucket of Object.values(assetsByType)) {
    bucket.allocation =
      totalValue > 0
        ? MoneyUtils.safeMultiply(
            MoneyUtils.safeDivide(bucket.value, totalValue),
            100,
          )
        : 0;
  }

  const totalInvested = MoneyUtils.safeAdd(...assets.map(investedIn));
  const gainLoss = MoneyUtils.calculateGainLoss(totalInvested, totalValue);

  const topPerformers = assets
    .filter((asset) => asset.purchase_price !== null && asset.current_value !== null)
    .map((asset) => {
      const result = MoneyUtils.calculateGainLoss(
        investedIn(asset),
        asset.current_value ?? 0,
      );
      return {
        ...asset,
        gainLoss: result.gain,
        gainLossPercent: result.percentage,
      };
    })
    .sort((a, b) => b.gainLossPercent - a.gainLossPercent)
    .slice(0, 5);

  return {
    totalValue,
    totalInvested,
    totalGainLoss: gainLoss.gain,
    percentageChange: gainLoss.percentage,
    assetsByType,
    assetCount: assets.length,
    topPerformers,
    lastUpdated: new Date(),
  };
}

export interface HistoryPoint {
  date: string;
  totalValue: number;
}

/**
 * Portfolio value over time, from recorded prices.
 *
 * This replaces generateMockHistory(), which returned a sine wave plus
 * Math.random() and was wired straight into the performance chart - every user
 * saw an invented ten thousand dollar portfolio trending upwards, whatever
 * they actually held.
 *
 * Each day is valued at the most recent price recorded on or before it,
 * multiplied by the quantity held. An asset with no recorded price contributes
 * nothing: there is no record of what it was worth on a past date, and
 * carrying today's valuation backwards would draw a flat line that looks like
 * data. If nothing has ever been priced the series is empty, and the chart
 * correctly shows nothing.
 */
export async function getAssetHistory(days: number): Promise<HistoryPoint[]> {
  const user = await requireUser();

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  since.setUTCHours(0, 0, 0, 0);

  const assets = await prisma.asset.findMany({
    where: { userId: user.id },
    select: { id: true, quantity: true },
  });
  if (assets.length === 0) return [];

  const quantities = new Map(
    assets.map((asset) => [asset.id, Number(asset.quantity) || 0]),
  );

  const prices = await prisma.priceHistory.findMany({
    where: { assetId: { in: assets.map((asset) => asset.id) } },
    select: { assetId: true, price: true, timestamp: true },
    orderBy: { timestamp: "asc" },
  });
  if (prices.length === 0) return [];

  const history: HistoryPoint[] = [];
  const latest = new Map<string, number>();
  let cursor = 0;

  for (let offset = 0; offset <= days; offset++) {
    const day = new Date(since);
    day.setUTCDate(day.getUTCDate() + offset);
    const endOfDay = new Date(day);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // The rows are ordered by timestamp, so one pass carries the last known
    // price for every asset forward as the days advance.
    while (cursor < prices.length && prices[cursor].timestamp <= endOfDay) {
      latest.set(prices[cursor].assetId, prices[cursor].price);
      cursor++;
    }

    if (latest.size === 0) continue;

    // Cents throughout. The stored price is cents and the quantity is a plain
    // count, so the product is cents; this used to divide each price to dollars
    // first and hand the route a decimal to multiply back up again.
    let total = 0;
    for (const [assetId, price] of latest) {
      total = MoneyUtils.safeAdd(
        total,
        MoneyUtils.safeMultiply(price, quantities.get(assetId) ?? 0),
      );
    }

    history.push({
      date: day.toISOString().split("T")[0],
      totalValue: Math.round(total),
    });
  }

  return history;
}
