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
      'authenticated_root_dashboard_handoff',
      'dashboard_menu_interaction_contract',
      'logout_local_default',
      'logout_explicit_global_action',
      'registration_primary_contract',
      'registration_onboarding_contract',
      'registration_roadmap_closure',
      'platform_version_projection',
      'search_structured_version_metadata',
    ]);
    expect(findings.every((item) => ['PASS', 'FAIL', 'NOT_AVAILABLE'].includes(item.result))).toBe(true);
  });

  it('confirms the already-implemented registration security chain and canonical platform version projection', () => {
    const findings = byId();
    expect(findings.get('registration_primary_contract')?.result).toBe('PASS');
    expect(findings.get('registration_onboarding_contract')?.result).toBe('PASS');
    expect(findings.get('platform_version_projection')?.result).toBe('PASS');
    expect(findings.get('google_oauth_provider_handoff')?.result).toBe('PASS');
  });

  it('keeps the hamburger interaction contract separate from post-login composition findings', () => {
    const findings = byId();
    expect(findings.get('dashboard_menu_interaction_contract')?.result).toBe('PASS');
    expect(findings.get('dashboard_menu_interaction_contract')?.owner).toBe('CAPITAL-AI-FE');
    expect(findings.get('authenticated_root_dashboard_handoff')).toBeDefined();
  });

  it('routes remediation findings to the owning projects and allows them to turn from FAIL to PASS without changing the OPS inventory', () => {
    const findings = byId();
    const owners: Record<string, string> = {
      authenticated_root_dashboard_handoff: 'CAPITAL-AI-FE',
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
