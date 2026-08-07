-- Migration: add captureIntervalSeconds and isCapturePaused to companies table
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "captureIntervalSeconds" INTEGER NOT NULL DEFAULT 900;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "isCapturePaused" BOOLEAN NOT NULL DEFAULT false;
