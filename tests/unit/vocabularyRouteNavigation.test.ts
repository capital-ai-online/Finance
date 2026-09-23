import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(
  path.join(process.cwd(), 'src/app/routing/AppRoutes.tsx'),
  'utf8',
);

describe('public vocabulary route navigation', () => {
  it('keeps the rendered route synchronized with browser history', () => {
    expect(source).toContain('const [currentPath, setCurrentPath] = useState');
    expect(source).toContain("window.addEventListener('popstate', syncPathFromHistory)");
    expect(source).toContain('setCurrentPath(normalizeRoutePath(window.location.pathname))');
    expect(source).toContain("window.removeEventListener('popstate', syncPathFromHistory)");
  });

  it('returns from /vocabulary to the landing page without a hard reload', () => {
    expect(source).toContain("navigatePublicRoute('/', true)");
    expect(source).toContain("window.history.replaceState({}, '', normalizedPath)");
    expect(source).not.toContain("window.location.assign('/')");
  });
});
