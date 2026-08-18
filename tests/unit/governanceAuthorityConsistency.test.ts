import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (repoPath: string) => fs.readFileSync(path.join(root, repoPath), 'utf8');

describe('governance authority consistency', () => {
  it('uses the Accepted ADR-0069 2026-08-16 addendum as the current PR-gate authority', () => {
    const adr0069 = read('docs/adr/ADR-0069-human-owner-comment-gate-and-dispatched-pr-ci.md');
    expect(adr0069).toContain('Status:** ACCEPTED');
    expect(adr0069).toContain('NACHTRAG 2026-08-16');
    expect(adr0069).toContain('Owner-Gate-Ritual retired');
  });

  it('does not present the retired Viewed/emoji ritual as a current Systemadmin merge prerequisite', () => {
    const agents = read('AGENTS.md');
    expect(agents).not.toContain('Human/Owner current-head review, Viewed attestations, scope-appropriate CI and a separate explicit Human merge instruction remain mandatory.');
    expect(agents).toContain('historical checkbox/Files-Viewed/emoji ceremony is **not** a current prerequisite');
  });

  it('labels the governance library as a historical snapshot with a current-authority annotation', () => {
    const library = read('docs/governance/CAPITAL_AI_GOVERNANCE_LIBRARY_REPORT_2026-08-15.md');
    expect(library).toContain('Snapshot date:** 2026-08-15');
    expect(library).toContain('Current-authority annotation:** 2026-08-19');
    expect(library).toContain('2026-08-16 retired');
  });

  it('keeps machine-readable main-protection policy explicit about current versus historical authority', () => {
    const policy = JSON.parse(read('.github/policies/main-production-protection.expected.json')) as {
      schema_version: string;
      authority?: {
        accepted_decision?: string;
        historical_decision_records_are_non_normative?: boolean;
      };
      promotion?: Record<string, string | null>;
    };

    expect(policy.schema_version).toBe('1.2');
    expect(policy.authority?.accepted_decision).toContain('ADR-0069');
    expect(policy.authority?.historical_decision_records_are_non_normative).toBe(true);
    expect(policy.promotion?.decision_2026-08-16_owner_gate_retired).toContain('retired');
  });

  it('does not assign retired Google AI Studio/Gemini profiles authority in the active DevelopmentChain', () => {
    const chain = read('docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md');
    expect(chain).toContain('Google AI Studio, Gemini und NotebookLM sind für die aktive DEVELOPMENT Chain **RETIRED**');
    expect(chain).not.toContain('Google AI Studio ist die Entwicklungsumgebung für Anwendungscode');
  });

  it('requires diff and impact analysis before semantic supersession becomes effective', () => {
    const authorityPolicy = read('docs/governance/GOVERNANCE_AUTHORITY_SUPERSESSION_POLICY.md');
    const impact = read('docs/governance/GOVERNANCE_SUPERSESSION_DIFF_IMPACT_2026-08-19.md');
    expect(authorityPolicy).toContain('Mandatory supersession package');
    expect(authorityPolicy).toContain('**Newer is not, by itself, higher authority.**');
    expect(impact).toContain('Human Merge of the resulting PR constitutes acceptance');
  });
});
