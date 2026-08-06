ALTER TABLE "screenshots"
ADD COLUMN "idempotencyKey" TEXT,
ADD COLUMN "timezoneOffsetMinutes" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "screenshots_idempotencyKey_key"
ON "screenshots"("idempotencyKey");

UPDATE "licenses" AS license
SET "currentDevices" = (
  SELECT COUNT(*)::INTEGER
  FROM "devices" AS device
  WHERE device."licenseId" = license."id"
);
