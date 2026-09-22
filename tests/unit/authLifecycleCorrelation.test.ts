import { describe, expect, it } from 'vitest';
import {
  evaluateAuthLifecycleRepositoryContracts,
  summarizeAuthLifecycleFindings,
  type AuthLifecycleFinding,
} from '../../scripts/operations/authLifecycleCorrelation';

const byId = () => new Map(evaluateAuthLifecycleRepositoryContracts().map((item) => [item.id, item]));

describe('CAPITAL-AI-OPS auth lifecycle correlation', () => {
  it('keeps the auth/version correlation inventory explicit without creating a second auth authority', () => {
    const findings = evaluateAuthLifecycleRepositoryContracts();
    expect(findings.map((item) => item.id)).toEqual([
      'google_oauth_provider_handoff',
      'authenticated_root_landing_handoff',
      'authenticated_login_root_handoff',
      'dashboard_protected_deep_link',
      'authenticated_unknown_route_root_handoff',
      'canonical_spa_fallback_contract',
      'landing_first_lf01_static_visual_gate',
      'logout_local_default',
      'logout_explicit_global_action',
      'registration_primary_contract',
      'registration_onboarding_contract',
      'landing_first_lf02_auth_profile_repository_gate',
      'registration_roadmap_closure',
      'platform_version_projection',
      'search_structured_version_metadata',
    ]);
    expect(findings.every((item) => ['PASS', 'FAIL', 'NOT_AVAILABLE'].includes(item.result))).toBe(true);
  });

  it('does not inspect legacy dashboard menu implementation details', () => {
    const findings = byId();
    expect(findings.has('dashboard_menu_interaction_contract')).toBe(false);
    expect(findings.has('authenticated_root_dashboard_handoff')).toBe(false);

    const surfaces = evaluateAuthLifecycleRepositoryContracts().flatMap((item) => item.surface);
    expect(surfaces).not.toContain('src/components/Dashboard.tsx');
  });

  it('keeps completed LF-01 independent from additive LF-02 profile projection while fail-closing productive pricing/scoring/news coupling', () => {
    const findings = byId();
    expect(findings.has('checkout_root_return_handoff')).toBe(false);

    const lf01 = findings.get('landing_first_lf01_static_visual_gate');
    expect(lf01).toBeDefined();
    expect(lf01?.owner).toBe('CAPITAL-AI-FE');
    expect(lf01?.expected).toContain('LF-01');
    expect(lf01?.surface).toContain('src/app/routing/AppRoutes.tsx');
    expect(['PASS', 'FAIL']).toContain(lf01?.result);
  });

  it('confirms the already-implemented registration security chain and canonical platform version projection', () => {
    const findings = byId();
    expect(findings.get('registration_primary_contract')?.result).toBe('PASS');
    expect(findings.get('registration_onboarding_contract')?.result).toBe('PASS');
    expect(findings.get('platform_version_projection')?.result).toBe('PASS');
    expect(findings.get('google_oauth_provider_handoff')?.result).toBe('PASS');
  });

  it('keeps LF-02 repository readiness distinct from final provider PASS and owner-routes the landing projection', () => {
    const findings = byId();
    const lf02 = findings.get('landing_first_lf02_auth_profile_repository_gate');

    expect(lf02).toBeDefined();
    expect(lf02?.owner).toBe('CAPITAL-AI-FE');
    expect(lf02?.result).toBe('NOT_AVAILABLE');
    expect(lf02?.expected).toContain('provider Security/QM evidence remains independent');
    expect(lf02?.observed).toContain('owner-correct FE handoff');
  });

  it('routes remediation findings to the owning projects and allows them to turn from FAIL to PASS without changing the OPS inventory', () => {
    const findings = byId();
    const owners: Record<string, string> = {
      authenticated_root_landing_handoff: 'CAPITAL-AI-FE',
      authenticated_login_root_handoff: 'CAPITAL-AI-FE',
      dashboard_protected_deep_link: 'CAPITAL-AI-FE',
      authenticated_unknown_route_root_handoff: 'CAPITAL-AI-FE',
      canonical_spa_fallback_contract: 'CAPITAL-AI-OPS',
      landing_first_lf01_static_visual_gate: 'CAPITAL-AI-FE',
      logout_local_default: 'CAPITAL-AI-FE',
      logout_explicit_global_action: 'CAPITAL-AI-FE',
      registration_roadmap_closure: 'CAPITAL-AI-FE',
      search_structured_version_metadata: 'CAPITAL-AI-SEO',
    };

    for (const [id, owner] of Object.entries(owners)) {
      const item = findings.get(id);
      expect(item).toBeDefined();
      expect(item?.owner).toBe(owner);
      expect(['PASS', 'FAIL']).toContain(item?.result);
      expect(item?.expected.length).toBeGreaterThan(20);
      expect(item?.observed.length).toBeGreaterThan(20);
    }
  });

  it('summarizes fail closed without changing project ownership semantics', () => {
    const base = (result: AuthLifecycleFinding['result']): AuthLifecycleFinding => ({
      id: `test-${result}`,
      result,
      owner: 'CAPITAL-AI-OPS',
      surface: ['test'],
      expected: 'expected contract',
      observed: 'observed contract',
    });

    expect(summarizeAuthLifecycleFindings([base('PASS')]).result).toBe('PASS');
    expect(summarizeAuthLifecycleFindings([base('PASS'), base('NOT_AVAILABLE')]).result).toBe('NOT_AVAILABLE');
    expect(summarizeAuthLifecycleFindings([base('PASS'), base('FAIL')]).result).toBe('FAIL');
  });
});
