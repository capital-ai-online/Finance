import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // SEO-ROADMAP-0001 / D4: split vendor chunks to reduce main-bundle size
      // (previously ~2.49 MB / 678 kB gzip single chunk).
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return;
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('\\react\\')) {
              return 'vendor-react';
            }
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('stripe')) return 'vendor-stripe';
            return 'vendor';
          },
        },
      },
      chunkSizeWarningLimit: 900,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    // Audit ARCH-AUDIT-0002 (D5): wiederverwendet die bestehende Vite-Konfiguration
    // (Plugins, Alias) statt eine separate Test-Toolchain aufzusetzen.
    test: {
      environment: 'node',
      // tests/integration is included because REM-M5A-REPOSITORY-001.allowedPaths references
      // tests/integration/nativeMfaAal2.test.ts; without this, an M5A negative test placed there
      // would silently never run while CI still reports green.
      include: ['tests/unit/**/*.test.ts', 'tests/server/**/*.test.ts', 'tests/integration/**/*.test.ts'],
      globals: false,
    },
  };
});
