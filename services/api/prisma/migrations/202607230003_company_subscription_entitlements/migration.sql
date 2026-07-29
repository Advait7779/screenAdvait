-- Add an explicit parent subscription state for every customer company.
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED');

ALTER TABLE "subscriptions"
ADD COLUMN "status" "SubscriptionStatus",
ADD COLUMN "maxEmployees" INTEGER,
ADD COLUMN "maxDevices" INTEGER,
ADD COLUMN "maxStorageMb" BIGINT,
ADD COLUMN "createdByUserId" TEXT,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "subscriptions"
SET
  "status" = CASE
    WHEN "endDate" <= CURRENT_TIMESTAMP THEN 'EXPIRED'::"SubscriptionStatus"
    WHEN "isActive" = false THEN 'SUSPENDED'::"SubscriptionStatus"
    ELSE 'ACTIVE'::"SubscriptionStatus"
  END,
  "maxEmployees" = COALESCE(
    (SELECT "maxUsers" FROM "companies" WHERE "companies"."id" = "subscriptions"."companyId"),
    10
  ),
  "maxDevices" = GREATEST(
    COALESCE(
      (SELECT SUM("maxDevices")::INTEGER FROM "licenses" WHERE "licenses"."companyId" = "subscriptions"."companyId"),
      0
    ),
    1
  ),
  "maxStorageMb" = COALESCE(
    (SELECT "maxStorageMb" FROM "companies" WHERE "companies"."id" = "subscriptions"."companyId"),
    10240
  );

-- Backfill one parent subscription for companies created before subscriptions were enforced.
INSERT INTO "subscriptions" (
  "id",
  "companyId",
  "plan",
  "status",
  "startDate",
  "endDate",
  "maxEmployees",
  "maxDevices",
  "maxStorageMb",
  "createdAt",
  "updatedAt",
  "isActive"
)
SELECT
  'sub_' || md5(random()::text || clock_timestamp()::text || c."id"),
  c."id",
  COALESCE(
    (SELECT l."plan" FROM "licenses" l WHERE l."companyId" = c."id" ORDER BY l."createdAt" ASC LIMIT 1),
    'ONE_YEAR'::"LicensePlan"
  ),
  CASE
    WHEN COALESCE(
      (SELECT MAX(l."expiryDate") FROM "licenses" l WHERE l."companyId" = c."id"),
      CURRENT_TIMESTAMP + INTERVAL '365 days'
    ) <= CURRENT_TIMESTAMP THEN 'EXPIRED'::"SubscriptionStatus"
    ELSE 'ACTIVE'::"SubscriptionStatus"
  END,
  COALESCE(
    (SELECT MIN(l."issueDate") FROM "licenses" l WHERE l."companyId" = c."id"),
    CURRENT_TIMESTAMP
  ),
  COALESCE(
    (SELECT MAX(l."expiryDate") FROM "licenses" l WHERE l."companyId" = c."id"),
    CURRENT_TIMESTAMP + INTERVAL '365 days'
  ),
  c."maxUsers",
  GREATEST(
    COALESCE((SELECT SUM(l."maxDevices")::INTEGER FROM "licenses" l WHERE l."companyId" = c."id"), 0),
    1
  ),
  c."maxStorageMb",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  true
FROM "companies" c
WHERE NOT EXISTS (
  SELECT 1 FROM "subscriptions" s WHERE s."companyId" = c."id"
);

ALTER TABLE "subscriptions"
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE',
ALTER COLUMN "maxEmployees" SET NOT NULL,
ALTER COLUMN "maxEmployees" SET DEFAULT 10,
ALTER COLUMN "maxDevices" SET NOT NULL,
ALTER COLUMN "maxDevices" SET DEFAULT 10,
ALTER COLUMN "maxStorageMb" SET NOT NULL,
ALTER COLUMN "maxStorageMb" SET DEFAULT 10240;

ALTER TABLE "subscriptions" DROP COLUMN "isActive";

ALTER TABLE "licenses" ADD COLUMN "subscriptionId" TEXT;

UPDATE "licenses" l
SET "subscriptionId" = (
  SELECT s."id"
  FROM "subscriptions" s
  WHERE s."companyId" = l."companyId"
  ORDER BY s."createdAt" DESC
  LIMIT 1
);

ALTER TABLE "licenses" ALTER COLUMN "subscriptionId" SET NOT NULL;

CREATE INDEX "subscriptions_companyId_status_idx"
ON "subscriptions"("companyId", "status");

CREATE INDEX "licenses_subscriptionId_status_idx"
ON "licenses"("subscriptionId", "status");

ALTER TABLE "licenses"
ADD CONSTRAINT "licenses_subscriptionId_fkey"
FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
