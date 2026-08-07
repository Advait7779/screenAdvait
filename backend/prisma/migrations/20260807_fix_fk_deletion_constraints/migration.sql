-- Fix foreign key constraints for explicit cascade/setNull deletion

ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_userId_fkey";
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "licenses" DROP CONSTRAINT IF EXISTS "licenses_userId_fkey";
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_invoiceId_fkey";
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" 
  FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
