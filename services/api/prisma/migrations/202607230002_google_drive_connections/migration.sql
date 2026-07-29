-- Store one administrator-authorized Google Drive destination per company.
CREATE TABLE "google_drive_connections" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "connectedByUserId" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT NOT NULL,
    "rootFolderId" TEXT NOT NULL,
    "rootFolderName" TEXT NOT NULL,
    "accountEmail" TEXT,
    "grantedScopes" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_drive_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "google_drive_connections_companyId_key"
ON "google_drive_connections"("companyId");

ALTER TABLE "google_drive_connections"
ADD CONSTRAINT "google_drive_connections_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
