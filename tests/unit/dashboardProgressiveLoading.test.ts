import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('authenticated dashboard progressive loading', () => {
  it('keeps non-active dashboard feature graphs out of the critical mount path', () => {
    const dashboard = read('src/app/dashboard/Dashboard.tsx');

    expect(dashboard).toContain("const DashboardHome = lazy(() =>");
    expect(dashboard).toContain("const MyWorkspaceView = lazy(() =>");
    expect(dashboard).toContain("const DashboardViewRouter = lazy(() =>");
    expect(dashboard).toContain("activeView !== 'dashboard' && activeView !== 'myworkspace'");
    expect(dashboard).not.toContain("import { DashboardViewRouter");
    expect(dashboard).not.toContain("import { MyWorkspaceView");
    expect(dashboard).not.toContain("from '../../features';");
  });

  it('progressively activates heavyweight below-the-fold dashboard modules', () => {
    const home = read('src/app/dashboard/DashboardHome.tsx');

    expect(home).toContain("import React, { Suspense, lazy, useEffect, useRef, useState } from 'react'");
    expect(home).toContain("import('../../features/crypto/ui/CryptoScoringWorkspace')");
    expect(home).toContain('function DeferredDashboardSection');
    expect(home).toContain("{ rootMargin: '600px 0px' }");
    expect(home).toContain('<DeferredDashboardSection label="AI Newsfeed">');
    expect(home).toContain('<DeferredDashboardSection label="Compliance Export">');
    expect(home).toContain('<DeferredDashboardSection label="Markt-Sentiment">');
    expect(home).toContain('<DeferredDashboardSection label="Bildanalyse">');
    expect(home).not.toContain("from '../../features';");
  });

  it('does not change the backend-owned authentication or subscription readback contract', () => {
    const dashboard = read('src/app/dashboard/Dashboard.tsx');
    const session = read('src/app/auth/SessionComposition.tsx');
    const readback = read('src/lib/subscriptionReadback.ts');

    expect(dashboard).toContain('readAuthenticatedSubscriptionTier');
    expect(session).toContain("fetch('/api/auth/session'");
    expect(readback).toContain("authFetch('/api/stripe/user-subscription')");
  });
});
