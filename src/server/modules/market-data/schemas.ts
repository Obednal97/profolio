import "server-only";
import { z } from "zod";
import { AssetType } from "@prisma/client";
import { blankable } from "@/server/http/zod";

export const SymbolParamSchema = z
  .object({ symbol: z.string().trim().min(1).max(32) })
  .strict();

export const SearchQuerySchema = z
  .object({
    q: z.string().trim().max(64).default(""),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();

export const SymbolQuerySchema = z
  .object({ symbol: z.string().trim().min(1).max(32) })
  .strict();

export const TopSymbolsQuerySchema = z
  .object({
    type: blankable(
      z
        .string()
        .transform((value) => value.toUpperCase())
        .pipe(z.enum(AssetType)),
    ),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export const PortfolioHistoryParamsSchema = z
  .object({ userId: z.string().min(1) })
  .strict();

export const PortfolioHistoryQuerySchema = z
  .object({ days: z.coerce.number().int().min(1).max(3650).default(30) })
  .strict();
