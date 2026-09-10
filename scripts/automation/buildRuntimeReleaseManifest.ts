import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { computeRuntimeArtifactIdentity } from './runtimeArtifactIdentity';
import { resolveSourceCommit } from './sourceIdentity';

const CONTRACT = 'capital-ai-runtime-release-manifest/1.0.0';
const repoRoot = process.cwd();

function value(flag: string): string {
  return process.argv.find(arg => arg.startsWith(`--${flag}=`))?.slice(flag.length + 3).trim() ?? '';
}

function sha256(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function hashFile(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  return sha256(fs.readFileSync(filePath));
}

function walkFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.history') continue;
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile()) files.push(absolute);
    }
  };
  walk(root);
  return files.sort((a, b) => a.localeCompare(b));
}

function hashDocumentaryTree(): { sha256: string; files: number } {
  const docsRoot = path.join(repoRoot, 'docs');
  const records = walkFiles(docsRoot).map(filePath => {
    const relative = path.relative(repoRoot, filePath).replace(/\\/g, '/');
    return `${relative}:${sha256(fs.readFileSync(filePath))}`;
  });
  return { sha256: sha256(records.join('\n')), files: records.length };
}

function generatedAt(): string {
  const epoch = process.env.SOURCE_DATE_EPOCH;
  if (epoch && /^\d+$/.test(epoch)) return new Date(Number(epoch) * 1000).toISOString();
  return new Date().toISOString();
}

function main() {
  const packagePath = path.join(repoRoot, 'package.json');
  const packageLockPath = path.join(repoRoot, 'package-lock.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as { name?: string; version?: string };
  const version = typeof pkg.version === 'string' && pkg.version.trim() ? pkg.version.trim() : 'unknown';
  const sourceCommit = resolveSourceCommit(repoRoot);
  const documentary = hashDocumentaryTree();
  const packageLockSha256 = hashFile(packageLockPath);
  const runtimeArtifact = computeRuntimeArtifactIdentity(repoRoot);

  const identityMaterial = JSON.stringify({
    contract: CONTRACT,
    version,
    sourceCommit,
    packageLockSha256,
    documentaryTreeSha256: documentary.sha256,
    runtimeArtifactAlgorithm: runtimeArtifact.algorithm,
    runtimeArtifactSha256: runtimeArtifact.sha256,
  });

  const manifest = {
    contract: CONTRACT,
    authority: 'ci-or-controlled-build',
    mutable: false,
    application: pkg.name ?? 'capital-ai',
    version,
    sourceCommit,
    generatedAt: generatedAt(),
    buildIdentity: sha256(identityMaterial),
    inputs: {
      packageJsonSha256: hashFile(packagePath),
      packageLockSha256,
      documentaryTreeSha256: documentary.sha256,
      documentaryFileCount: documentary.files,
    },
    runtimeArtifact: {
      root: runtimeArtifact.root,
      algorithm: runtimeArtifact.algorithm,
      sha256: runtimeArtifact.sha256,
      files: runtimeArtifact.files,
    },
  };

  const requestedOutput = value('output');
  const outputPath = requestedOutput
    ? path.resolve(repoRoot, requestedOutput)
    : path.join(repoRoot, 'dist', 'control-plane', 'release-manifest.json');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(
    `[release-manifest] ${path.relative(repoRoot, outputPath)} :: ${manifest.buildIdentity} :: ` +
    `runtime=${runtimeArtifact.sha256} (${runtimeArtifact.files} files)`,
  );
}

try {
  main();
} catch (error) {
  console.error(`[release-manifest] FAIL-CLOSED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
