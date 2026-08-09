import { withRoute } from "@/server/http/handler";
import {
  ExpenseIdSchema,
  UpdateExpenseSchema,
} from "@/server/modules/expenses/schemas";
import {
  deleteExpense,
  getExpense,
  updateExpense,
} from "@/server/modules/expenses/service";

export const GET = withRoute({
  params: ExpenseIdSchema,
  handler: ({ params }) => getExpense(params.id),
});

/** Partial update. Sending one field is enough. */
export const PATCH = withRoute({
  params: ExpenseIdSchema,
  body: UpdateExpenseSchema,
  handler: ({ params, body }) => updateExpense(params.id, body),
});

export const DELETE = withRoute({
  params: ExpenseIdSchema,
  handler: ({ params }) => deleteExpense(params.id),
});
