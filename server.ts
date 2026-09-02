// ADR-0013 — thin process entry point.
// Process-level fatal handling is installed first so an uncaught exception or unhandled
// rejection can mark readiness unhealthy before the application begins bounded shutdown.
// The application implementation remains isolated in server.application.ts.
import './server/bootstrap/installProcessLifecycle';
import './server.application';
