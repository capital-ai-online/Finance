import fs from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const packageMetadata = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'),
) as { version: string };

type TokenNode = {
  value?: unknown;
  $value?: unknown;
  [key: string]: unknown;
};

const designTokens = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'docs/frontend/design-tokens.json'), 'utf8'),
) as Record<string, unknown>;

function tokenValue(pathSegments: string[]): unknown {
  let current: unknown = designTokens;
  for (const segment of pathSegments) {
    if (!current || typeof current !== 'object' || !(segment in current)) {
      throw new Error(`Missing design token: ${pathSegments.join('.')}`);
    }
    current = (current as Record<string, unknown>)[segment];
  }

  if (current && typeof current === 'object') {
    const token = current as TokenNode;
    if ('$value' in token) return token.$value;
    if ('value' in token) return token.value;
  }

  return current;
}

function tokenString(...pathSegments: string[]): string {
  const value = tokenValue(pathSegments);
  if (typeof value === 'string') return value;

  // Future-proof the PDF adapter for DTCG color objects without migrating the
  // repository-wide token format inside this PDF-specific change.
  if (value && typeof value === 'object' && 'hex' in value) {
    const hex = (value as { hex?: unknown }).hex;
    if (typeof hex === 'string') return hex;
  }

  throw new Error(`Design token is not a string: ${pathSegments.join('.')}`);
}

function hexToRgb(value: string): [number, number, number] {
  const normalized = value.trim().replace(/^#/, '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    throw new Error(`PDF color token must be a six-digit hex color, got: ${value}`);
  }
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

// Renderer adapters consume canonical semantic/brand roles directly. The
// deprecated color.aif namespace remains a temporary web compatibility surface
// only and must never become a runtime dependency for PDF/media projections.
const pdfBrandDefinition = {
  colors: {
    canvas: hexToRgb(tokenString('color', 'background')),
    foreground: hexToRgb(tokenString('color', 'foreground')),
    goldLight: hexToRgb(tokenString('color', 'brand', 'primary')),
    gold: hexToRgb(tokenString('color', 'brand', 'primary')),
    goldDark: hexToRgb(tokenString('color', 'brand', 'primary')),
    goldMuted: hexToRgb(tokenString('color', 'brand', 'primary')),
    cyan: hexToRgb(tokenString('color', 'brand', 'cyan')),
    purple: hexToRgb(tokenString('color', 'brand', 'accent')),
    success: hexToRgb(tokenString('color', 'semantic', 'success')),
    warning: hexToRgb(tokenString('color', 'semantic', 'warning')),
    danger: hexToRgb(tokenString('color', 'semantic', 'danger')),
    textPrimary: hexToRgb(tokenString('color', 'print', 'textPrimary')),
    textSecondary: hexToRgb(tokenString('color', 'print', 'textSecondary')),
    surfaceLight: hexToRgb(tokenString('color', 'print', 'surfaceLight')),
    borderLight: hexToRgb(tokenString('color', 'print', 'borderLight')),
    link: hexToRgb(tokenString('color', 'print', 'link')),
  },
  fonts: {
    productSans: tokenString('font', 'sans'),
    productDisplay: tokenString('font', 'display'),
    productMono: tokenString('font', 'mono'),
    pdfSafeSans: 'helvetica',
    pdfSafeMono: 'courier',
  },
} as const;

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      __CAPITAL_AI_VERSION__: JSON.stringify(packageMetadata.version),
      __CAPITAL_AI_PDF_BRAND__: JSON.stringify(pdfBrandDefinition),
    },
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
