import { withRoute } from "@/server/http/handler";
import { ImportExpensesSchema } from "@/server/modules/expenses/schemas";
import { importExpenses } from "@/server/modules/expenses/service";

/**
 * Bulk import of reviewed bank statement lines. Amounts are cents, as everywhere
 * else in the expenses API. The rows were parsed in the browser, so the service
 * revalidates them and deduplicates against what the caller already has rather
 * than trusting the batch to be new.
 */
export const POST = withRoute({
  body: ImportExpensesSchema,
  handler: async ({ body }) => {
    const { imported, skipped } = await importExpenses(body);
    return { imported, skipped, error: null };
  },
});
