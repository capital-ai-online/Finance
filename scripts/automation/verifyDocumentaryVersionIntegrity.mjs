#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const fail = (message) => {
  throw new Error('[documentary-version-integrity] ' + message);
};

const manifest = JSON.parse(read('src/platform/Documentary/manifest.json'));
const version = String(manifest.version || '');
if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
  fail('manifest.json#version is not canonical SemVer: ' + version);
}
if (manifest?.versionAuthority?.componentVersion !== 'manifest.json#version') {
  fail('manifest must remain the sole Documentary component-version authority.');
}

const readme = read('src/platform/Documentary/README.md');
const readmeMatch = /^Version:\s*([^\s]+)\s*$/m.exec(readme);
if (!readmeMatch) fail('Documentary README has no Version projection.');
if (readmeMatch[1] !== version) fail('README version ' + readmeMatch[1] + ' != manifest authority ' + version + '.');
if (!readme.includes('Component Version Authority:') || !readme.includes('manifest.json#version')) {
  fail('README does not project manifest.json#version as component authority.');
}

const roadmap = read('docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md');
const roadmapMatch = /Documentary component version[^0-9]*([0-9]+\.[0-9]+\.[0-9]+)/.exec(roadmap);
if (!roadmapMatch) fail('Documentary architecture roadmap has no component-version projection.');
if (roadmapMatch[1] !== version) {
  fail('architecture roadmap version ' + roadmapMatch[1] + ' != manifest authority ' + version + '.');
}

const maintenanceValidator = read('scripts/automation/validateDocumentaryMaintenanceControlLoop.mjs');
if (/documentaryManifest\.version\s*!==\s*['"][0-9]+\.[0-9]+\.[0-9]+['"]/.test(maintenanceValidator)) {
  fail('maintenance validator still embeds a historical Documentary version literal.');
}

console.log(JSON.stringify({
  authority: 'src/platform/Documentary/manifest.json#version',
  componentVersion: version,
  projections: [
    'src/platform/Documentary/README.md',
    'docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md'
  ],
  state: 'VERIFIED'
}, null, 2));
