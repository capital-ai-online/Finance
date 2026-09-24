import fs from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

const packageMetadata = JSON.parse(
  fs.readFileSync(path.resolve(import.meta.dirname, 'package.json'), 'utf8'),
) as { version: string };

const PLATFORM_SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
if (!PLATFORM_SEMVER.test(packageMetadata.version)) {
  throw new Error('[Vite] package.json#version must be strict MAJOR.MINOR.PATCH SemVer.');
}

// Strangler adapter for the remaining Dashboard monolith. The source file is
// deliberately not treated as a version authority: at transform time its
// platform-version label is projected from package.json#version. The rule is
// scoped to this single human-facing label so model/provider/schema versions
// remain independent version domains.
const DASHBOARD_PLATFORM_VERSION_PATTERN = /Beta · Version \d+\.\d+\.\d+/g;
function platformVersionProjectionPlugin() {
  return {
    name: 'capital-ai-platform-version-projection',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      const normalizedId = id.replace(/\\/g, '/');
      if (!normalizedId.endsWith('/src/components/Dashboard.tsx')) return null;

      const projected = code.replace(
        DASHBOARD_PLATFORM_VERSION_PATTERN,
        `Beta · Version ${packageMetadata.version}`,
      );
      return projected === code ? null : { code: projected, map: null };
    },
  };
}

type TokenNode = {
  value?: unknown;
  $value?: unknown;
  [key: string]: unknown;
};

const designTokens = JSON.parse(
  fs.readFileSync(path.resolve(import.meta.dirname, 'docs/frontend/design-tokens.json'), 'utf8'),
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

// Keep only independent, known-heavy libraries in dedicated chunks. React and the generic
// vendor graph intentionally remain under Rollup control: an earlier vendor/vendor-react split
// introduced a cyclic chunk and a production createContext crash.
function performanceManualChunk(id: string): string | undefined {
  const normalizedId = id.replace(/\\/g, '/');
  if (!normalizedId.includes('/node_modules/')) return undefined;

  if (
    normalizedId.includes('/node_modules/jspdf/') ||
    normalizedId.includes('/node_modules/html2canvas/')
  ) {
    return 'vendor-pdf';
  }

  if (
    normalizedId.includes('/node_modules/recharts/') ||
    /\/node_modules\/d3(?:-[^/]+)?\//.test(normalizedId)
  ) {
    return 'vendor-charts';
  }

  if (normalizedId.includes('/node_modules/motion/')) {
    return 'vendor-motion';
  }

  return undefined;
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

export default defineConfig(({ mode }) => {
  // Resolve normal Vite .env files first. Only if neither the deployment environment nor the
  // mode-specific file supplies GA do we expose an empty public value. Empty is deliberately
  // invalid in the consent runtime, so CI/local builds remain fail-closed without an unresolved
  // `%VITE_GA_MEASUREMENT_ID%` placeholder or warning.
  const fileEnv = loadEnv(mode, process.cwd(), 'VITE_');
  if (process.env.VITE_GA_MEASUREMENT_ID === undefined) {
    process.env.VITE_GA_MEASUREMENT_ID = fileEnv.VITE_GA_MEASUREMENT_ID ?? '';
  }

  return {
    plugins: [platformVersionProjectionPlugin(), react(), tailwindcss()],
    define: {
      __CAPITAL_AI_VERSION__: JSON.stringify(packageMetadata.version),
      __CAPITAL_AI_PDF_BRAND__: JSON.stringify(pdfBrandDefinition),
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      // Preserve the proven non-cyclic default graph and carve out only isolated heavy libraries.
      // Route-level lazy boundaries keep dashboard/media/learning code out of the login entry path.
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks: performanceManualChunk,
        },
      },
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