import { describe, expect, it } from 'vitest';
import {
  evaluateAuthLifecycleRepositoryContracts,
  summarizeAuthLifecycleFindings,
  type AuthLifecycleFinding,
} from '../../scripts/operations/authLifecycleCorrelation';

const byId = () => new Map(evaluateAuthLifecycleRepositoryContracts().map((item) => [item.id, item]));

describe('CAPITAL-AI-OPS backend auth lifecycle correlation', () => {
  it('keeps one explicit backend-first auth inventory', () => {
    const findings = evaluateAuthLifecycleRepositoryContracts();
    expect(findings.map((item) => item.id)).toEqual([
      'backend_google_oauth_contract',
      'backend_http_only_session_contract',
      'client_auth_orchestration_removed',
      'authenticated_root_landing_handoff',
      'backend_logout_visible_contract',
      'dashboard_protected_deep_link',
      'backend_cookie_identity_contract',
      'backend_cookie_origin_csrf_boundary',
      'platform_version_projection',
      'search_structured_version_metadata',
    ]);
    expect(findings.every((item) => ['PASS', 'FAIL', 'NOT_AVAILABLE'].includes(item.result))).toBe(true);
  });

  it('requires the new backend auth cutover to be repository-complete', () => {
    const findings = byId();
    for (const id of [
      'backend_google_oauth_contract',
      'backend_http_only_session_contract',
      'client_auth_orchestration_removed',
      'authenticated_root_landing_handoff',
      'backend_logout_visible_contract',
      'dashboard_protected_deep_link',
      'backend_cookie_identity_contract',
      'backend_cookie_origin_csrf_boundary',
    ]) {
      expect(findings.get(id)?.result, id).toBe('PASS');
    }
  });

  it('keeps implementation ownership explicit', () => {
    const findings = byId();
    expect(findings.get('backend_google_oauth_contract')?.owner).toBe('CAPITAL-AI-OPS');
    expect(findings.get('backend_http_only_session_contract')?.owner).toBe('CAPITAL-AI-OPS');
    expect(findings.get('client_auth_orchestration_removed')?.owner).toBe('CAPITAL-AI-FE');
    expect(findings.get('backend_cookie_identity_contract')?.owner).toBe('CAPITAL-AI-SEC');
    expect(findings.get('backend_cookie_origin_csrf_boundary')?.owner).toBe('CAPITAL-AI-SEC');
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
