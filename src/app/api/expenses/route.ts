import { withRoute } from "@/server/http/handler";
import { isDemoRequest } from "@/server/demo";
import { generateDemoExpenses } from "@/lib/demoData";
import {
  CreateExpenseSchema,
  ExpenseQuerySchema,
} from "@/server/modules/expenses/schemas";
import {
  createExpense,
  listExpenses,
} from "@/server/modules/expenses/service";

/** The caller's expenses. Amounts are in cents both ways - see schemas.ts. */
export const GET = withRoute({
  query: ExpenseQuerySchema,
  handler: async ({ query, request }) => {
    if (isDemoRequest(request)) {
      return { expenses: generateDemoExpenses(), error: null };
    }

    return { expenses: await listExpenses(query), error: null };
  },
});

export const POST = withRoute({
  body: CreateExpenseSchema,
  handler: async ({ body, request }) => {
    if (isDemoRequest(request)) {
      return {
        expense: { ...body, id: "demo-expense", userId: "demo-user-id" },
        error: null,
      };
    }

    return { expense: await createExpense(body), error: null };
  },
});
