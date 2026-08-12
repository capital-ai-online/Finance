import { describe, expect, it } from 'vitest';
import { validateExecutionIssueBody } from '../../scripts/systemadmin/validateExecutionIssue.mjs';

const valid = {
  version: '1.0',
  mode: 'BRANCH_PROBE',
  mandateId: 'REM-SA3B-PROBE-001',
  roadmapItem: 'SA3B-HOST-PROBE',
  baseSha: '0123456789abcdef0123456789abcdef01234567',
  branchName: 'agent/sa3b-host-probe-proof-1',
};

describe('SA3B Execution Request Issue contract', () => {
  it('accepts only the exact one-time branch probe contract', () => {
    expect(validateExecutionIssueBody(JSON.stringify(valid))).toEqual(valid);
  });

  it.each([
    ['unknown field', { ...valid, command: 'git push --force' }],
    ['wrong mode', { ...valid, mode: 'COMMIT' }],
    ['wrong mandate', { ...valid, mandateId: 'REM-SA4-OTHER' }],
    ['wrong roadmap item', { ...valid, roadmapItem: 'SA4' }],
    ['short SHA', { ...valid, baseSha: 'abc123' }],
    ['uppercase SHA', { ...valid, baseSha: valid.baseSha.toUpperCase() }],
    ['main branch', { ...valid, branchName: 'main' }],
    ['shell branch', { ...valid, branchName: 'agent/sa3b-host-probe-x;rm-rf' }],
    ['slash escape', { ...valid, branchName: 'agent/sa3b-host-probe-x/../../main' }],
  ])('rejects %s', (_label, request) => {
    expect(() => validateExecutionIssueBody(JSON.stringify(request)))
      .toThrow('[SA3B-REQUEST][SECURITY]');
  });

  it('rejects non-JSON and oversized bodies', () => {
    expect(() => validateExecutionIssueBody('```json\n{}\n```')).toThrow('gültiges JSON');
    expect(() => validateExecutionIssueBody('x'.repeat(8_193))).toThrow('8 KiB');
  });
});
