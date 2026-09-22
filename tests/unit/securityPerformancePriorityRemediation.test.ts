import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const routes = read('src/app/routing/AppRoutes.tsx');
const viteConfig = read('vite.config.ts');
const npmrc = read('.npmrc');
const packageJson = JSON.parse(read('package.json')) as {
  allowScripts?: Record<string, boolean>;
};
const vendorEvidenceValidator = read('scripts/governance/verifyVendorPrivacyEvidence.mjs');

describe('P1 auth authority cleanup', () => {
  it('keeps the native LoginStepUpGate as the only MFA/AAL decision authority', () => {
    const legacyHelper = read('src/lib/loginStepUp.ts');
    const canonicalGate = read('src/components/LoginStepUpGate.tsx');

    expect(legacyHelper).not.toContain('loginStepUpRequirement');
    expect(legacyHelper).not.toContain('supabase.auth.passkey.list');
    expect(legacyHelper).not.toContain(".select('totp_enabled')");
    expect(canonicalGate).toContain('getCurrentAssuranceLevel');
    expect(canonicalGate).toContain("setRequirement('blocked')");
    expect(canonicalGate).toContain('MFA_OPERATION_TIMEOUT_MS = 10_000');
  });
});

describe('P2 public/login bundle boundary', () => {
  it('keeps the public landing shell eager while heavyweight application routes stay lazy', () => {
    expect(routes).toContain("import React, { Suspense, lazy, useEffect, useState } from 'react'");
    expect(routes).toContain(
      "import { LandingPage, LegalAndFaqPages, LoginPage } from '../../features/public/ui'",
    );
    expect(routes).toContain("import('../dashboard/Dashboard')");
    expect(routes).not.toContain("import('../../features/public/ui/LandingPage')");
    expect(routes).toContain("import('../../features/learning/ui/LearningVocabulary')");
    expect(routes).toContain("import('../../features/social/ui/MediaStudio')");
    expect(routes).not.toContain("import { Dashboard } from '../dashboard'");
    expect(routes).not.toContain("import { LearningVocabulary } from '../../features/learning/ui'");
    expect(routes).not.toContain("import { MediaStudio } from '../../features/social/ui'");
  });

  it('splits only independent heavyweight libraries and preserves the no-vendor-react invariant', () => {
    expect(viteConfig).toContain("return 'vendor-pdf'");
    expect(viteConfig).toContain("return 'vendor-charts'");
    expect(viteConfig).toContain("return 'vendor-motion'");
    expect(viteConfig).toContain('manualChunks: performanceManualChunk');
    expect(viteConfig).toContain('chunkSizeWarningLimit: 900');
    expect(viteConfig).not.toContain("return 'vendor-react'");
  });
});

describe('P2 Google Analytics build fallback', () => {
  it('uses deployment/.env GA values when present and otherwise fails closed to an empty value', () => {
    expect(viteConfig).toContain("const fileEnv = loadEnv(mode, process.cwd(), 'VITE_')");
    expect(viteConfig).toContain('if (process.env.VITE_GA_MEASUREMENT_ID === undefined)');
    expect(viteConfig).toContain(
      "process.env.VITE_GA_MEASUREMENT_ID = fileEnv.VITE_GA_MEASUREMENT_ID ?? ''",
    );

    const consentRuntime = read('public/google-analytics-consent.js');
    expect(consentRuntime).toContain('/^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID)');
    expect(consentRuntime).toContain('if (!validGaId || gaLoaded) return');
  });
});

describe('P3 dependency lifecycle-script policy', () => {
  it('allows only reviewed build scripts, explicitly denies the macOS-only fsevents hook, and fails closed on new scripts', () => {
    expect(packageJson.allowScripts).toEqual({
      'core-js@3.49.0': true,
      'esbuild@0.25.12': true,
      'esbuild@0.28.1': true,
      'fsevents@2.3.3': false,
    });
    expect(npmrc.trim()).toBe('strict-allow-scripts=true');
  });
});

describe('P3 vendor privacy evidence semantics', () => {
  it('distinguishes active production gaps from planned pre-onboarding candidates', () => {
    expect(vendorEvidenceValidator).toContain('isActiveProductionProcessing');
    expect(vendorEvidenceValidator).toContain('isPlannedProcessing');
    expect(vendorEvidenceValidator).toContain('active production gap(s)');
    expect(vendorEvidenceValidator).toContain('planned/inactive candidate(s)');
  });

  it('reports only active production gaps in onboarding mode for the current inventory', () => {
    const result = spawnSync(
      process.execPath,
      [path.join(root, 'scripts/governance/verifyVendorPrivacyEvidence.mjs')],
      { cwd: root, encoding: 'utf8' },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('5 active production gap(s), 7 planned/inactive candidate(s)');
    expect(result.stdout).toContain('INFO youtube: planned/inactive pre-onboarding evidence remains pending');
    expect(result.stderr).toContain('WARN supabase: overall evidence status is pending');
    expect(result.stderr).toContain('WARN google: overall evidence status is pending');
    expect(result.stderr).not.toContain('WARN youtube:');
  });

  it('keeps strict verification fail-closed for unresolved planned candidates too', () => {
    const result = spawnSync(
      process.execPath,
      [path.join(root, 'scripts/governance/verifyVendorPrivacyEvidence.mjs'), '--strict'],
      { cwd: root, encoding: 'utf8' },
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('ERROR google: overall evidence status is pending');
    expect(result.stderr).toContain('ERROR youtube: overall evidence status is pending');
    expect(result.stderr).toContain('Evidence gate failed with 12 error(s).');
  });
});
