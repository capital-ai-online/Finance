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
      // HOTFIX: Rollup übernimmt die Chunk-Aufteilung wieder selbst.
      // Die zuvor erzwungene Trennung in vendor und vendor-react erzeugte
      // einen zyklischen Chunk (vendor -> vendor-react -> vendor) und ließ
      // React in Produktion vor dem Mount mit createContext abbrechen.
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
