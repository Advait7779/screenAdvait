CREATE INDEX "users_companyId_role_createdAt_id_idx"
  ON "users"("companyId", "role", "createdAt" DESC, "id" DESC);

CREATE INDEX "licenses_createdAt_id_idx"
  ON "licenses"("createdAt" DESC, "id" DESC);

CREATE INDEX "screenshots_companyId_capturedAt_id_idx"
  ON "screenshots"("companyId", "capturedAt" DESC, "id" DESC);

CREATE INDEX "subscriptions_createdAt_id_idx"
  ON "subscriptions"("createdAt" DESC, "id" DESC);
