# Deprecated standalone customer portal

This application is retained only as historical source. It is intentionally excluded from the
pnpm workspace and must not be deployed or started.

The supported management portal is `apps/admin-web` on port 3001. Its single login form routes
`SUPER_ADMIN` users to platform control and `COMPANY_ADMIN` users to the customer workspace.
