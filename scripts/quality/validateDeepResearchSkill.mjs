import fs from 'node:fs';

const skillPath = '.ai/skills/CAPITAL-AI-Deep-Research.md';
const schemaPath = '.ai/schemas/deep-research-evidence.schema.json';

const fail = (code, message) => {
  console.error(`[${code}] ${message}`);
  process.exitCode = 1;
};

const skill = fs.readFileSync(skillPath, 'utf8');
let schema;
try {
  schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
} catch (error) {
  fail('SCHEMA_JSON_INVALID', String(error));
  process.exit(1);
}

const requiredSkillTokens = [
  '/AGENTS.md',
  'CAPITAL-AI-DEEP-RESEARCH',
  'Provider-neutral capability boundary',
  'FACT',
  'INFERENCE',
  'ESTIMATE',
  'OPINION',
  'UNKNOWN',
  'Evidence saturation gate',
  'Prompt-injection resistance',
  'b238ab74c0daaf4b2a46a3cf9fffa5201367f6bc',
];
for (const token of requiredSkillTokens) {
  if (!skill.includes(token)) fail('SKILL_CONTRACT_MISSING', `Missing token: ${token}`);
}

const forbiddenSkillTokens = [
  'claude plugin add',
  'WebSearch(',
  'WebFetch(',
  '100+ sources',
  'CLAUDE.md remains',
];
for (const token of forbiddenSkillTokens) {
  if (skill.includes(token)) fail('PROVIDER_OR_QUOTA_LEAK', `Forbidden token: ${token}`);
}

if (schema.type !== 'object' || schema.additionalProperties !== false) {
  fail('SCHEMA_ROOT_NOT_STRICT', 'Root evidence bundle must be a strict object.');
}

const requiredRoot = ['researchId', 'mode', 'observedAt', 'claims', 'sources', 'evidence', 'saturation'];
for (const field of requiredRoot) {
  if (!schema.required?.includes(field)) fail('SCHEMA_REQUIRED_FIELD_MISSING', field);
}

const claimTypes = schema.$defs?.claim?.properties?.claimType?.enum ?? [];
for (const value of ['FACT', 'INFERENCE', 'ESTIMATE', 'OPINION', 'UNKNOWN']) {
  if (!claimTypes.includes(value)) fail('CLAIM_TYPE_MISSING', value);
}

const modes = schema.properties?.mode?.enum ?? [];
for (const value of ['QUICK', 'STANDARD', 'DEEP', 'DECISION_GRADE']) {
  if (!modes.includes(value)) fail('RESEARCH_MODE_MISSING', value);
}

const evidenceRequired = schema.$defs?.evidenceObject?.required ?? [];
for (const value of ['evidenceId', 'claimId', 'sourceId', 'stance', 'supportKind', 'validated']) {
  if (!evidenceRequired.includes(value)) fail('EVIDENCE_LINK_FIELD_MISSING', value);
}

const sourceRequired = schema.$defs?.source?.required ?? [];
if (!sourceRequired.includes('independenceFamily')) {
  fail('INDEPENDENCE_NOT_ENFORCED', 'source.independenceFamily is required for triangulation.');
}

if (!process.exitCode) {
  console.log('Deep Research skill structural validation: PASS');
}
