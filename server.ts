// ADR-0013 — thin process entry point.
// The application implementation is isolated in server.application.ts so this file
// remains a stable build/runtime entry and no longer owns middleware, routes,
// providers, background jobs, billing ingress, market-data or shutdown logic.
import './server.application';
