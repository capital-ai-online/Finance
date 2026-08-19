export const README_VERSION_MATRIX_START = '<!-- README_VERSION_MATRIX:START -->';
export const README_VERSION_MATRIX_END = '<!-- README_VERSION_MATRIX:END -->';

export interface PackageVersionAuthority {
  version: string;
  engines?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

function requiredValue(value: string | undefined, authority: string): string {
  if (!value) throw new Error(`[readme-version] Dependency declaration missing: ${authority}`);
  return value;
}

function dependencyVersion(pkg: PackageVersionAuthority, name: string): string {
  return requiredValue(pkg.dependencies?.[name], `package.json#dependencies.${name}`);
}

function devDependencyVersion(pkg: PackageVersionAuthority, name: string): string {
  return requiredValue(pkg.devDependencies?.[name], `package.json#devDependencies.${name}`);
}

function replaceRequired(content: string, pattern: RegExp, replacement: string, label: string): string {
  if (!pattern.test(content)) throw new Error(`[readme-version] Required declaration missing: ${label}`);
  pattern.lastIndex = 0;
  return content.replace(pattern, replacement);
}

export function renderReadmeVersionMatrix(pkg: PackageVersionAuthority, nodeRuntime: string): string {
  const rows: Array<[string, string, string]> = [
    ['CAPITAL-AI Plattform', pkg.version, '`package.json#version`'],
    ['Node.js Runtime', nodeRuntime, '`.nvmrc`'],
    ['Node.js Engine', pkg.engines?.node ?? 'UNDECLARED', '`package.json#engines.node`'],
    ['TypeScript', devDependencyVersion(pkg, 'typescript'), '`package.json#devDependencies.typescript`'],
    ['React', dependencyVersion(pkg, 'react'), '`package.json#dependencies.react`'],
    ['Vite', devDependencyVersion(pkg, 'vite'), '`package.json#devDependencies.vite`'],
    ['Tailwind CSS', devDependencyVersion(pkg, 'tailwindcss'), '`package.json#devDependencies.tailwindcss`'],
    ['OpenAI SDK', dependencyVersion(pkg, 'openai'), '`package.json#dependencies.openai`'],
    ['Anthropic SDK', dependencyVersion(pkg, '@anthropic-ai/sdk'), '`package.json#dependencies.@anthropic-ai/sdk`'],
    ['Supabase JS', dependencyVersion(pkg, '@supabase/supabase-js'), '`package.json#dependencies.@supabase/supabase-js`'],
    ['Stripe Server SDK', dependencyVersion(pkg, 'stripe'), '`package.json#dependencies.stripe`'],
    ['Stripe Browser SDK', dependencyVersion(pkg, '@stripe/stripe-js'), '`package.json#dependencies.@stripe/stripe-js`'],
    ['Express', dependencyVersion(pkg, 'express'), '`package.json#dependencies.express`'],
    ['Vitest', devDependencyVersion(pkg, 'vitest'), '`package.json#devDependencies.vitest`'],
  ];

  return [
    README_VERSION_MATRIX_START,
    '### Automatisch synchronisierte Runtime-Versionen',
    '',
    '> **Projektionsvertrag:** `package.json#version` ist die einzige Plattformversions-Authority. Dieser README-Block ist eine deterministische, read-only Projektion aus kanonischen Repository-Deklarationen. `npm run readme:sync` aktualisiert ihn; `npm run readme:check` blockiert Drift.',
    '',
    '| Komponente | Repository-Version | Authority |',
    '|---|---:|---|',
    ...rows.map(([component, version, authority]) => `| ${component} | \`${version}\` | ${authority} |`),
    README_VERSION_MATRIX_END,
  ].join('\n');
}

export function synchronizeReadmeCanonicalDeclarations(readme: string, pkg: PackageVersionAuthority): string {
  const engine = pkg.engines?.node;
  if (!engine) throw new Error('[readme-version] package.json#engines.node is required.');

  let next = readme;
  next = replaceRequired(next, /Version-\d+\.\d+\.\d+_Beta/g, `Version-${pkg.version}_Beta`, 'version badge');
  next = replaceRequired(next, /Version \d+\.\d+\.\d+ befindet sich/g, `Version ${pkg.version} befindet sich`, 'intro platform version');
  next = replaceRequired(next, /Plattformversion: `\d+\.\d+\.\d+ Beta`/g, `Plattformversion: \`${pkg.version} Beta\``, 'governance platform version');
  next = replaceRequired(next, /- Node\.js `[^`]+`/, `- Node.js \`${engine}\``, 'Node.js prerequisite');
  return next;
}

export function synchronizeReadmeVersionMatrix(readme: string, matrix: string): string {
  const startIndex = readme.indexOf(README_VERSION_MATRIX_START);
  const endIndex = readme.indexOf(README_VERSION_MATRIX_END);

  if (startIndex >= 0 || endIndex >= 0) {
    if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) {
      throw new Error('[readme-version] README version-matrix markers are malformed.');
    }
    const afterEnd = endIndex + README_VERSION_MATRIX_END.length;
    return `${readme.slice(0, startIndex)}${matrix}${readme.slice(afterEnd)}`;
  }

  const anchor = '\n## Voraussetzungen\n';
  const anchorIndex = readme.indexOf(anchor);
  if (anchorIndex < 0) throw new Error('[readme-version] README insertion anchor "## Voraussetzungen" not found.');
  return `${readme.slice(0, anchorIndex)}\n\n${matrix}\n${readme.slice(anchorIndex)}`;
}

export function buildExpectedReadme(readme: string, pkg: PackageVersionAuthority, nodeRuntime: string): string {
  const canonical = synchronizeReadmeCanonicalDeclarations(readme, pkg);
  return synchronizeReadmeVersionMatrix(canonical, renderReadmeVersionMatrix(pkg, nodeRuntime));
}
