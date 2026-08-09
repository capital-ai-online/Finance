import fs from 'node:fs';

const dockerfile = fs.readFileSync('Dockerfile', 'utf8');
const dockerignore = fs.readFileSync('.dockerignore', 'utf8');

const requirements = [
  ['immutable base image digest', /FROM\s+node:22-alpine@sha256:[a-f0-9]{64}/],
  ['multi-stage builder', /AS\s+builder/i],
  ['multi-stage runner', /AS\s+runner/i],
  ['production-only dependencies', /npm\s+ci\s+--omit=dev/],
  ['non-root runtime user', /USER\s+capitalai/],
  ['explicit ownership during copy', /COPY\s+--from=builder\s+--chown=capitalai:capitalai/],
  ['container healthcheck', /HEALTHCHECK[\s\S]*\/healthz/],
  ['direct node PID 1 command', /CMD\s*\[\s*"node"\s*,\s*"dist\/server\.cjs"\s*\]/],
];

const forbidden = [
  ['floating base tag without digest', /^FROM\s+node:22-alpine(?:\s|$)/m],
  ['root runtime user', /^USER\s+root\s*$/m],
  ['production npm shim command', /CMD\s*\[\s*"npm"/],
];

const ignoreRequirements = [
  '.env',
  '.env.*',
  '.git',
  'node_modules',
  'coverage',
  '*.log',
  '*.pem',
  '*.key',
  'secrets/',
];

const failures = [];
for (const [name, pattern] of requirements) {
  if (!pattern.test(dockerfile)) failures.push(`missing: ${name}`);
}
for (const [name, pattern] of forbidden) {
  if (pattern.test(dockerfile)) failures.push(`forbidden: ${name}`);
}
for (const entry of ignoreRequirements) {
  if (!dockerignore.split(/\r?\n/).includes(entry)) failures.push(`.dockerignore missing: ${entry}`);
}

if (/ARG\s+(?:.*SECRET|.*PASSWORD|.*TOKEN|STRIPE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY)/i.test(dockerfile)) {
  failures.push('forbidden: secret-like Docker ARG detected');
}

if (failures.length) {
  console.error('Docker hardening policy failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Docker hardening policy passed.');
