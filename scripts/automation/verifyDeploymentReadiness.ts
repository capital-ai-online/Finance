// Enterprise Deployment-Readiness Gate.
// Prüft Infrastruktur-, Secret-, Migration-, Dependency-, Traceability-, RAG- und AI-Governance-
// Voraussetzungen vor einem produktiven Build. Der Gate-Code führt keine externen Änderungen aus.

import fs from 'fs';
import path from 'path';
import { PROMPT_REGISTRY } from '../../src/services/aiUsageTracker';
import { evaluateDependencyPolicy, writeCycloneDxSbom } from './dependencySecurity';
import { SECRET_FILE_KEYS } from '../security/secretFileManifest';

const REPO_ROOT = process.cwd();
let hasErrors = false;

function fail(message: string) {
  console.error(`[FEHLER] ${message}`);
  hasErrors = true;
}

function ok(message: string) {
  console.log(`[OK] ${message}`);
}

function readJson(filePath: string): any {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`${path.relative(REPO_ROOT, filePath)} ist kein valides JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

// --- 1. Render Health Check ---------------------------------------------------------------
const renderYamlPath = path.join(REPO_ROOT, 'render.yaml');
const renderYaml = fs.readFileSync(renderYamlPath, 'utf8');
if (/healthCheckPath:\s*\S+/.test(renderYaml)) ok('render.yaml definiert healthCheckPath.');
else fail('render.yaml hat keinen healthCheckPath.');

// --- 2. Env-Var-Abdeckung ----------------------------------------------------------------
const KNOWN_OPTIONAL_ENV_VARS = new Set([
  'NODE_ENV', 'LLAMA_LOCAL_ENDPOINT',
  'OWNER_DISPLAY_NAME', 'OWNER_BUSINESS_EMAIL', 'OWNER_DEFAULT_AUTHOR_EMAIL', 'OWNER_NOTIFICATION_EMAIL', 'OWNER_LEGACY_EMAILS',
  'RENDER_EXTERNAL_URL', 'PORT', 'ANTHROPIC_MODEL', 'OPENAI_MODEL',
]);
const ALTERNATE_NAME_GROUPS: string[][] = [
  ['SUPABASE_URL', 'VITE_SUPABASE_URL'],
  ['SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'],
  ['STRIPE_PUBLISHABLE_KEY', 'VITE_STRIPE_PUBLISHABLE_KEY'],
];

function collectTsFiles(roots: string[]): string[] {
  const files: string[] = [];
  const walk = (target: string) => {
    if (!fs.existsSync(target)) return;
    const stat = fs.statSync(target);
    if (stat.isFile()) {
      if (target.endsWith('.ts') || target.endsWith('.tsx')) files.push(target);
      return;
    }
    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.git')) continue;
      walk(path.join(target, entry.name));
    }
  };
  roots.forEach(walk);
  return files;
}

function findEnvVarUsages(): Set<string> {
  const found = new Set<string>();
  const directPattern = /getCleanEnv\(\s*['"]([A-Z_0-9]+)['"]\s*\)/g;
  const dynamicPattern = /(?:clientIdEnvVar|clientSecretEnvVar):\s*['"]([A-Z_0-9]+)['"]/g;
  // Some guarded provider boundaries expose one canonical env identity as an `as const`
  // constant and resolve it through environment[CONSTANT]. Resolve that indirection here so
  // deployment coverage cannot silently miss a productive credential merely because the
  // runtime avoids duplicating the literal at every call site.
  const namedEnvKeyPattern = /(?:export\s+)?const\s+([A-Z][A-Z0-9_]*)\s*=\s*['"]([A-Z_0-9]+)['"]\s+as\s+const/g;
  const indexedNamedEnvPattern = /(?:process\.env|environment)\[\s*([A-Z][A-Z0-9_]*)\s*\]/g;
  const files = collectTsFiles([path.join(REPO_ROOT, 'server.ts'), path.join(REPO_ROOT, 'server'), path.join(REPO_ROOT, 'src')]);
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let match: RegExpExecArray | null;
    directPattern.lastIndex = 0;
    while ((match = directPattern.exec(content))) found.add(match[1]);
    dynamicPattern.lastIndex = 0;
    while ((match = dynamicPattern.exec(content))) found.add(match[1]);

    const namedEnvKeys = new Map<string, string>();
    namedEnvKeyPattern.lastIndex = 0;
    while ((match = namedEnvKeyPattern.exec(content))) namedEnvKeys.set(match[1], match[2]);
    indexedNamedEnvPattern.lastIndex = 0;
    while ((match = indexedNamedEnvPattern.exec(content))) {
      const resolved = namedEnvKeys.get(match[1]);
      if (resolved) found.add(resolved);
    }
  }
  return found;
}

function findRenderYamlKeys(): Set<string> {
  const found = new Set<string>();
  const pattern = /key:\s*([A-Z_0-9]+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(renderYaml))) found.add(match[1]);
  return found;
}

const usedVars = findEnvVarUsages();
// Deploy-Härtung: echte Secrets kommen seit der Secret-File-Migration nicht mehr über
// render.yaml `envVars`, sondern über die Render Secret File (siehe render.yaml
// `secretFiles` + scripts/security/secretFileManifest.ts). Ohne diese Ergänzung würde
// dieses Gate jeden migrierten Secret-Key fälschlich als "ohne Deployment-Abdeckung" melden.
const renderYamlKeys = new Set([...findRenderYamlKeys(), ...SECRET_FILE_KEYS]);
const alternateGroupOf = new Map<string, string[]>();
for (const group of ALTERNATE_NAME_GROUPS) for (const name of group) alternateGroupOf.set(name, group);
const uncoveredVars = [...usedVars].filter(name => {
  if (renderYamlKeys.has(name) || KNOWN_OPTIONAL_ENV_VARS.has(name)) return false;
  const group = alternateGroupOf.get(name);
  return !(group && group.some(alt => renderYamlKeys.has(alt)));
});
if (uncoveredVars.length === 0) ok(`Alle ${usedVars.size} referenzierten Env-Variablen sind abgedeckt.`);
else fail(`${uncoveredVars.length} Env-Variable(n) ohne Deployment-Abdeckung: ${uncoveredVars.join(', ')}`);

// --- 3. Migration Integrity ---------------------------------------------------------------
const migrationsDir = path.join(REPO_ROOT, 'supabase', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  fail('supabase/migrations/ existiert nicht.');
} else {
  const migrationFiles = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql'));
  const malformed = migrationFiles.filter(file => !/^\d{14}_.+\.sql$/.test(file));
  if (migrationFiles.length === 0) fail('supabase/migrations/ enthält keine .sql-Dateien.');
  else if (malformed.length) fail(`Migrationsdateien mit ungültigem Namen: ${malformed.join(', ')}`);
  else ok(`${migrationFiles.length} Migrationsdateien vorhanden und korrekt benannt.`);
}

// --- 4. Dependency / Supply-Chain Integrity -----------------------------------------------
const packageJsonPath = path.join(REPO_ROOT, 'package.json');
const packageLockPath = path.join(REPO_ROOT, 'package-lock.json');
if (!fs.existsSync(packageLockPath)) {
  fail('package-lock.json fehlt - reproduzierbarer npm-ci-Build nicht gewährleistet.');
} else {
  const pkg = readJson(packageJsonPath);
  const lock = readJson(packageLockPath);
  const rootLock = lock?.packages?.[''];
  if (pkg && lock && rootLock) {
    if (rootLock.name !== pkg.name || rootLock.version !== pkg.version) {
      fail(`package.json und package-lock.json Root-Metadaten divergieren (${pkg.name}@${pkg.version} vs ${rootLock.name}@${rootLock.version}).`);
    } else {
      ok(`Lockfile stimmt mit ${pkg.name}@${pkg.version} überein.`);
    }

    const policy = evaluateDependencyPolicy(pkg, lock);
    if (policy.violations.length > 0) {
      for (const violation of policy.violations) fail(`Dependency Policy: ${violation}`);
    } else {
      ok(`${policy.productionDependencyCount} direkte Production-Dependencies erfüllen die Supply-Chain-Policy.`);
    }

    try {
      const sbomPath = writeCycloneDxSbom(REPO_ROOT, pkg, lock);
      ok(`CycloneDX-SBOM erzeugt: ${path.relative(REPO_ROOT, sbomPath)}.`);
    } catch (error) {
      fail(`CycloneDX-SBOM konnte nicht erzeugt werden: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else if (lock) {
    fail('package-lock.json enthält keinen Root-Package-Eintrag.');
  }
}

// --- 5. Traceability Artifacts -------------------------------------------------------------
const traceabilityFiles = [
  '.ai/knowledge/traceability/matrix.json',
  '.ai/knowledge/traceability/coverage.json',
  '.ai/knowledge/traceability/orphans.json',
  'docs/traceability/COVERAGE_REPORT.md',
];
const missingTraceability = traceabilityFiles.filter(file => !fs.existsSync(path.join(REPO_ROOT, file)));
if (missingTraceability.length) {
  fail(`Traceability-Artefakte fehlen: ${missingTraceability.join(', ')}`);
} else {
  readJson(path.join(REPO_ROOT, '.ai/knowledge/traceability/matrix.json'));
  readJson(path.join(REPO_ROOT, '.ai/knowledge/traceability/coverage.json'));
  readJson(path.join(REPO_ROOT, '.ai/knowledge/traceability/orphans.json'));
  if (!hasErrors) ok('Traceability-Artefakte vorhanden und JSON-strukturell lesbar.');
}

// --- 6. Financial RAG Evidence Contract ---------------------------------------------------
const ragEvidencePath = path.join(REPO_ROOT, 'src/services/rag/evidenceLayer.ts');
const ragRetrievalPath = path.join(REPO_ROOT, 'src/services/rag/retrieval.ts');
if (!fs.existsSync(ragEvidencePath) || !fs.existsSync(ragRetrievalPath)) {
  fail('Financial-RAG Evidence Layer oder Retrieval-Contract fehlt.');
} else {
  const retrieval = fs.readFileSync(ragRetrievalPath, 'utf8');
  if (!retrieval.includes('retrieveRelevantChunksWithEvidence')) fail('Evidence-aware RAG Retrieval API fehlt.');
  else ok('Financial-RAG Evidence Contract ist vorhanden.');
}

// --- 7. Prompt Registry Coverage -----------------------------------------------------------
const aiFiles = collectTsFiles([
  path.join(REPO_ROOT, 'server.ts'),
  path.join(REPO_ROOT, 'server'),
  path.join(REPO_ROOT, 'src/agents'),
  path.join(REPO_ROOT, 'src/services'),
]);
const promptIdPattern = /promptId:\s*['"]([^'"]+)['"]/g;
const referencedPromptIds = new Set<string>();
for (const file of aiFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match: RegExpExecArray | null;
  promptIdPattern.lastIndex = 0;
  while ((match = promptIdPattern.exec(content))) referencedPromptIds.add(match[1]);
}
const unregisteredPromptIds = [...referencedPromptIds].filter(promptId => !PROMPT_REGISTRY[promptId]).sort();
if (unregisteredPromptIds.length) {
  fail(`AI promptId ohne PROMPT_REGISTRY-Eintrag: ${unregisteredPromptIds.join(', ')}`);
} else {
  ok(`${referencedPromptIds.size} statisch referenzierte AI-Prompt-IDs sind registriert.`);
}

if (hasErrors) {
  console.error('\n[verifyDeploymentReadiness] Fehlgeschlagen - siehe [FEHLER]-Zeilen oben.');
  process.exit(1);
}
console.log('\n[verifyDeploymentReadiness] Alle Enterprise Release Gates bestanden.');
