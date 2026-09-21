import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  UNIFIED_OSS_QUALITY_BUNDLE_SCHEMA,
  UNIFIED_OSS_QUALITY_FINDING_SCHEMA,
  buildUnifiedQualityFindingId,
  isOssQualityProfile,
  type OssQualityProfile,
  type OssQualityToolId,
  type UnifiedQualityCoverageMeasurement,
  type UnifiedQualityDuplicationMeasurement,
  type UnifiedQualityEvidenceBundle,
  type UnifiedQualityFinding,
  type UnifiedQualitySeverity,
  type UnifiedQualityToolEvidence,
} from '../../src/platform/Quality/Findings/UnifiedFindingContract';

const root = process.cwd();
const artifactRoot = path.join(root, 'artifacts', 'oss-quality');
const sourceSha = String(process.env.SOURCE_SHA || '').trim();
const baseSha = String(process.env.BASE_SHA || '').trim();
const repository = String(process.env.GITHUB_REPOSITORY || 'capital-ai-online/Finance').trim();
const requestedProfile = String(process.env.OSS_QUALITY_PROFILE || 'FULL').trim().toUpperCase();

if (!/^[0-9a-f]{40}$/i.test(sourceSha)) throw new Error('SOURCE_SHA must be an exact 40-character commit SHA.');
if (!/^[0-9a-f]{40}$/i.test(baseSha)) throw new Error('BASE_SHA must be an exact 40-character commit SHA.');
if (!isOssQualityProfile(requestedProfile)) {
  throw new Error(`OSS_QUALITY_PROFILE must be one of PR_FAST, DEEP_BASELINE or FULL; received ${requestedProfile || '(empty)'}.`);
}

const profile: OssQualityProfile = requestedProfile;
const applicable = Object.freeze({
  gitleaks: profile !== 'DEEP_BASELINE',
  osv: profile !== 'DEEP_BASELINE',
  coverage: profile !== 'PR_FAST',
  knip: profile !== 'PR_FAST',
  jscpd: profile !== 'PR_FAST',
});

fs.mkdirSync(artifactRoot, { recursive: true });

function readJson(relativePath: string): unknown | null {
  const absolute = path.join(root, relativePath);
  if (!fs.existsSync(absolute)) return null;
  try {
    const raw = fs.readFileSync(absolute, 'utf8').trim();
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function relativeFile(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const normalized = value.replace(/\\/g, '/');
  const rootNormalized = root.replace(/\\/g, '/');
  return normalized.startsWith(rootNormalized + '/')
    ? normalized.slice(rootNormalized.length + 1)
    : normalized.replace(/^\.\//, '');
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function hashFile(relativePath: string): string | null {
  const absolute = path.join(root, relativePath);
  if (!fs.existsSync(absolute)) return null;
  return createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
}

function finding(input: Omit<UnifiedQualityFinding, 'schemaVersion' | 'id' | 'sourceSha' | 'baseSha' | 'state'> & {
  identity?: string | null;
}): UnifiedQualityFinding {
  return Object.freeze({
    schemaVersion: UNIFIED_OSS_QUALITY_FINDING_SCHEMA,
    id: buildUnifiedQualityFindingId({
      sourceTool: input.sourceTool,
      ruleId: input.ruleId,
      path: input.path,
      line: input.line,
      identity: input.identity,
    }),
    sourceSha,
    baseSha,
    state: 'OPEN',
    sourceTool: input.sourceTool,
    ruleId: input.ruleId,
    domain: input.domain,
    severity: input.severity,
    confidence: input.confidence,
    title: input.title,
    path: input.path,
    line: input.line,
    newInPr: input.newInPr,
    artifactPath: input.artifactPath,
    toolVersion: input.toolVersion,
    configSha256: input.configSha256,
    metadata: Object.freeze({ ...input.metadata }),
  });
}

function toolEvidence(
  tool: OssQualityToolId,
  version: string,
  artifactPath: string,
  count: number,
  isApplicable: boolean,
): UnifiedQualityToolEvidence {
  if (!isApplicable) {
    return Object.freeze({ tool, version, status: 'NOT_APPLICABLE', artifactPath: null });
  }
  const evidence = readJson(artifactPath);
  return Object.freeze({
    tool,
    version,
    status: evidence === null ? 'NOT_AVAILABLE' : count > 0 ? 'FINDINGS' : 'PASS',
    artifactPath: evidence === null ? null : artifactPath,
  });
}

const findings: UnifiedQualityFinding[] = [];

const gitleaksPath = 'artifacts/oss-quality/gitleaks.json';
const gitleaks = applicable.gitleaks ? readJson(gitleaksPath) : null;
const gitleaksRows = applicable.gitleaks && Array.isArray(gitleaks) ? gitleaks : [];
for (const raw of gitleaksRows) {
  if (!raw || typeof raw !== 'object') continue;
  const row = raw as Record<string, unknown>;
  const file = relativeFile(row.File);
  const line = finiteNumber(row.StartLine);
  const ruleId = typeof row.RuleID === 'string' && row.RuleID ? row.RuleID : 'secret';
  const identity = typeof row.Fingerprint === 'string' ? row.Fingerprint : null;
  findings.push(finding({
    sourceTool: 'gitleaks',
    ruleId,
    domain: 'SECURITY',
    severity: 'BLOCKER',
    confidence: 'HIGH',
    title: typeof row.Description === 'string' && row.Description ? row.Description : 'Potential secret detected',
    path: file,
    line,
    newInPr: profile === 'PR_FAST',
    artifactPath: gitleaksPath,
    toolVersion: '8.30.1',
    configSha256: null,
    metadata: { fingerprint: identity },
    identity,
  }));
}

type OsvPackageFinding = {
  key: string;
  id: string;
  source: string | null;
  ecosystem: string;
  packageName: string;
  version: string;
  summary: string;
};

function collectOsv(input: unknown): OsvPackageFinding[] {
  if (!input || typeof input !== 'object') return [];
  const rows: OsvPackageFinding[] = [];
  const results = Array.isArray((input as { results?: unknown }).results)
    ? ((input as { results: unknown[] }).results)
    : [];
  for (const result of results) {
    if (!result || typeof result !== 'object') continue;
    const source = relativeFile((result as { source?: { path?: unknown } }).source?.path);
    const packages = Array.isArray((result as { packages?: unknown }).packages)
      ? ((result as { packages: unknown[] }).packages)
      : [];
    for (const packageRow of packages) {
      if (!packageRow || typeof packageRow !== 'object') continue;
      const pkg = (packageRow as { package?: Record<string, unknown> }).package ?? {};
      const packageName = typeof pkg.name === 'string' ? pkg.name : 'unknown';
      const version = typeof pkg.version === 'string' ? pkg.version : 'unknown';
      const ecosystem = typeof pkg.ecosystem === 'string' ? pkg.ecosystem : 'unknown';
      const vulnerabilities = Array.isArray((packageRow as { vulnerabilities?: unknown }).vulnerabilities)
        ? ((packageRow as { vulnerabilities: unknown[] }).vulnerabilities)
        : [];
      for (const vulnerability of vulnerabilities) {
        if (!vulnerability || typeof vulnerability !== 'object') continue;
        const vuln = vulnerability as Record<string, unknown>;
        const id = typeof vuln.id === 'string' ? vuln.id : 'OSV-UNKNOWN';
        const summary = typeof vuln.summary === 'string' && vuln.summary ? vuln.summary : id;
        rows.push({
          key: [ecosystem, packageName, version, id].join('|'),
          id,
          source,
          ecosystem,
          packageName,
          version,
          summary,
        });
      }
    }
  }
  return rows;
}

const osvBasePath = 'artifacts/oss-quality/osv-base.json';
const osvHeadPath = 'artifacts/oss-quality/osv-head.json';
const osvBase = applicable.osv ? collectOsv(readJson(osvBasePath)) : [];
const osvHead = applicable.osv ? collectOsv(readJson(osvHeadPath)) : [];
const osvBaseKeys = new Set(osvBase.map((item) => item.key));
for (const item of osvHead) {
  findings.push(finding({
    sourceTool: 'osv-scanner',
    ruleId: item.id,
    domain: 'DEPENDENCY',
    severity: 'HIGH',
    confidence: 'HIGH',
    title: item.summary,
    path: item.source,
    line: null,
    newInPr: profile === 'PR_FAST' && !osvBaseKeys.has(item.key),
    artifactPath: osvHeadPath,
    toolVersion: '2.6.0',
    configSha256: null,
    metadata: {
      ecosystem: item.ecosystem,
      package: item.packageName,
      version: item.version,
    },
    identity: item.key,
  }));
}

const knipPath = 'artifacts/oss-quality/knip.json';
const knip = applicable.knip ? readJson(knipPath) : null;
const knipIssues = applicable.knip
  && knip && typeof knip === 'object'
  && Array.isArray((knip as { issues?: unknown }).issues)
  ? ((knip as { issues: unknown[] }).issues)
  : [];
const knipCategories = [
  'files',
  'dependencies',
  'devDependencies',
  'optionalPeerDependencies',
  'unlisted',
  'binaries',
  'unresolved',
  'exports',
  'types',
  'duplicates',
] as const;
let knipFindingCount = 0;
for (const issue of knipIssues) {
  if (!issue || typeof issue !== 'object') continue;
  const row = issue as Record<string, unknown>;
  const issueFile = relativeFile(row.file);
  for (const category of knipCategories) {
    const entries = Array.isArray(row[category]) ? (row[category] as unknown[]) : [];
    for (const entry of entries) {
      const record = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {};
      const name = typeof record.name === 'string' ? record.name : typeof entry === 'string' ? entry : category;
      const line = finiteNumber(record.line);
      const pathValue = category === 'files' ? relativeFile(record.name ?? entry) : issueFile;
      const severity: UnifiedQualitySeverity =
        category === 'dependencies' || category === 'unlisted' || category === 'unresolved' ? 'MEDIUM' : 'LOW';
      findings.push(finding({
        sourceTool: 'knip',
        ruleId: `knip/${category}`,
        domain: 'MAINTAINABILITY',
        severity,
        confidence: 'MEDIUM',
        title: `${category}: ${name}`,
        path: pathValue,
        line,
        newInPr: false,
        artifactPath: knipPath,
        toolVersion: '6.31.0',
        configSha256: hashFile('knip.json'),
        metadata: { category, symbol: name },
        identity: `${category}|${name}`,
      }));
      knipFindingCount += 1;
    }
  }
}

const jscpdPath = 'artifacts/oss-quality/jscpd/jscpd-report.json';
const jscpd = applicable.jscpd ? readJson(jscpdPath) : null;
const duplicates = applicable.jscpd
  && jscpd && typeof jscpd === 'object'
  && Array.isArray((jscpd as { duplicates?: unknown }).duplicates)
  ? ((jscpd as { duplicates: unknown[] }).duplicates)
  : [];
for (const duplicate of duplicates) {
  if (!duplicate || typeof duplicate !== 'object') continue;
  const row = duplicate as Record<string, unknown>;
  const first = row.firstFile && typeof row.firstFile === 'object' ? row.firstFile as Record<string, unknown> : {};
  const second = row.secondFile && typeof row.secondFile === 'object' ? row.secondFile as Record<string, unknown> : {};
  const firstPath = relativeFile(first.name);
  const secondPath = relativeFile(second.name);
  const line = finiteNumber(first.start);
  findings.push(finding({
    sourceTool: 'jscpd',
    ruleId: 'jscpd/duplicate-block',
    domain: 'DUPLICATION',
    severity: 'LOW',
    confidence: 'HIGH',
    title: `Duplicate block: ${firstPath ?? 'unknown'} ↔ ${secondPath ?? 'unknown'}`,
    path: firstPath,
    line,
    newInPr: false,
    artifactPath: jscpdPath,
    toolVersion: '5.0.12',
    configSha256: hashFile('.jscpd.json'),
    metadata: {
      secondPath,
      secondLine: finiteNumber(second.start),
      lines: finiteNumber(row.lines),
      tokens: finiteNumber(row.tokens),
    },
    identity: `${firstPath ?? ''}|${line ?? ''}|${secondPath ?? ''}|${finiteNumber(second.start) ?? ''}`,
  }));
}

const coveragePath = '.quality/coverage-summary.json';
const coverage = applicable.coverage ? readJson(coveragePath) : null;
const total = applicable.coverage
  && coverage && typeof coverage === 'object'
  && (coverage as { total?: unknown }).total
  && typeof (coverage as { total?: unknown }).total === 'object'
  ? (coverage as { total: Record<string, unknown> }).total
  : null;
const readPct = (key: string): number | null => {
  const metric = total?.[key];
  if (!metric || typeof metric !== 'object') return null;
  return finiteNumber((metric as { pct?: unknown }).pct);
};

const coverageStatus: UnifiedQualityCoverageMeasurement['status'] =
  !applicable.coverage ? 'NOT_APPLICABLE' : total ? 'AVAILABLE' : 'NOT_AVAILABLE';
const coverageMeasurement: UnifiedQualityCoverageMeasurement = Object.freeze({
  status: coverageStatus,
  source: coverageStatus === 'AVAILABLE' ? coveragePath : null,
  statements: coverageStatus === 'AVAILABLE' ? readPct('statements') : null,
  branches: coverageStatus === 'AVAILABLE' ? readPct('branches') : null,
  functions: coverageStatus === 'AVAILABLE' ? readPct('functions') : null,
  lines: coverageStatus === 'AVAILABLE' ? readPct('lines') : null,
});

if (
  applicable.coverage
  && (
    coverageMeasurement.status === 'NOT_AVAILABLE'
    || [coverageMeasurement.statements, coverageMeasurement.branches, coverageMeasurement.functions, coverageMeasurement.lines]
      .some((value) => value === null)
  )
) {
  findings.push(finding({
    sourceTool: 'vitest-coverage',
    ruleId: 'coverage/not-available',
    domain: 'COVERAGE',
    severity: 'HIGH',
    confidence: 'HIGH',
    title: 'Vitest V8 coverage evidence is not complete',
    path: coveragePath,
    line: null,
    newInPr: false,
    artifactPath: coveragePath,
    toolVersion: '4.1.11',
    configSha256: null,
    metadata: { profile },
    identity: 'coverage-summary',
  }));
}

const stats = applicable.jscpd
  && jscpd && typeof jscpd === 'object'
  && (jscpd as { statistics?: { total?: unknown } }).statistics?.total
  && typeof (jscpd as { statistics?: { total?: unknown } }).statistics?.total === 'object'
  ? (jscpd as { statistics: { total: Record<string, unknown> } }).statistics.total
  : null;

const duplicationStatus: UnifiedQualityDuplicationMeasurement['status'] =
  !applicable.jscpd ? 'NOT_APPLICABLE' : stats ? 'AVAILABLE' : 'NOT_AVAILABLE';
const duplicationMeasurement: UnifiedQualityDuplicationMeasurement = Object.freeze({
  status: duplicationStatus,
  source: duplicationStatus === 'AVAILABLE' ? jscpdPath : null,
  percentage: duplicationStatus === 'AVAILABLE' ? finiteNumber(stats?.percentage) : null,
  clones: duplicationStatus === 'AVAILABLE' ? finiteNumber(stats?.clones) : null,
  duplicatedLines: duplicationStatus === 'AVAILABLE' ? finiteNumber(stats?.duplicatedLines) : null,
  totalLines: duplicationStatus === 'AVAILABLE' ? finiteNumber(stats?.lines) : null,
});

const osvBaseEvidence = applicable.osv ? readJson(osvBasePath) : null;
const osvHeadEvidence = applicable.osv ? readJson(osvHeadPath) : null;
const tools: UnifiedQualityToolEvidence[] = [
  toolEvidence('gitleaks', '8.30.1', gitleaksPath, gitleaksRows.length, applicable.gitleaks),
  applicable.osv
    ? {
        tool: 'osv-scanner',
        version: '2.6.0',
        status: osvBaseEvidence === null || osvHeadEvidence === null
          ? 'NOT_AVAILABLE'
          : osvHead.length > 0 ? 'FINDINGS' : 'PASS',
        artifactPath: osvBaseEvidence === null || osvHeadEvidence === null ? null : osvHeadPath,
      }
    : {
        tool: 'osv-scanner',
        version: '2.6.0',
        status: 'NOT_APPLICABLE',
        artifactPath: null,
      },
  {
    tool: 'vitest-coverage',
    version: '4.1.11',
    status: coverageMeasurement.status === 'AVAILABLE'
      ? 'PASS'
      : coverageMeasurement.status === 'NOT_APPLICABLE' ? 'NOT_APPLICABLE' : 'NOT_AVAILABLE',
    artifactPath: coverageMeasurement.status === 'AVAILABLE' ? coveragePath : null,
  },
  toolEvidence('knip', '6.31.0', knipPath, knipFindingCount, applicable.knip),
  toolEvidence('jscpd', '5.0.12', jscpdPath, duplicates.length, applicable.jscpd),
];

const bundle: UnifiedQualityEvidenceBundle = Object.freeze({
  schemaVersion: UNIFIED_OSS_QUALITY_BUNDLE_SCHEMA,
  generatedAt: new Date().toISOString(),
  repository,
  sourceSha: sourceSha.toLowerCase(),
  baseSha: baseSha.toLowerCase(),
  profile,
  nonAuthorizingStatement:
    'OSS Quality findings are commit-bound evidence only. NOT_APPLICABLE means the tool is intentionally outside the selected execution profile; it is never PASS. Existing Governance, Security, Quality, Human/CODEOWNER, release and production controls retain their authority.',
  tools: Object.freeze(tools.map((tool) => Object.freeze({ ...tool }))),
  findings: Object.freeze(findings),
  measurements: Object.freeze({
    coverage: coverageMeasurement,
    duplication: duplicationMeasurement,
  }),
});

const outputPath = path.join(artifactRoot, 'unified-findings.json');
fs.writeFileSync(outputPath, JSON.stringify(bundle, null, 2) + '\n');

const newSecrets = findings.filter((item) => item.sourceTool === 'gitleaks' && item.newInPr).length;
const newVulnerabilities = findings.filter((item) => item.sourceTool === 'osv-scanner' && item.newInPr).length;
process.stdout.write(
  `[OSS Quality] profile=${profile} findings=${findings.length} newSecrets=${newSecrets} newVulnerabilities=${newVulnerabilities} output=${path.relative(root, outputPath)}\n`,
);
