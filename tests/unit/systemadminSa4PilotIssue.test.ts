import { describe, expect, it } from 'vitest';
import { validateSa4PilotIssueBody } from '../../scripts/systemadmin/validateSa4PilotIssue.mjs';

const valid = {
  version: '1.0',
  mode: 'BOUNDED_DOC_PR',
  mandateId: 'REM-SA4-PILOT-001',
  roadmapItem: 'SA4-FIRST-AUTONOMOUS-WORK-PACKAGE',
  baseSha: '0123456789abcdef0123456789abcdef01234567',
  branchName: 'agent/sa4-pilot-proof-1',
};

describe('SA4 bounded pilot Issue contract', () => {
  it('accepts only the exact bounded documentation PR request', () => {
    expect(validateSa4PilotIssueBody(JSON.stringify(valid))).toEqual(valid);
  });

  it.each([
    ['unknown field', { ...valid, command: 'git push --force' }],
    ['file payload', { ...valid, content: '# injected' }],
    ['wrong mode', { ...valid, mode: 'ARBITRARY_COMMAND' }],
    ['wrong mandate', { ...valid, mandateId: 'REM-SA4-OTHER' }],
    ['wrong roadmap item', { ...valid, roadmapItem: 'SA5' }],
    ['short SHA', { ...valid, baseSha: 'abc123' }],
    ['uppercase SHA', { ...valid, baseSha: valid.baseSha.toUpperCase() }],
    ['main branch', { ...valid, branchName: 'main' }],
    ['nested branch escape', { ...valid, branchName: 'agent/sa4-pilot-x/../../main' }],
    ['shell branch', { ...valid, branchName: 'agent/sa4-pilot-x;rm-rf' }],
  ])('rejects %s', (_label, request) => {
    expect(() => validateSa4PilotIssueBody(JSON.stringify(request)))
      .toThrow('[SA4-REQUEST][SECURITY]');
  });

  it('rejects non-JSON and oversized bodies', () => {
    expect(() => validateSa4PilotIssueBody('```json\n{}\n```')).toThrow('gültiges JSON');
    expect(() => validateSa4PilotIssueBody('x'.repeat(8_193))).toThrow('8 KiB');
  });
});
