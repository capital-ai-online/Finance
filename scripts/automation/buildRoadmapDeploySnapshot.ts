import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  buildRoadmapStateFromSources,
  parseRoadmapProjectRouting,
} from '../../server/routes/roadmapStateProjection';

const SHA40 = /^[0-9a-f]{40}$/i;
const mappingPath = 'docs/projects/README.md';
const leadingPath = 'docs/architecture/ROADMAP.md';

function sourceCommit(): string {
  const provided = process.env.RELEASE_SOURCE_COMMIT ||
    process.env.RENDER_GIT_COMMIT || process.env.GITHUB_SHA;
  const value = provided || execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  if (!SHA40.test(value)) throw new Error('ROADMAP_DEPLOY_SOURCE_SHA_INVALID');
  return value.toLowerCase();
}

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

export function buildRoadmapDeploySnapshot(commitSha = sourceCommit()) {
  if (!SHA40.test(commitSha)) throw new Error('ROADMAP_DEPLOY_SOURCE_SHA_INVALID');
  const projectMapping = read(mappingPath);
  const routes = parseRoadmapProjectRouting(projectMapping);
  const projectRoadmaps = Object.fromEntries(
    routes.map((route) => {
      const source = route.folder + 'ROADMAP.md';
      return [source, read(source)];
    }),
  );
  return buildRoadmapStateFromSources({
    currentMainSha: commitSha.toLowerCase(),
    projectMapping,
    liveRoadmap: read(leadingPath),
    projectRoadmaps,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const snapshot = buildRoadmapDeploySnapshot();
  const destination = path.resolve(process.cwd(), 'public/roadmap-deploy-snapshot.json');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, JSON.stringify(snapshot) + '\n', 'utf8');
  process.stdout.write(
    'Roadmap deploy snapshot: ' + snapshot.repository.currentMainSha +
    ' (' + snapshot.items.length + ' items)\n',
  );
}
