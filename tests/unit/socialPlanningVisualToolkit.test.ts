import { describe, expect, it } from 'vitest';
import { MEDIA_PROJECT_BRAND_TOKEN_SOURCE } from '../../src/platform/SocialMediaEngine/Contracts/MediaProject';
import { validateMediaProjectV2 } from '../../src/platform/SocialMediaEngine/Contracts/MediaProjectValidation';
import {
  layoutPlanningVisualWithD3,
  resolvePlanningVisualCanvas,
} from '../../src/platform/SocialMediaEngine/Visualization/D3PlanningVisualAdapter';
import { createPlanningVisualMediaProject } from '../../src/platform/SocialMediaEngine/Visualization/PlanningVisualMediaProjectAdapter';
import {
  PLANNING_VISUAL_SCHEMA_VERSION,
  validatePlanningVisualSpec,
  type PlanningVisualSpec,
} from '../../src/platform/SocialMediaEngine/Visualization/PlanningVisual';
import {
  getAvailablePlanningVisualTool,
  PLANNING_VISUAL_TOOL_CATALOG,
} from '../../src/platform/SocialMediaEngine/Visualization/PlanningVisualToolCatalog';

function roadmapSpec(aspectRatio: PlanningVisualSpec['render']['aspectRatio'] = '4:5'): PlanningVisualSpec {
  return {
    schemaVersion: PLANNING_VISUAL_SCHEMA_VERSION,
    kind: 'roadmap',
    title: 'Control Center Roadmap',
    description: 'CURRENT_MAIN work-state projection without invented calendar dates.',
    lanes: [
      { id: 'main', label: 'CURRENT_MAIN', order: 1 },
      { id: 'next', label: 'Pending', order: 2 },
    ],
    nodes: [
      { id: 'FE-ROADMAP-01', label: 'Mobile Roadmap', laneId: 'main', status: 'active', order: 1 },
      { id: 'OPS-BRANCH-01', label: 'Branch Evidence', laneId: 'main', status: 'live', order: 2 },
      { id: 'SOCIAL-P4', label: 'Planning Visual Toolkit', laneId: 'next', status: 'pending', order: 1 },
    ],
    edges: [
      { id: 'edge-1', source: 'FE-ROADMAP-01', target: 'OPS-BRANCH-01', kind: 'dependency' },
      { id: 'edge-2', source: 'OPS-BRANCH-01', target: 'SOCIAL-P4', kind: 'sequence' },
    ],
    evidence: {
      source: 'docs/architecture/ROADMAP.md',
      currentMainSha: '14677ea3acc5316e025d784c7dc35d3a6b2dfe1a',
      observedAt: '2026-09-28T01:14:13Z',
    },
    render: {
      aspectRatio,
      rendererProfile: 'd3-deterministic-layout',
      brandTokenSource: MEDIA_PROJECT_BRAND_TOKEN_SOURCE,
      networkPolicy: 'offline',
      publishReady: false,
    },
  };
}

describe('Social Planning Visualization Toolkit', () => {
  it('validates a bounded roadmap spec and rejects unsafe evidence sources', () => {
    const valid = roadmapSpec();
    expect(validatePlanningVisualSpec(valid)).toEqual({ ok: true, errors: [] });

    const unsafe = {
      ...valid,
      evidence: { ...valid.evidence, source: 'https://example.invalid/roadmap.json' },
    };
    expect(validatePlanningVisualSpec(unsafe).errors.some((error) => error.code === 'evidence_source_unsafe')).toBe(true);
  });

  it('produces deterministic D3 geometry for social aspect ratios', () => {
    const first = layoutPlanningVisualWithD3(roadmapSpec('4:5'));
    const second = layoutPlanningVisualWithD3(roadmapSpec('4:5'));
    expect(second).toEqual(first);
    expect(first.renderer).toBe('d3');
    expect(first.deterministic).toBe(true);
    expect(first.canvas).toEqual({ width: 1080, height: 1350 });
    expect(resolvePlanningVisualCanvas('1:1')).toEqual({ width: 1080, height: 1080 });
    expect(resolvePlanningVisualCanvas('16:9')).toEqual({ width: 1920, height: 1080 });
    expect(first.nodes).toHaveLength(3);
    expect(first.edges).toHaveLength(2);
  });

  it('adapts the visual into the canonical offline MediaProjectV2 boundary', () => {
    const project = createPlanningVisualMediaProject(roadmapSpec());
    expect(validateMediaProjectV2(project)).toEqual({ ok: true, errors: [] });
    expect(project.canvas).toMatchObject({ width: 1080, height: 1350, aspectRatio: 'custom' });
    expect(project.renderRecipe).toMatchObject({
      rendererProfile: 'planning-visual-d3-v1',
      networkPolicy: 'offline',
      publishReady: false,
      brandTokenSource: MEDIA_PROJECT_BRAND_TOKEN_SOURCE,
    });
    expect(project.metadata?.planningVisualRendererProvider).toBe('d3');
    expect(project.tracks[0]?.layers[0]?.metadata?.planningVisualRendererProvider).toBe('d3');
  });

  it('uses the already-installed D3 provider and fails closed for non-installed candidates', () => {
    expect(getAvailablePlanningVisualTool('d3')).toMatchObject({
      id: 'd3',
      availability: 'available-in-repository',
      dependencyMutationRequired: false,
    });
    expect(() => getAvailablePlanningVisualTool('mermaid')).toThrow('PLANNING_VISUAL_TOOL_NOT_INSTALLED:mermaid');
    expect(() => getAvailablePlanningVisualTool('react-flow')).toThrow('PLANNING_VISUAL_TOOL_NOT_INSTALLED:react-flow');

    expect(
      PLANNING_VISUAL_TOOL_CATALOG.filter((tool) => tool.dependencyMutationRequired).map((tool) => tool.id),
    ).toEqual(['mermaid', 'react-flow', 'frappe-gantt', 'vis-timeline']);
    expect(PLANNING_VISUAL_TOOL_CATALOG.every((tool) => tool.upstream.startsWith('https://github.com/'))).toBe(true);
  });
});
