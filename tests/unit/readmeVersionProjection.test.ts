import { describe, expect, it } from 'vitest';
import {
  buildExpectedReadme,
  README_VERSION_MATRIX_END,
  README_VERSION_MATRIX_START,
  type PackageVersionAuthority,
} from '../../src/platform/Release/Services/readmeVersionProjection';

const pkg: PackageVersionAuthority = {
  version: '0.7.0',
  engines: { node: '>=24.18.0 <25' },
  dependencies: {
    react: '^19.0.1',
    openai: '^7.3.0',
    '@anthropic-ai/sdk': '^0.115.0',
    '@supabase/supabase-js': '^2.108.2',
    stripe: '^22.3.0',
    '@stripe/stripe-js': '^9.8.0',
    express: '^4.21.2',
  },
  devDependencies: {
    typescript: '~5.8.2',
    vite: '^6.2.3',
    tailwindcss: '^4.1.14',
    vitest: '^4.1.10',
  },
};

const readme = `# CAPITAL-AI

[![Version](Version-0.6.0_Beta)]

> Version 0.6.0 befindet sich in der Beta-Phase.

## Voraussetzungen

- Node.js \`>=24.13.3 <25\`

## Governance

- Plattformversion: \`0.6.0 Beta\`
`;

describe('README version projection', () => {
  it('projects canonical versions and dependencies deterministically', () => {
    const expected = buildExpectedReadme(readme, pkg, '24.18.0');

    expect(expected).toContain('Version-0.7.0_Beta');
    expect(expected).toContain('Version 0.7.0 befindet sich');
    expect(expected).toContain('Plattformversion: `0.7.0 Beta`');
    expect(expected).toContain('- Node.js `>=24.18.0 <25`');
    expect(expected).toContain('`package.json#version` ist die einzige Plattformversions-Authority');
    expect(expected).toContain('| CAPITAL-AI Plattform | `0.7.0` | `package.json#version` |');
    expect(expected).toContain('| Node.js Runtime | `24.18.0` | `.nvmrc` |');
    expect(expected).toContain('| OpenAI SDK | `^7.3.0` | `package.json#dependencies.openai` |');
    expect(expected).toContain(README_VERSION_MATRIX_START);
    expect(expected).toContain(README_VERSION_MATRIX_END);
    expect(buildExpectedReadme(expected, pkg, '24.18.0')).toBe(expected);
  });

  it('fails closed when a required canonical declaration is missing', () => {
    expect(() => buildExpectedReadme('# CAPITAL-AI\n\n## Voraussetzungen\n', pkg, '24.18.0'))
      .toThrow('Required declaration missing');
  });

  it('fails closed when managed matrix markers are malformed', () => {
    const malformed = `${readme}\n${README_VERSION_MATRIX_START}\n`;
    expect(() => buildExpectedReadme(malformed, pkg, '24.18.0')).toThrow('markers are malformed');
  });
});
