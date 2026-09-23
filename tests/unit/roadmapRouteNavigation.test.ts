import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const routes = fs.readFileSync(
  path.join(process.cwd(), 'src/app/routing/AppRoutes.tsx'),
  'utf8',
);

describe('Roadmap dashboard client routing', () => {
  it('loads the branded Roadmap dashboard lazily at /roadmap', () => {
    expect(routes).toContain("import('../../features/public/ui/RoadmapDashboard')");
    expect(routes).toContain("if (currentPath === '/roadmap')");
    expect(routes).toContain('<RoadmapDashboard />');
    expect(routes).toContain('<RouteLoadingBoundary>');
  });

  it('keeps the Roadmap route public and independent from authenticated dashboard resolution', () => {
    const roadmapStart = routes.indexOf("if (currentPath === '/roadmap')");
    const learningStart = routes.indexOf("if (currentPath === '/learning-platform')");
    const block = routes.slice(roadmapStart, learningStart);

    expect(roadmapStart).toBeGreaterThanOrEqual(0);
    expect(learningStart).toBeGreaterThan(roadmapStart);
    expect(block).not.toContain('userSession');
    expect(block).not.toContain('AuthRouteResolution');
  });
});
