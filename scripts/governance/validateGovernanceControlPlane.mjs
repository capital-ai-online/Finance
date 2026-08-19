#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const warnings = [];

const rel = (...parts) => path.join(...parts);
const abs = (...parts) => path.join(root, ...parts);
const exists = (p) => fs.existsSync(abs(p));
const read = (p) => fs.readFileSync(abs(p), 'utf8');
const json = (p) => JSON.parse(read(p));

function fail(code, message) {
  errors.push({ code, message });
}

function warn(code, message) {
  warnings.push({ code, message });
}

function duplicates(values) {
  const seen = new Set();
  const dup = new Set();
  for (const value of values) {
    if (seen.has(value)) dup.add(value);
    seen.add(value);
  }
  return [...dup].sort();
}

function assertRequiredFile(file) {
  if (!exists(file)) fail('MISSING_REQUIRED_FILE', file);
}

const REQUIRED = [
  'AGENTS.md',
  'CLAUDE.md',
  '.github/copilot-instructions.md',
  'docs/governance/authority-registry.json',
  'docs/governance/control-catalog.json',
  'docs/adr/registry.json',
  'docs/governance/control-plane/README.md',
  'docs/governance/control-plane/STANDARDS_CROSSWALK.md',
  'docs/governance/control-plane/DOCUMENT_LIFECYCLE_POLICY.md',
  'docs/governance/control-plane/GOVERNANCE_CONTROL_PLANE_DIFF_IMPACT_2026-08-19.md',
  'docs/governance/control-plane/pre-pr-build-evidence.schema.json',
  'src/platform/Governance/README.md',
  'src/platform/Governance/manifest.json',
];

for (const file of REQUIRED) assertRequiredFile(file);

if (errors.length === 0) {
  const agents = read('AGENTS.md');
  const claude = read('CLAUDE.md');
  const copilot = read('.github/copilot-instructions.md');

  if (!agents.includes('AUTH-GOV-AGENT-TRUST-ROOT')) {
    fail('TRUST_ROOT_ID_MISSING', 'AGENTS.md must declare AUTH-GOV-AGENT-TRUST-ROOT.');
  }

  for (const [adapter, content] of [['CLAUDE.md', claude], ['.github/copilot-instructions.md', copilot]]) {
    if (!content.includes('AGENTS.md')) fail('ADAPTER_TRUST_ROOT_MISSING', `${adapter} must point to AGENTS.md.`);
    if (!/non-authoritative|no independent repository-wide governance authority/i.test(content)) {
      fail('ADAPTER_AUTHORITY_AMBIGUOUS', `${adapter} must declare itself non-authoritative.`);
    }
  }

  const authorityRegistry = json('docs/governance/authority-registry.json');
  const catalog = json('docs/governance/control-catalog.json');
  const adrRegistry = json('docs/adr/registry.json');

  const authorities = authorityRegistry.entries ?? [];
  const controls = catalog.controls ?? [];
  const adrs = adrRegistry.migratedRecords ?? [];

  for (const id of duplicates(authorities.map((item) => item.authorityId))) {
    fail('DUPLICATE_AUTHORITY_ID', id);
  }
  for (const id of duplicates(controls.map((item) => item.controlId))) {
    fail('DUPLICATE_CONTROL_ID', id);
  }
  for (const id of duplicates(adrs.filter((item) => !['superseded', 'historical', 'rejected'].includes(item.lifecycle)).map((item) => item.displayId))) {
    fail('DUPLICATE_ACTIVE_ADR_DISPLAY_ID', id);
  }
  for (const id of duplicates(adrs.map((item) => item.authorityId))) {
    fail('DUPLICATE_ADR_AUTHORITY_ID', id);
  }

  const authorityIds = new Set(authorities.map((item) => item.authorityId));
  const authorityById = new Map(authorities.map((item) => [item.authorityId, item]));

  for (const authority of authorities) {
    if (!/^AUTH-[A-Z0-9-]+$/.test(String(authority.authorityId ?? ''))) {
      fail('INVALID_AUTHORITY_ID', String(authority.authorityId));
    }
    if (!authority.path || !exists(authority.path)) {
      fail('AUTHORITY_TARGET_MISSING', `${authority.authorityId}: ${authority.path ?? '<missing path>'}`);
    }
    if (!/^\d+\.\d+\.\d+$/.test(String(authority.version ?? ''))) {
      fail('AUTHORITY_VERSION_INVALID', `${authority.authorityId}: ${authority.version ?? '<missing>'}`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(authority.date ?? ''))) {
      fail('AUTHORITY_DATE_INVALID', `${authority.authorityId}: ${authority.date ?? '<missing>'}`);
    }
  }

  const registryContracts = [
    {
      id: authorityRegistry.registryAuthorityId,
      declaredVersion: authorityRegistry.version,
      expectedPath: 'docs/governance/authority-registry.json',
      name: 'authority registry',
    },
    {
      id: catalog.catalogAuthorityId,
      declaredVersion: catalog.version,
      expectedPath: 'docs/governance/control-catalog.json',
      name: 'control catalog',
    },
    {
      id: adrRegistry.registryAuthorityId,
      declaredVersion: adrRegistry.version,
      expectedPath: 'docs/adr/registry.json',
      name: 'ADR registry',
    },
  ];

  for (const registry of registryContracts) {
    const authority = authorityById.get(registry.id);
    if (!authority) {
      fail('REGISTRY_AUTHORITY_UNRESOLVED', `${registry.name}: ${registry.id ?? '<missing>'}`);
      continue;
    }
    if (authority.path !== registry.expectedPath) {
      fail('REGISTRY_AUTHORITY_PATH_MISMATCH', `${registry.name}: ${authority.path} != ${registry.expectedPath}`);
    }
    if (authority.version !== registry.declaredVersion) {
      fail('REGISTRY_VERSION_MISMATCH', `${registry.name}: registry=${registry.declaredVersion}, authority=${authority.version}`);
    }
  }

  for (const control of controls) {
    if (!/^CTRL-[A-Z0-9-]+$/.test(String(control.controlId ?? ''))) {
      fail('INVALID_CONTROL_ID', String(control.controlId));
    }
    if (!['required', 'advisory', 'informational'].includes(control.status)) {
      fail('INVALID_CONTROL_STATUS', `${control.controlId}: ${control.status}`);
    }
    for (const authorityRef of control.authorityRefs ?? []) {
      if (!authorityIds.has(authorityRef)) {
        fail('UNRESOLVED_CONTROL_AUTHORITY', `${control.controlId}: ${authorityRef}`);
      }
    }
    for (const evidencePath of control.evidence ?? []) {
      if (evidencePath && !exists(evidencePath)) {
        fail('CONTROL_EVIDENCE_TARGET_MISSING', `${control.controlId}: ${evidencePath}`);
      }
    }
  }

  const m10Control = controls.find((item) => item.controlId === 'CTRL-CI-M10-001');
  if (!m10Control || !/suspended|off/i.test(String(m10Control.requirement ?? ''))) {
    fail('M10_TRANSITION_STATE_MISSING', 'CTRL-CI-M10-001 must explicitly preserve the current suspended/off state.');
  }

  for (const adr of adrs) {
    if (!authorityIds.has(adr.authorityId)) {
      fail('ADR_AUTHORITY_UNRESOLVED', `${adr.displayId}: ${adr.authorityId}`);
    }
    if (!adr.path || !exists(adr.path)) {
      fail('ADR_TARGET_MISSING', `${adr.displayId}: ${adr.path ?? '<missing path>'}`);
      continue;
    }
    const text = read(adr.path);
    if (!text.includes(adr.displayId)) {
      fail('ADR_DISPLAY_ID_MISMATCH', `${adr.path} does not contain ${adr.displayId}.`);
    }
    if (!/^AUTH-[A-Z0-9-]+$/.test(String(adr.authorityId ?? ''))) {
      fail('ADR_AUTHORITY_ID_INVALID', `${adr.displayId}: ${adr.authorityId}`);
    }
    if (!/^\d+\.\d+\.\d+$/.test(String(adr.version ?? ''))) {
      fail('ADR_VERSION_INVALID', `${adr.displayId}: ${adr.version}`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(adr.date ?? ''))) {
      fail('ADR_DATE_INVALID', `${adr.displayId}: ${adr.date}`);
    }
    const registeredAuthority = authorityById.get(adr.authorityId);
    if (registeredAuthority && registeredAuthority.path !== adr.path) {
      fail('ADR_AUTHORITY_PATH_MISMATCH', `${adr.displayId}: ADR registry=${adr.path}, authority registry=${registeredAuthority.path}`);
    }
    if (registeredAuthority && registeredAuthority.version !== adr.version) {
      fail('ADR_AUTHORITY_VERSION_MISMATCH', `${adr.displayId}: ADR registry=${adr.version}, authority registry=${registeredAuthority.version}`);
    }
  }

  const skillsDir = abs('.ai/skills');
  const essIds = [];
  if (fs.existsSync(skillsDir)) {
    for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const text = fs.readFileSync(path.join(skillsDir, entry.name), 'utf8');
      const match = text.match(/^\s*id:\s*(ESS-[A-Z0-9-]+)/m);
      if (match) essIds.push({ id: match[1], file: rel('.ai/skills', entry.name) });
    }
  }
  const duplicateEss = duplicates(essIds.map((item) => item.id));
  for (const id of duplicateEss) {
    const files = essIds.filter((item) => item.id === id).map((item) => item.file).join(', ');
    fail('DUPLICATE_ACTIVE_ESS_ID', `${id}: ${files}`);
  }

  const forbiddenLegacyPaths = [
    '.ai/skills/ESS-0012-Enterprise-Vocabulary-Terminology-Governance.md',
    'docs/adr/ADR-0085-privacy-governance-single-source-of-truth.md',
    'docs/adr/ADR-0086-governance-authority-supersession-and-regulatory-control-mapping.md',
  ];
  for (const file of forbiddenLegacyPaths) {
    if (exists(file)) fail('LEGACY_ACTIVE_COLLISION_REMAINS', file);
  }

  if (!exists('docs/archive/governance/superseded/ESS-0012-Enterprise-Vocabulary-Terminology-Governance.md')) {
    warn('ESS_LEGACY_ARCHIVE_MISSING', 'Expected superseded ESS-0012 vocabulary draft archive is missing.');
  }
}

for (const item of warnings) console.warn(`WARN ${item.code}: ${item.message}`);
for (const item of errors) console.error(`ERROR ${item.code}: ${item.message}`);

if (errors.length > 0) {
  console.error(`Governance control-plane validation failed with ${errors.length} error(s) and ${warnings.length} warning(s).`);
  process.exit(1);
}

console.log(`Governance control-plane validation passed with ${warnings.length} warning(s).`);
