import { describe, expect, it } from 'vitest';
import {
  buildCanonicalRoadmapNextTarget,
  isExplicitExecutionReady,
  selectNextRoadmapTarget,
} from '../../scripts/governance/roadmapNextTarget.mjs';

function projectRoadmap({
  project,
  folder,
  branchSlug,
  roadmapText,
  pvcRelationship = 'cross-cutting; no productive PVC',
}: {
  project: string;
  folder: string;
  branchSlug: string;
  roadmapText: string;
  pvcRelationship?: string;
}) {
  return {
    project,
    pvcRelationship,
    folder,
    branchSlug,
    roadmapPath: `${folder}ROADMAP.md`,
    roadmapText,
    roadmapMissing: false,
  };
}

describe('roadmapNextTarget', () => {
  it.each([
    'READY',
    'READY_FOR_IMPLEMENTATION',
    'READY_FOR_EXECUTION',
    'REPOSITORY_EXECUTABLE',
    'EXECUTABLE',
  ])('accepts the explicit execution-ready state %s', (state) => {
    expect(isExplicitExecutionReady(state)).toBe(true);
  });

  it.each([
    'PARTIAL / READY',
    'BLOCKED / READY_FOR_IMPLEMENTATION',
    'WAITING',
    'CONDITIONAL',
    'DEPENDENCY_HELD',
    'EVIDENCE_READY',
    'IMPLEMENTED_ON_BRANCH / VALIDATION_PENDING',
    'DONE_MAIN / TERMINAL',
    'FE_OWNER_RETURN_READY',
  ])('does not infer execution readiness from %s', (state) => {
    expect(isExplicitExecutionReady(state)).toBe(false);
  });

  it('selects exactly one ready work item and preserves canonical project ownership', () => {
    const result = selectNextRoadmapTarget([
      projectRoadmap({
        project: 'CAPITAL-AI-GOV',
        pvcRelationship: 'PVC-05 Primary Owner + cross-cutting Governance',
        folder: 'docs/projects/governance/',
        branchSlug: 'governance',
        roadmapText: `
### GOV-AUTO-01 — first executable item
**State:** READY_FOR_IMPLEMENTATION
**Dependencies:** none

### GOV-AUTO-02 — second executable item
**State:** READY_FOR_IMPLEMENTATION
`,
      }),
      projectRoadmap({
        project: 'CAPITAL-AI-SEO',
        folder: 'docs/projects/seo/',
        branchSlug: 'seo',
        roadmapText: `
### SEO-AUTO-01 — also executable
**State:** REPOSITORY_EXECUTABLE
`,
      }),
    ]);

    expect(result.status).toBe('TARGET_SELECTED');
    expect(result.eligibleCount).toBe(3);
    expect(result.target).toMatchObject({
      project: 'CAPITAL-AI-GOV',
      pvcRelationship: 'PVC-05 Primary Owner + cross-cutting Governance',
      folder: 'docs/projects/governance/',
      branchSlug: 'governance',
      roadmapPath: 'docs/projects/governance/ROADMAP.md',
      workItemId: 'GOV-AUTO-01',
      state: 'READY_FOR_IMPLEMENTATION',
      dependencies: [],
    });
  });

  it('accepts the canonical WP table header as a read-only work-package ID alias', () => {
    const result = selectNextRoadmapTarget([
      projectRoadmap({
        project: 'CAPITAL-AI-SEO',
        folder: 'docs/projects/seo/',
        branchSlug: 'seo',
        roadmapText: `
| WP | State |
|---|---|
| WP-SEO-SPAM | REPOSITORY_EXECUTABLE — apply existing negative gates |
`,
      }),
    ]);

    expect(result.status).toBe('TARGET_SELECTED');
    expect(result.target).toMatchObject({
      project: 'CAPITAL-AI-SEO',
      workItemId: 'WP-SEO-SPAM',
      state: 'REPOSITORY_EXECUTABLE — apply existing negative gates',
    });
  });

  it('uses Roadmap source order before work-item ID inside the same project', () => {
    const result = selectNextRoadmapTarget([
      projectRoadmap({
        project: 'CAPITAL-AI-GOV',
        folder: 'docs/projects/governance/',
        branchSlug: 'governance',
        roadmapText: `
### GOV-Z-99 — appears first
**State:** READY

### GOV-A-01 — lexically smaller but later
**State:** READY
`,
      }),
    ]);

    expect(result.status).toBe('TARGET_SELECTED');
    expect(result.target?.workItemId).toBe('GOV-Z-99');
  });

  it('selects a dependent item only when every referenced dependency is terminal', () => {
    const blocked = selectNextRoadmapTarget([
      projectRoadmap({
        project: 'CAPITAL-AI-GOV',
        folder: 'docs/projects/governance/',
        branchSlug: 'governance',
        roadmapText: `
### GOV-AUTO-01 — predecessor
**State:** READY_FOR_IMPLEMENTATION

### GOV-AUTO-02 — successor
**State:** READY_FOR_IMPLEMENTATION
**Dependencies:** GOV-AUTO-01
`,
      }),
    ]);

    expect(blocked.status).toBe('TARGET_SELECTED');
    expect(blocked.target?.workItemId).toBe('GOV-AUTO-01');
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          workItemId: 'GOV-AUTO-02',
          reason: 'DEPENDENCY_NOT_TERMINAL',
        }),
      ]),
    );

    const ready = selectNextRoadmapTarget([
      projectRoadmap({
        project: 'CAPITAL-AI-GOV',
        folder: 'docs/projects/governance/',
        branchSlug: 'governance',
        roadmapText: `
### GOV-AUTO-01 — predecessor
**State:** DONE_MAIN / TERMINAL

### GOV-AUTO-02 — successor
**State:** READY_FOR_IMPLEMENTATION
**Dependencies:** GOV-AUTO-01
`,
      }),
    ]);

    expect(ready.status).toBe('TARGET_SELECTED');
    expect(ready.target).toMatchObject({
      workItemId: 'GOV-AUTO-02',
      dependencies: ['GOV-AUTO-01'],
    });
  });

  it('fails closed on an unknown dependency reference', () => {
    const result = selectNextRoadmapTarget([
      projectRoadmap({
        project: 'CAPITAL-AI-GOV',
        folder: 'docs/projects/governance/',
        branchSlug: 'governance',
        roadmapText: `
### GOV-AUTO-02 — successor
**State:** READY_FOR_IMPLEMENTATION
**Dependencies:** GOV-AUTO-01
`,
      }),
    ]);

    expect(result).toMatchObject({
      status: 'NO_EXECUTABLE_TARGET',
      target: null,
      reason: 'NO_DEPENDENCY_READY_WORK_ITEM',
      eligibleCount: 0,
    });
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          workItemId: 'GOV-AUTO-02',
          reason: 'UNKNOWN_DEPENDENCY_REFERENCE',
          dependencyBlockers: ['GOV-AUTO-01'],
        }),
      ]),
    );
  });

  it('fails closed on an unstructured dependency declaration instead of guessing readiness', () => {
    const result = selectNextRoadmapTarget([
      projectRoadmap({
        project: 'CAPITAL-AI-GOV',
        folder: 'docs/projects/governance/',
        branchSlug: 'governance',
        roadmapText: `
### GOV-AUTO-02 — successor
**State:** READY_FOR_IMPLEMENTATION
**Dependencies:** current main, owner return and provider evidence
`,
      }),
    ]);

    expect(result.status).toBe('NO_EXECUTABLE_TARGET');
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          workItemId: 'GOV-AUTO-02',
          reason: 'UNSTRUCTURED_DEPENDENCY_DECLARATION',
        }),
      ]),
    );
  });

  it('fails closed when the same work-item ID occurs twice in one State table', () => {
    const result = selectNextRoadmapTarget([
      projectRoadmap({
        project: 'CAPITAL-AI-DATA',
        folder: 'docs/projects/data/',
        branchSlug: 'data',
        roadmapText: `
| ID | State |
|---|---|
| DATA-09 UAI / Data Ingestion | READY / ACTIVE BACKLOG |
| DATA-09 GOV-07 Newsfeed entitlement | PARTIAL — product access closed |
| DATA-15 Data Contract Testing | READY |
`,
      }),
    ]);

    expect(result).toEqual(
      expect.objectContaining({
        status: 'NO_EXECUTABLE_TARGET',
        target: null,
        reason: 'DUPLICATE_WORK_ITEM_ID',
        eligibleCount: 0,
      }),
    );
    expect(result.blockers).toEqual([
      expect.objectContaining({
        project: 'CAPITAL-AI-DATA',
        roadmapPath: 'docs/projects/data/ROADMAP.md',
        id: 'DATA-09',
        reason: 'DUPLICATE_WORK_ITEM_ID',
        evidence: [
          { source: 'table', state: 'READY / ACTIVE BACKLOG' },
          { source: 'table', state: 'PARTIAL — product access closed' },
        ],
      }),
    ]);
  });

  it('allows one heading plus one table projection of the same work-item ID', () => {
    const result = selectNextRoadmapTarget([
      projectRoadmap({
        project: 'CAPITAL-AI-GOV',
        folder: 'docs/projects/governance/',
        branchSlug: 'governance',
        roadmapText: `
### GOV-AUTO-01 — canonical section
**State:** READY

| ID | State |
|---|---|
| GOV-AUTO-01 | READY |
`,
      }),
    ]);

    expect(result.status).toBe('TARGET_SELECTED');
    expect(result.target?.workItemId).toBe('GOV-AUTO-01');
  });

  it('fails closed when the same work-item ID exists in more than one canonical project', () => {
    const result = selectNextRoadmapTarget([
      projectRoadmap({
        project: 'CAPITAL-AI-GOV',
        folder: 'docs/projects/governance/',
        branchSlug: 'governance',
        roadmapText: `
### SHARED-AUTO-01 — gov copy
**State:** READY
`,
      }),
      projectRoadmap({
        project: 'CAPITAL-AI-SEO',
        folder: 'docs/projects/seo/',
        branchSlug: 'seo',
        roadmapText: `
### SHARED-AUTO-01 — seo copy
**State:** READY
`,
      }),
    ]);

    expect(result).toEqual(
      expect.objectContaining({
        status: 'NO_EXECUTABLE_TARGET',
        target: null,
        reason: 'DUPLICATE_WORK_ITEM_ID',
        eligibleCount: 0,
      }),
    );
    expect(result.blockers).toEqual([{ id: 'SHARED-AUTO-01', reason: 'DUPLICATE_WORK_ITEM_ID' }]);
  });

  it('fails closed on the current twelve-project snapshot because DATA-09 is non-unique', async () => {
    const result = await buildCanonicalRoadmapNextTarget();

    expect(result.projectCount).toBe(12);
    expect(result).toEqual(
      expect.objectContaining({
        status: 'NO_EXECUTABLE_TARGET',
        target: null,
        reason: 'DUPLICATE_WORK_ITEM_ID',
        eligibleCount: 0,
      }),
    );
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          project: 'CAPITAL-AI-DATA',
          roadmapPath: 'docs/projects/data/ROADMAP.md',
          id: 'DATA-09',
          reason: 'DUPLICATE_WORK_ITEM_ID',
        }),
      ]),
    );
    expect(result.authorityBoundary).toEqual({
      sourceOfTruth: 'canonical docs/projects/<project>/ROADMAP.md files',
      ownership: 'preserved from docs/projects/README.md / PROJECT_VALUE_CHAIN.md',
      persistence: 'none',
      mutation: 'none',
      shadowQueue: false,
    });
  });
});
