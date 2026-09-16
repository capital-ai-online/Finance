import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const landingPage = read('src/features/public/ui/LandingPage.tsx');
const publicWorkbench = read('src/app/public/PublicAnalysisWorkbench.tsx');

describe('public Enterprise Scorer first-paint boundary', () => {
  it('puts the public Enterprise Scorer before the marketing capability surface', () => {
    const workbenchIndex = landingPage.indexOf('id="analysis-workbench"');
    const capabilityIndex = landingPage.indexOf('CAPABILITY_CARDS.map');

    expect(workbenchIndex).toBeGreaterThanOrEqual(0);
    expect(capabilityIndex).toBeGreaterThan(workbenchIndex);
    expect(landingPage).toContain('Enterprise Scorer & Bewertungstools');
    expect(landingPage).toContain('BTC · Public Fixed');
    expect(landingPage).toContain('{preview}');
  });

  it('renders the public cockpit immediately while deferring only the heavy active runtime', () => {
    expect(publicWorkbench).toContain("const [activeTool, setActiveTool] = useState<PublicToolId>('enterprise-scorer')");
    expect(publicWorkbench).toContain("const PUBLIC_FIXED_SYMBOL = 'BTC' as const");
    expect(publicWorkbench).toContain('const [runtimeReady, setRuntimeReady] = useState(false)');
    expect(publicWorkbench).toContain('window.requestAnimationFrame');
    expect(publicWorkbench).toContain('setTimeout(() => setRuntimeReady(true), 0)');
    expect(publicWorkbench).toContain('function DeferredToolRuntimeState');
    expect(publicWorkbench).toContain('BTC · Public Enterprise Scorer');
    expect(publicWorkbench).toContain('Cockpit, Sideboard und Bewertungstools sind sofort sichtbar');
    expect(publicWorkbench).toContain('onClick={() => activateTool(tool.id)}');
    expect(publicWorkbench).toContain('setRuntimeReady(true)');
    expect(publicWorkbench).toContain('selectedSymbol={PUBLIC_FIXED_SYMBOL}');
    expect(publicWorkbench).toContain('lg:grid-cols-[88px_minmax(0,1fr)]');
    expect(publicWorkbench).toContain('lg:grid-cols-[300px_minmax(0,1fr)]');
  });

  it('does not weaken protected tool boundaries or create parallel score/data authority', () => {
    expect(publicWorkbench).toContain("availability: 'login-required'");
    expect(publicWorkbench).toContain("availability: 'disabled'");
    expect(publicWorkbench).toContain('<ProtectedToolNotice tool={activeDefinition} />');
    expect(publicWorkbench).not.toContain('PUBLIC_VISITOR_SESSION');
    expect(publicWorkbench).not.toContain("type: 'guest'");
    expect(publicWorkbench).not.toContain('demoScore');
    expect(publicWorkbench).not.toContain('syntheticScore');
  });
});
