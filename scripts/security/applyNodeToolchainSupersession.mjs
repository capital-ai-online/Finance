import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const OLD_NODE_VERSION = '24.18.0';
export const NEW_NODE_VERSION = '24.20.0';
export const OLD_NODE_RANGE = '>=24.18.0 <25';
export const NEW_NODE_RANGE = '>=24.20.0 <25';

export const WORKFLOW_TARGETS = Object.freeze([
  ['.github/workflows/ci.yml', 2],
  ['.github/workflows/pr-production-baseline-refresh.yml', 2],
  ['.github/workflows/pr-governance.yml', 1],
  ['.github/workflows/google-marketing-protected-change.yml', 1],
  ['.github/workflows/ionos-dns-admin.yml', 1],
  ['.github/workflows/systemadmin-work-package-runner.yml', 1],
  ['.github/workflows/systemadmin-roadmap-executor.yml', 1],
]);

export const BASELINE_WORKFLOW_TARGETS = Object.freeze([
  ...WORKFLOW_TARGETS,
  ['.github/workflows/node-toolchain-write-boundary-supersession.yml', 1],
]);

export const EXISTING_TARGET_PATHS = Object.freeze([
  '.nvmrc',
  'package.json',
  'package-lock.json',
  ...WORKFLOW_TARGETS.map(([file]) => file),
  'tests/unit/productionCiRunnerConsolidation.test.ts',
]);

export const GENERATED_TARGET_PATHS = Object.freeze([
  'tests/unit/nodeToolchainBaseline.test.ts',
]);

export const TARGET_PATHS = Object.freeze([
  ...EXISTING_TARGET_PATHS,
  ...GENERATED_TARGET_PATHS,
]);

const OLD_WORKFLOW_PIN = /node-version:\s*(?:'24\.18\.0'|"24\.18\.0"|24\.18\.0)/g;
const NEW_WORKFLOW_PIN = /node-version:\s*(?:'24\.20\.0'|"24\.20\.0"|24\.20\.0)/g;

function fail(message) {
  throw new Error(`[NODE-TOOLCHAIN-SUPERSESSION] ${message}`);
}

function read(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function write(root, relativePath, content) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, 'utf8');
}

function countMatches(source, pattern) {
  return (source.match(pattern) ?? []).length;
}

export function inspectWorkflow(source, relativePath, expectedOldPins) {
  const oldPins = countMatches(source, OLD_WORKFLOW_PIN);
  const newPins = countMatches(source, NEW_WORKFLOW_PIN);
  const pending = oldPins === expectedOldPins && newPins === 0;
  const complete = oldPins === 0 && newPins === expectedOldPins;

  if (!pending && !complete) {
    fail(`${relativePath}: unerwarteter/mischender Node-Pin-Stand (old=${oldPins}, new=${newPins}, erwartet=${expectedOldPins}).`);
  }

  return { pending, complete, oldPins, newPins };
}

export function transformWorkflow(source, relativePath, expectedOldPins) {
  const state = inspectWorkflow(source, relativePath, expectedOldPins);
  if (state.complete) return source;
  return source.replace(OLD_WORKFLOW_PIN, `node-version: '${NEW_NODE_VERSION}'`);
}

export function inspectJsonRootEngine(source, relativePath) {
  const parsed = JSON.parse(source);
  const engine = relativePath === 'package-lock.json'
    ? parsed?.packages?.['']?.engines?.node
    : parsed?.engines?.node;

  if (engine !== OLD_NODE_RANGE && engine !== NEW_NODE_RANGE) {
    fail(`${relativePath}: unerwartete Root Node-Engine ${JSON.stringify(engine)}.`);
  }

  return { pending: engine === OLD_NODE_RANGE, complete: engine === NEW_NODE_RANGE };
}

export function transformJsonRootEngine(source, relativePath) {
  const parsed = JSON.parse(source);
  const state = inspectJsonRootEngine(source, relativePath);
  if (state.complete) return source;

  if (relativePath === 'package-lock.json') parsed.packages[''].engines.node = NEW_NODE_RANGE;
  else parsed.engines.node = NEW_NODE_RANGE;

  return `${JSON.stringify(parsed, null, 2)}\n`;
}

export function inspectNvmrc(source) {
  const value = source.trim();
  if (value !== OLD_NODE_VERSION && value !== NEW_NODE_VERSION) {
    fail(`.nvmrc: unerwarteter Wert ${JSON.stringify(value)}.`);
  }
  return { pending: value === OLD_NODE_VERSION, complete: value === NEW_NODE_VERSION };
}

export function transformNvmrc(source) {
  const state = inspectNvmrc(source);
  return state.complete ? source : `${NEW_NODE_VERSION}\n`;
}

export function inspectProductionCiTest(source) {
  const oldNeedle = `expect(deploy).toContain("node-version: '${OLD_NODE_VERSION}'");`;
  const newNeedle = `expect(deploy).toContain("node-version: '${NEW_NODE_VERSION}'");`;
  const oldCount = source.includes(oldNeedle) ? 1 : 0;
  const newCount = source.includes(newNeedle) ? 1 : 0;
  if (oldCount + newCount !== 1) fail('tests/unit/productionCiRunnerConsolidation.test.ts: unerwartete Node-Pin-Assertion.');
  return { pending: oldCount === 1, complete: newCount === 1 };
}

export function transformProductionCiTest(source) {
  const state = inspectProductionCiTest(source);
  if (state.complete) return source;
  return source.replace(
    `expect(deploy).toContain("node-version: '${OLD_NODE_VERSION}'");`,
    `expect(deploy).toContain("node-version: '${NEW_NODE_VERSION}'");`,
  );
}

export function renderNodeToolchainBaselineTest() {
  const workflowExpectations = BASELINE_WORKFLOW_TARGETS
    .map(([relativePath, expectedPins]) => `    ['${relativePath}', ${expectedPins}],`)
    .join('\n');

  return `import fs from 'node:fs';\nimport path from 'node:path';\nimport { describe, expect, it } from 'vitest';\n\nconst root = path.resolve(__dirname, '../..');\nconst expectedNodeVersion = '${NEW_NODE_VERSION}';\nconst expectedNodeRange = '${NEW_NODE_RANGE}';\nconst obsoleteNodeVersion = '${OLD_NODE_VERSION}';\n\nconst workflowTargets = [\n${workflowExpectations}\n] as const;\n\nfunction read(relativePath: string): string {\n  return fs.readFileSync(path.join(root, relativePath), 'utf8');\n}\n\ndescribe('Node toolchain security baseline', () => {\n  it('uses one Node baseline for local and package metadata', () => {\n    expect(read('.nvmrc').trim()).toBe(expectedNodeVersion);\n    expect(JSON.parse(read('package.json')).engines.node).toBe(expectedNodeRange);\n    expect(JSON.parse(read('package-lock.json')).packages[''].engines.node).toBe(expectedNodeRange);\n  });\n\n  it('keeps every active setup-node control-plane pin on the canonical version', () => {\n    for (const [relativePath, expectedPins] of workflowTargets) {\n      const source = read(relativePath);\n      const currentPins = source.match(/node-version:\\s*(?:'24\\.20\\.0'|\"24\\.20\\.0\"|24\\.20\\.0)/g) ?? [];\n      const obsoletePins = source.match(/node-version:\\s*(?:'24\\.18\\.0'|\"24\\.18\\.0\"|24\\.18\\.0)/g) ?? [];\n      expect(currentPins.length, relativePath).toBe(expectedPins);\n      expect(obsoletePins.length, relativePath).toBe(0);\n    }\n  });\n\n  it('does not allow the obsolete active baseline back into canonical runtime metadata', () => {\n    expect(read('.nvmrc')).not.toContain(obsoleteNodeVersion);\n    expect(JSON.parse(read('package.json')).engines.node).not.toContain(obsoleteNodeVersion);\n    expect(JSON.parse(read('package-lock.json')).packages[''].engines.node).not.toContain(obsoleteNodeVersion);\n  });\n});\n`;
}

function inspectGeneratedBaselineTest(root) {
  const relativePath = GENERATED_TARGET_PATHS[0];
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return { pending: true, complete: false };
  const actual = fs.readFileSync(absolutePath, 'utf8');
  const expected = renderNodeToolchainBaselineTest();
  if (actual !== expected) fail(`${relativePath}: Datei existiert, entspricht aber nicht dem kanonischen Supersession-Test.`);
  return { pending: false, complete: true };
}

export function inspectRepository(root = process.cwd()) {
  const states = [];
  states.push(['.nvmrc', inspectNvmrc(read(root, '.nvmrc'))]);
  states.push(['package.json', inspectJsonRootEngine(read(root, 'package.json'), 'package.json')]);
  states.push(['package-lock.json', inspectJsonRootEngine(read(root, 'package-lock.json'), 'package-lock.json')]);
  for (const [relativePath, expectedPins] of WORKFLOW_TARGETS) {
    states.push([relativePath, inspectWorkflow(read(root, relativePath), relativePath, expectedPins)]);
  }
  states.push(['tests/unit/productionCiRunnerConsolidation.test.ts', inspectProductionCiTest(read(root, 'tests/unit/productionCiRunnerConsolidation.test.ts'))]);
  states.push([GENERATED_TARGET_PATHS[0], inspectGeneratedBaselineTest(root)]);

  const pending = states.filter(([, state]) => state.pending).map(([relativePath]) => relativePath);
  const complete = states.filter(([, state]) => state.complete).map(([relativePath]) => relativePath);
  return { pending, complete, states };
}

export function assertPending(root = process.cwd()) {
  const report = inspectRepository(root);
  if (report.complete.length !== 0 || report.pending.length !== report.states.length) {
    fail(`Preflight erwartet vollständig alte Baseline; pending=${report.pending.length}, complete=${report.complete.length}.`);
  }
  return report;
}

export function assertComplete(root = process.cwd()) {
  const report = inspectRepository(root);
  if (report.pending.length !== 0 || report.complete.length !== report.states.length) {
    fail(`Completion erwartet vollständig neue Baseline; pending=${report.pending.length}, complete=${report.complete.length}.`);
  }
  return report;
}

export function applySupersession(root = process.cwd()) {
  assertPending(root);
  write(root, '.nvmrc', transformNvmrc(read(root, '.nvmrc')));
  write(root, 'package.json', transformJsonRootEngine(read(root, 'package.json'), 'package.json'));
  write(root, 'package-lock.json', transformJsonRootEngine(read(root, 'package-lock.json'), 'package-lock.json'));
  for (const [relativePath, expectedPins] of WORKFLOW_TARGETS) {
    write(root, relativePath, transformWorkflow(read(root, relativePath), relativePath, expectedPins));
  }
  write(root, 'tests/unit/productionCiRunnerConsolidation.test.ts', transformProductionCiTest(read(root, 'tests/unit/productionCiRunnerConsolidation.test.ts')));
  write(root, GENERATED_TARGET_PATHS[0], renderNodeToolchainBaselineTest());
  return assertComplete(root);
}

function printReport(report, mode) {
  process.stdout.write(`${JSON.stringify({ mode, oldNodeVersion: OLD_NODE_VERSION, newNodeVersion: NEW_NODE_VERSION, pending: report.pending, complete: report.complete, targetPaths: TARGET_PATHS }, null, 2)}\n`);
}

function cli(argv) {
  const [mode] = argv;
  if (mode === '--print-targets') {
    process.stdout.write(`${[...TARGET_PATHS].sort().join('\n')}\n`);
    return;
  }
  if (mode === '--preflight') return printReport(assertPending(), 'preflight');
  if (mode === '--write') return printReport(applySupersession(), 'write');
  if (mode === '--check') return printReport(assertComplete(), 'check');
  fail('Aufruf muss --preflight, --write, --check oder --print-targets verwenden.');
}

const isDirectExecution = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectExecution) {
  try { cli(process.argv.slice(2)); }
  catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
