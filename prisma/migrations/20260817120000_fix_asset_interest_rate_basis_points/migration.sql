-- Asset interest rates were stored a hundred times too large.
--
-- The API accepts an annual percentage - the schema bounds it to 0..100 and the
-- form labels the field "Interest Rate (%)" - but the service passed it to
-- MoneyUtils.toBasisPoints, which scales by 10000 and therefore expects a
-- FRACTION. A rate entered as 4.25 was stored as 42500 basis points, which
-- means 425%, rather than 425.
--
-- The read used the matching inverse, so the value round tripped through the
-- assets API unchanged and nothing ever surfaced it. The column is wrong all
-- the same, and it disagrees with Liability.interestRate, which holds the same
-- unit correctly.
--
-- Every row was written by that one code path, so a blanket rescale is right
-- for all of them. Prisma records applied migrations, so this cannot run twice
-- and divide twice.
--
-- Rounding to the nearest basis point loses at most a hundredth of a percent,
-- which is the precision the column has in the first place.
UPDATE "Asset"
SET "interestRate" = ROUND("interestRate" / 100.0)
WHERE "interestRate" IS NOT NULL
  AND "interestRate" <> 0;
