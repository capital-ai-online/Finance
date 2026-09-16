import { describe, expect, it } from 'vitest';
import {
  buildCanonicalRoadmapProgress,
  calculateRoadmapProgress,
  classifyRoadmapState,
  extractRoadmapItems,
  parseCanonicalProjects,
} from '../../scripts/governance/roadmapProgress.mjs';

describe('roadmapProgress', () => {
  it('discovers canonical projects from the canonical mapping table', () => {
    const mapping = `
| Project | PVC relationship | Canonical project folder | Branch project-folder slug |
|---|---|---|---|
| \`CAPITAL-AI-GOV\` | \`PVC-05\` Primary Owner | \`docs/projects/governance/\` | \`governance\` |
| \`CAPITAL-AI-SEC\` | cross-cutting; no productive PVC | \`docs/projects/security/\` | \`security\` |
`;

    expect(parseCanonicalProjects(mapping)).toEqual([
      {
        project: 'CAPITAL-AI-GOV',
        pvcRelationship: 'PVC-05 Primary Owner',
        folder: 'docs/projects/governance/',
        branchSlug: 'governance',
        roadmapPath: 'docs/projects/governance/ROADMAP.md',
      },
      {
        project: 'CAPITAL-AI-SEC',
        pvcRelationship: 'cross-cutting; no productive PVC',
        folder: 'docs/projects/security/',
        branchSlug: 'security',
        roadmapPath: 'docs/projects/security/ROADMAP.md',
      },
    ]);
  });

  it('fails closed on duplicate canonical project identity', () => {
    const mapping = `
| Project | PVC relationship | Canonical project folder | Branch project-folder slug |
|---|---|---|---|
| \`CAPITAL-AI-GOV\` | \`PVC-05\` Primary Owner | \`docs/projects/governance/\` | \`governance\` |
| \`CAPITAL-AI-GOV\` | \`PVC-05\` Primary Owner | \`docs/projects/governance-2/\` | \`governance-2\` |
`;

    expect(() => parseCanonicalProjects(mapping)).toThrow(/DUPLICATE_CANONICAL_PROJECT_PROJECT/);
  });

  it.each([
    'PARTIAL',
    'READY',
    'READY_FOR_IMPLEMENTATION',
    'NOT RUN',
    'CONTINUOUS',
    'IMPLEMENTED_ON_BRANCH / VALIDATION_PENDING',
    'EVIDENCE_READY',
    'WAITING',
    'BLOCKED',
    'CONDITIONAL',
  ])('never treats %s as terminal completion', (state) => {
    expect(classifyRoadmapState(state)).toBe('NON_TERMINAL');
  });

  it.each(['DONE_MAIN / TERMINAL', 'DONE', 'CLOSED', 'VERIFIED', 'RETIRED', 'SUPERSEDED'])(
    'recognizes explicit terminal state %s',
    (state) => {
      expect(classifyRoadmapState(state)).toBe('TERMINAL');
    },
  );

  it('uses non-terminal precedence when terminal wording is mixed with an unfinished state', () => {
    expect(classifyRoadmapState('PARTIAL / VERIFIED evidence only')).toBe('NON_TERMINAL');
  });

  it('computes a percentage only when every explicit work item has a resolvable state', () => {
    const roadmap = `
# Roadmap

### GOV-AUTO-01 — first
**State:** DONE_MAIN / TERMINAL

### GOV-AUTO-02 — second
**State:** READY_FOR_IMPLEMENTATION

| ID | State |
|---|---|
| \`GOV-AUTO-03\` | VERIFIED |
| \`GOV-AUTO-04\` | NOT RUN |
`;

    const result = calculateRoadmapProgress(roadmap);
    expect(result.status).toBe('PROVEN');
    expect(result.numerator).toBe(2);
    expect(result.denominator).toBe(4);
    expect(result.progressPercent).toBe(50);
  });

  it('returns NOT_PROVEN instead of inventing progress for an unknown work-item state', () => {
    const roadmap = `
### GOV-AUTO-01 — first
**State:** DONE_MAIN

### GOV-AUTO-02 — second
**State:** SOME_NEW_STATE
`;

    const result = calculateRoadmapProgress(roadmap);
    expect(result).toMatchObject({
      status: 'NOT_PROVEN',
      progressPercent: null,
      numerator: null,
      denominator: 2,
      reason: 'UNRESOLVED_WORK_ITEM_STATE',
      unresolvedItems: ['GOV-AUTO-02'],
    });
  });

  it('deduplicates the same work item across heading and table evidence', () => {
    const roadmap = `
### GOV-AUTO-01 — first
**State:** DONE_MAIN

| ID | Status |
|---|---|
| \`GOV-AUTO-01\` | VERIFIED |
`;

    const items = extractRoadmapItems(roadmap);
    expect(items).toHaveLength(1);
    expect(items[0]?.classification).toBe('TERMINAL');
    expect(items[0]?.evidence).toHaveLength(2);
  });

  it('fails progress proof when duplicate evidence conflicts', () => {
    const roadmap = `
### GOV-AUTO-01 — first
**State:** DONE_MAIN

| ID | Status |
|---|---|
| \`GOV-AUTO-01\` | PARTIAL |
`;

    const result = calculateRoadmapProgress(roadmap);
    expect(result.status).toBe('NOT_PROVEN');
    expect(result.reason).toBe('UNRESOLVED_WORK_ITEM_STATE');
    expect(result.unresolvedItems).toEqual(['GOV-AUTO-01']);
  });

  it('classifies every canonical current-repository project without inventing a percentage', async () => {
    const report = await buildCanonicalRoadmapProgress();

    expect(report.projectCount).toBe(12);
    expect(report.projects).toHaveLength(12);
    expect(new Set(report.projects.map((project) => project.project)).size).toBe(12);
    expect(report.projects.every((project) => ['PROVEN', 'NOT_PROVEN'].includes(project.status))).toBe(true);
    expect(
      report.projects.every((project) =>
        project.status === 'PROVEN'
          ? typeof project.progressPercent === 'number' && Number.isInteger(project.numerator) && Number.isInteger(project.denominator)
          : project.progressPercent === null,
      ),
    ).toBe(true);
  });
});
