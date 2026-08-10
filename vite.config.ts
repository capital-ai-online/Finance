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
      rollupOptions: {
        output: {
          // Keep large, independently cacheable vendor families out of the application chunk.
          // This addresses Vite's >500 kB warning by reducing the initial bundle rather than
          // merely increasing chunkSizeWarningLimit and hiding the signal.
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'charts-vendor': ['recharts', 'd3'],
            'pdf-vendor': ['jspdf'],
            'stripe-vendor': ['@stripe/stripe-js'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    // Audit ARCH-AUDIT-0002 (D5): wiederverwendet die bestehende Vite-Konfiguration
    // (Plugins, Alias) statt eine separate Test-Toolchain aufzusetzen.
    test: {
      environment: 'node',
      include: ['tests/unit/**/*.test.ts', 'tests/server/**/*.test.ts'],
      globals: false,
    },
  };
});
