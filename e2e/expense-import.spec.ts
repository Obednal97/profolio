import fs from "node:fs";
import path from "node:path";
import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Bank statement import, end to end through the browser.
 *
 * The statement is parsed by client-side code, so this is the only way to
 * exercise the real path: the fixture goes through the dropzone, the parser and
 * the review screen, and the assertions are made against what the API says was
 * stored rather than against the rendered text. The amounts are the point.
 * `ParsedTransaction.amount` is integer cents all the way from the parser to the
 * expense column, and a hundredfold slip anywhere in between shows up here as
 * the wrong integer.
 *
 * The expected figures are derived from the fixture rather than written out, so
 * the test cannot drift from the file it reads and a hand-typed total cannot
 * quietly become the thing being asserted.
 *
 * Needs a running app and a database. It signs up a throwaway account rather
 * than faking a token, because the import endpoint takes the user from the
 * session.
 */

const FIXTURE = path.join(__dirname, "fixtures", "monzo-statement.csv");

/**
 * The fixture as the CSV reader should see it: description to amount in cents.
 * Pot transfers are money moving inside the account rather than spending, and
 * the reader drops them.
 */
function expectedFromFixture(): Map<string, number> {
  const [header, ...rows] = fs
    .readFileSync(FIXTURE, "utf8")
    .split("\n")
    .filter((line) => line.trim());
  const columns = header.split(",").map((name) => name.trim().toLowerCase());
  const index = {
    type: columns.indexOf("type"),
    name: columns.indexOf("name"),
    out: columns.indexOf("money out"),
    in: columns.indexOf("money in"),
  };

  const expected = new Map<string, number>();
  for (const row of rows) {
    const cells = row.split(",");
    if (cells[index.type].toLowerCase().includes("pot transfer")) continue;
    const out = parseFloat(cells[index.out]);
    const moneyIn = parseFloat(cells[index.in]);
    const pounds = out > 0 ? out : moneyIn;
    expected.set(cells[index.name], Math.round(pounds * 100));
  }
  return expected;
}

interface StoredExpense {
  amount: number;
  category: string;
  notes: string | null;
}

async function listExpenses(request: APIRequestContext) {
  const response = await request.get("/api/expenses?limit=500&days=3650");
  expect(response.ok()).toBeTruthy();
  const body: { expenses: StoredExpense[] } = await response.json();
  return body.expenses;
}

test.describe("Bank statement import", () => {
  test("imports a CSV statement once and refuses to double count it", async ({
    page,
    context,
  }) => {
    const expected = expectedFromFixture();
    const rowCount = expected.size;

    const email = `import-${Date.now()}@example.test`;
    const password = "Verify123!pass";
    const signUp = await context.request.post("/api/auth/signup", {
      data: { email, password, name: "Import Fixture" },
    });
    expect(signUp.ok()).toBeTruthy();

    // The account exists and the session cookie is set, but the client-side auth
    // state is established by signing in, and the app layout sends anyone it
    // does not recognise back to the sign-in page.
    await page.goto("/auth/signIn");
    await page.locator("#email").first().fill(email);
    await page.locator("#password").first().fill(password);
    await page.getByTestId("submit-login").first().click();
    await page.waitForURL(/\/app\//, { timeout: 60000 });

    await page.goto("/app/expenses/import");
    await expect(page.getByTestId("statement-uploader")).toBeVisible();

    await page.setInputFiles('input[type="file"]', FIXTURE);

    // The review screen only appears once the parser has produced rows.
    await expect(page.getByText("Review Transactions")).toBeVisible();
    await expect(
      page.getByText(`${rowCount} of ${rowCount} selected`)
    ).toBeVisible();

    await page
      .getByRole("button", { name: new RegExp(`Save ${rowCount} Transactions`) })
      .click();

    await expect(page.getByTestId("import-summary")).toBeVisible();
    await expect(page.getByTestId("import-imported-count")).toHaveText(
      String(rowCount)
    );
    await expect(page.getByTestId("import-skipped-count")).toHaveText("0");

    const stored = await listExpenses(context.request);
    expect(stored).toHaveLength(rowCount);

    for (const [description, cents] of expected) {
      const row = stored.find((expense) => expense.notes === description);
      expect(row, `expected a stored row for ${description}`).toBeTruthy();
      expect(row?.amount, `${description} should be ${cents} cents`).toBe(cents);
    }

    // A statement line of 9.45 becomes 944.9999999999999 when the CSV reader
    // multiplies by 100, so this is the row that proves the amount is rounded on
    // arrival rather than rejected by the integer column.
    expect(
      stored.find((expense) => expense.notes === "BOOTS THE CHEMIST 88")?.amount
    ).toBe(945);

    // Merchant recognition survives the round trip.
    expect(
      stored.find((expense) => expense.notes === "COSTA COFFEE LONDON")?.category
    ).toBe("coffee_tea");
    expect(
      stored.find((expense) => expense.notes === "NETFLIX.COM")?.category
    ).toBe("streaming");

    // A 2.40 line matches no merchant and no keyword, so it falls through to the
    // amount heuristics. Those thresholds used to be compared against cents as
    // though they were pounds, which sent everything above ten pence down the
    // "large amount" branch and into Other. Coffee here is the heuristic working
    // as it was written to.
    expect(
      stored.find((expense) => expense.notes === "BLUEBIRD KIOSK 22")?.category
    ).toBe("coffee_tea");

    // Money in is recorded under an income category, because the expense table
    // has no sign of its own and the expense manager reads income off the
    // category alone.
    expect(
      stored.find((expense) => expense.notes === "ACME LTD SALARY")?.category
    ).toBe("salary");
    expect(
      stored.find((expense) => expense.notes === "HMRC TAX REBATE")?.category
    ).toBe("income");

    // Importing the same statement again must add nothing at all.
    await page.goto("/app/expenses/import");
    await page.setInputFiles('input[type="file"]', FIXTURE);
    await expect(page.getByText("Review Transactions")).toBeVisible();
    await page
      .getByRole("button", { name: new RegExp(`Save ${rowCount} Transactions`) })
      .click();

    await expect(page.getByTestId("import-summary")).toBeVisible();
    await expect(page.getByTestId("import-imported-count")).toHaveText("0");
    await expect(page.getByTestId("import-skipped-count")).toHaveText(
      String(rowCount)
    );

    expect(await listExpenses(context.request)).toHaveLength(rowCount);
  });
});
