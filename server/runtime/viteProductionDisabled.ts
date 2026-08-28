// Production-only esbuild alias for the legacy static `vite` import in server.application.ts.
// The source development path still resolves the real Vite package when running via tsx.
// Production bundles must never carry or start the Vite development server.
export async function createServer(): Promise<never> {
  throw new Error('VITE_DEV_SERVER_DISABLED_IN_PRODUCTION_BUNDLE');
}
