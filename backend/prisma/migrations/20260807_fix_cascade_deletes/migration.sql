-- Fix cascade delete for Invoice, AuditLog, Report, and License->Subscription
-- These changes allow Company deletion to properly cascade through all child records

-- Drop and recreate FK constraints with CASCADE

-- License -> Subscription: change from RESTRICT to CASCADE
ALTER TABLE "licenses" DROP CONSTRAINT IF EXISTS "licenses_subscriptionId_fkey";
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_subscriptionId_fkey" 
  FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AuditLog -> Company: add CASCADE
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_companyId_fkey";
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_companyId_fkey" 
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Invoice -> Company: add CASCADE
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_companyId_fkey";
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_companyId_fkey" 
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Report -> Company: add CASCADE
ALTER TABLE "reports" DROP CONSTRAINT IF EXISTS "reports_companyId_fkey";
ALTER TABLE "reports" ADD CONSTRAINT "reports_companyId_fkey" 
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
