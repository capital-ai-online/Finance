import { describe, expect, it } from 'vitest';
import { validateWorkPackageIssueBody } from '../../scripts/systemadmin/validateWorkPackageIssue.mjs';

const valid = {
  version: '1.0',
  mode: 'BOUNDED_WORK_PACKAGE',
  workPackageId: 'GENERALIZATION-PROOF',
  mandateId: 'REM-WORKPACKAGE-GEN-PROOF-001',
  roadmapItem: 'SYSTEMADMIN-WORK-PACKAGE-CATALOG-GENERALIZATION',
  baseSha: '0123456789abcdef0123456789abcdef01234567',
  branchName: 'agent/systemadmin-work-package-gen-proof-1',
};

describe('Generalized Systemadmin work-package Issue contract', () => {
  it('accepts only the exact bounded catalog request', () => {
    expect(validateWorkPackageIssueBody(JSON.stringify(valid))).toEqual(valid);
  });

  it.each([
    ['unknown field', { ...valid, command: 'git push --force' }],
    ['file payload', { ...valid, content: '# injected' }],
    ['wrong mode', { ...valid, mode: 'ARBITRARY_COMMAND' }],
    ['unknown work package', { ...valid, workPackageId: 'DOES-NOT-EXIST' }],
    ['mandate not matching catalog entry', { ...valid, mandateId: 'REM-WORKPACKAGE-OTHER-001' }],
    ['roadmap item not matching catalog entry', { ...valid, roadmapItem: 'SOMETHING-ELSE' }],
    ['short SHA', { ...valid, baseSha: 'abc123' }],
    ['uppercase SHA', { ...valid, baseSha: valid.baseSha.toUpperCase() }],
    ['main branch', { ...valid, branchName: 'main' }],
    ['wrong branch namespace', { ...valid, branchName: 'agent/sa4-pilot-x' }],
    ['nested branch escape', { ...valid, branchName: 'agent/systemadmin-work-package-gen-proof-x/../../main' }],
    ['shell branch', { ...valid, branchName: 'agent/systemadmin-work-package-gen-proof-x;rm-rf' }],
  ])('rejects %s', (_label, request) => {
    expect(() => validateWorkPackageIssueBody(JSON.stringify(request)))
      .toThrow('[WORKPACKAGE-REQUEST][SECURITY]');
  });

  it('rejects non-JSON and oversized bodies', () => {
    expect(() => validateWorkPackageIssueBody('```json\n{}\n```')).toThrow('gültiges JSON');
    expect(() => validateWorkPackageIssueBody('x'.repeat(8_193))).toThrow('8 KiB');
  });
});
