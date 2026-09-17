#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { validateGovernanceRegistryRelations } from './controlPlaneRegistryRules.mjs';

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
  'README.md',
  'package.json',
  'docs/architecture/ROADMAP.md',
  'docs/governance/authority-registry.json',
  'docs/governance/control-catalog.json',
  'docs/governance/document-registry.json',
  'docs/adr/registry.json',
  '.ai/registry/ess-registry.json',
  'docs/governance/control-plane/README.md',
  'docs/governance/control-plane/STANDARDS_CROSSWALK.md',
  'docs/governance/control-plane/DOCUMENT_LIFECYCLE_POLICY.md',
  'docs/governance/control-plane/GOVERNANCE_CONTROL_PLANE_DIFF_IMPACT_2026-08-19.md',
  'docs/governance/control-plane/pre-pr-build-evidence.schema.json',
  'docs/frontend/FRONTEND_ARCH.md',
  'docs/frontend/COMPONENT_INVENTORY.md',
  'docs/frontend/FRONTEND_ROADMAP.md',
  'docs/adr/ADR-0005-frontend-module-integration.md',
  'src/platform/Governance/README.md',
  'src/platform/Governance/manifest.json',
  'src/platform/Documentary/Governance/Services/DocumentationHygieneValidator.ts',
  'src/platform/Release/Services/platformVersionControlPlane.ts',
  'src/platform/Release/Services/readmeVersionProjection.ts',
  'scripts/automation/validateDocumentationHygiene.ts',
  'scripts/automation/syncReadmeVersions.ts',
  'docs/adr/suspended/ADR-0004-branding-and-panel-removal.md',
  'docs/archive/governance/suspended/ESS-0004-Enterprise-Version-Manager.md',
];

for (const file of REQUIRED) assertRequiredFile(file);

for (const forbiddenInstructionMirror of ['CLAUDE.md', '.github/copilot-instructions.md']) {
  if (exists(forbiddenInstructionMirror)) {
    fail('PROVIDER_INSTRUCTION_MIRROR_PRESENT', `${forbiddenInstructionMirror} must remain absent; AGENTS.md is the sole repository instruction surface.`);
  }
}

if (exists('tests/unit/documentationHygiene.test.ts')) {
  fail('LEGACY_HYGIENE_TEST_PRESENT', 'tests/unit/documentationHygiene.test.ts must remain removed; documentation hygiene is enforced by the canonical service/CLI.');
}
if (exists('.ai/skills/ESS-0004-Enterprise-Version-Manager.md')) {
  fail('LEGACY_VERSION_MANAGER_ESS_ACTIVE', 'ESS-0004 must remain suspended/archived and absent from the active .ai/skills namespace.');
}
if (exists('docs/adr/ADR-0004-branding-and-panel-removal.md')) {
  fail('LEGACY_ADR_0004_ACTIVE', 'ADR-0004 must remain suspended under docs/adr/suspended/.');
}

if (errors.length === 0) {
  const agents = read('AGENTS.md');
  const readme = read('README.md');
  const packageJson = json('package.json');
  const currentVersion = String(packageJson.version ?? '');
  const currentRoadmap = read('docs/architecture/ROADMAP.md');

  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(currentVersion)) {
    fail('PLATFORM_VERSION_AUTHORITY_INVALID', `package.json#version must be strict SemVer: ${currentVersion || '<missing>'}`);
  }

  if (!agents.includes('AUTH-GOV-AGENT-TRUST-ROOT')) {
    fail('TRUST_ROOT_ID_MISSING', 'AGENTS.md must declare AUTH-GOV-AGENT-TRUST-ROOT.');
  }
  if (!/single repository-wide trust root and repository instruction surface/i.test(agents)) {
    fail('TRUST_ROOT_SURFACE_AMBIGUOUS', 'AGENTS.md must declare itself the single repository instruction surface.');
  }
  for (const forbiddenProductVersionMirror of ['package.json#version', 'Plattformversion:', 'Platform Version:']) {
    if (agents.includes(forbiddenProductVersionMirror)) {
      fail('AGENTS_PRODUCT_VERSION_MIRROR', `AGENTS.md must not mirror product-version authority: ${forbiddenProductVersionMirror}`);
    }
  }

  if (!readme.includes('README_VERSION_MATRIX:START') || !readme.includes('README_VERSION_MATRIX:END')) {
    fail('README_VERSION_PROJECTION_MISSING', 'README must contain deterministic managed version-matrix markers.');
  }
  if (!readme.includes('`package.json#version` ist die einzige Plattformversions-Authority')) {
    fail('README_VERSION_AUTHORITY_AMBIGUOUS', 'README must explicitly identify package.json#version as the sole platform-version authority.');
  }

  if (!currentRoadmap.includes('AUTH-GOV-DEVELOPMENT-CHAIN-STATUS')) {
    fail('CURRENT_ROADMAP_AUTHORITY_MISSING', 'docs/architecture/ROADMAP.md must declare its stable current-state authority ID.');
  }
  if (/Mandatory blockers before M10 reactivation/i.test(currentRoadmap)) {
    fail('CURRENT_ROADMAP_M10_REACTIVATION_BACKLOG_PRESENT', 'Retired M10 must not retain a current-state reactivation backlog.');
  }
  if (/Current enforced M10 state\s*[—-]\s*COMPLETE\s*\/\s*VERIFIED PASS/i.test(currentRoadmap)) {
    fail('CURRENT_ROADMAP_LEGACY_M10_ENFORCEMENT', 'Current-state roadmap must not present historical M10 VERIFIED PASS as current enforcement.');
  }
  if (!/DEVELOPMENT_CHAIN_ROADMAP\.md.*historical\/non-authorizing/i.test(currentRoadmap)) {
    fail('LEGACY_DEVELOPMENT_ROADMAP_NOT_CLASSIFIED', 'Current-state roadmap must classify the older DevelopmentChain roadmap as historical/non-authorizing.');
  }

  const versionRouter = read('src/platform/VersionManager/versionManager.ts');
  const versionAuthorityCompatibility = read('src/platform/VersionManager/platformVersionAuthority.ts');
  const versionControlPlane = read('src/platform/Release/Services/platformVersionControlPlane.ts');
  const releaseVersionGate = read('src/platform/Release/Services/releaseVersionGate.ts');
  const releaseVersion = read('scripts/automation/releaseVersion.ts');
  const routeComposition = read('server/routes/registerApplicationRoutes.ts');
  const versionManagerPanel = read('src/components/VersionManagerPanel.tsx');
  const runtimeGuard = read('server/runtime/runtimeArtifactGuard.mjs');
  const hygieneService = read('src/platform/Documentary/Governance/Services/DocumentationHygieneValidator.ts');

  if (!versionRouter.includes("versionManagerRouter.get('/version'")) {
    fail('VERSION_ROUTER_READ_PROJECTION_MISSING', 'VersionManager compatibility router must expose GET /version.');
  }
  if (/versionManagerRouter\.(post|put|patch|delete)\s*\(/.test(versionRouter)) {
    fail('VERSION_ROUTER_MUTATION_PRESENT', 'VersionManager compatibility router must be read-only.');
  }
  for (const forbiddenLegacyMarker of ['/version/bump', 'version_manager.json', 'executeEnterpriseEventChain', 'writeFileSync', 'ADR_DIR', 'generatedDocs', 'DEFAULT_STATE']) {
    if (versionRouter.includes(forbiddenLegacyMarker)) fail('LEGACY_VERSION_MANAGER_BEHAVIOR_PRESENT', forbiddenLegacyMarker);
  }
  if (!versionAuthorityCompatibility.includes("from '../Release/Services/platformVersionControlPlane'")) {
    fail('VERSION_AUTHORITY_COMPATIBILITY_DUPLICATED', 'VersionManager platformVersionAuthority must only re-export the Release control plane.');
  }
  if (!versionControlPlane.includes("PLATFORM_VERSION_AUTHORITY = 'package.json#version'")) {
    fail('VERSION_CONTROL_PLANE_AUTHORITY_MISSING', 'Release platform version control plane must bind to package.json#version.');
  }
  if (!versionControlPlane.includes('readOnly: true')) {
    fail('VERSION_CONTROL_PLANE_NOT_READ_ONLY', 'Projection service must mark its output read-only.');
  }
  if (/['"]AGENTS\.md['"]/.test(releaseVersionGate)) {
    fail('RELEASE_GATE_AGENTS_PRODUCT_MIRROR', 'Release Version Gate must not list AGENTS.md as a product-version file.');
  }
  if (!releaseVersionGate.includes("const DERIVED_PROJECTIONS = ['README.md']")) {
    fail('RELEASE_GATE_README_PROJECTION_MISSING', 'Release Version Gate must classify README as a derived projection/rollback artifact.');
  }
  for (const requiredReleaseGate of [
    "runGate('npm', ['run', 'readme:sync'])",
    "runGate('npm', ['run', 'readme:check'])",
    "runGate('npm', ['run', 'docs:hygiene:check'])",
    "runGate('npm', ['run', 'governance:control-plane'])",
  ]) {
    if (!releaseVersion.includes(requiredReleaseGate)) fail('RELEASE_STRUCTURAL_GATE_MISSING', requiredReleaseGate);
  }

  const mountCount = (routeComposition.match(/app\.use\('\/api\/admin',\s*versionManagerRouter\)/g) ?? []).length;
  if (mountCount !== 1) fail('VERSION_ROUTER_MOUNT_COUNT_INVALID', `Expected exactly one /api/admin VersionManager mount, found ${mountCount}.`);

  if (versionManagerPanel.includes('/api/admin/version/bump') || /performVersionBump|StepUpModal|isBumping/.test(versionManagerPanel)) {
    fail('VERSION_UI_MUTATION_PRESENT', 'VersionManagerPanel must be a read-only projection UI.');
  }

  if (/method\s*===\s*['"]GET['"]\s*&&\s*pathname\s*===\s*['"]\/api\/admin\/version['"]/.test(runtimeGuard)) {
    fail('RUNTIME_VERSION_GET_AUTHZ_BYPASS', 'Runtime guard must not intercept GET /api/admin/version before Express authorization.');
  }
  if (!runtimeGuard.includes("pathname === '/api/admin/version/bump'")) {
    fail('RUNTIME_LEGACY_VERSION_MUTATION_DENY_MISSING', 'Runtime guard must continue to fail closed on the retired version bump path.');
  }

  if (!hygieneService.includes("new Set(['README.md', 'AGENTS.md'])")) {
    fail('HYGIENE_ROOT_ALLOWLIST_INVALID', 'Documentation Hygiene root allowlist must contain only README.md and AGENTS.md.');
  }
  if (!hygieneService.includes("'suspended'")) {
    fail('HYGIENE_SUSPENDED_LIFECYCLE_MISSING', 'Documentation Hygiene must understand the suspended lifecycle.');
  }
  if (hygieneService.includes('CLAUDE.md')) {
    fail('HYGIENE_PROVIDER_MIRROR_ALLOWED', 'Documentation Hygiene must not allow CLAUDE.md as a root document.');
  }

  const suspendedAdr = read('docs/adr/suspended/ADR-0004-branding-and-panel-removal.md');
  const suspendedEss = read('docs/archive/governance/suspended/ESS-0004-Enterprise-Version-Manager.md');
  if (!/Status:\*?\*?\s*`?SUSPENDED`?/i.test(suspendedAdr)) {
    fail('ADR_0004_NOT_SUSPENDED', 'Archived ADR-0004 must be marked SUSPENDED.');
  }
  if (!/status:\s*Suspended/i.test(suspendedEss) && !/Status:\*?\*?\s*`?SUSPENDED`?/i.test(suspendedEss)) {
    fail('ESS_0004_NOT_SUSPENDED', 'Archived ESS-0004 must be marked SUSPENDED.');
  }

  const adr0096 = read('docs/adr/ADR-0096-governance-control-plane-authority-and-supersession.md');
  for (const scopeMarker of ['ADR-0014', 'ESS-0012', 'ESS-0004', 'package.json#version', 'Documentation-only']) {
    if (!adr0096.includes(scopeMarker)) fail('ADR_0096_SCOPE_SUPERSESSION_INCOMPLETE', `ADR-0096 must explicitly resolve ${scopeMarker}.`);
  }

  const adr0005Text = read('docs/adr/ADR-0005-frontend-module-integration.md');
  if (!/HISTORICAL\s*[—-]\s*NON-AUTHORIZING/i.test(adr0005Text)) {
    fail('ADR_0005_TEXT_LIFECYCLE_INVALID', 'ADR-0005 must be explicitly marked HISTORICAL — NON-AUTHORIZING.');
  }

  const authorityRegistry = json('docs/governance/authority-registry.json');
  const catalog = json('docs/governance/control-catalog.json');
  const documentRegistry = json('docs/governance/document-registry.json');
  const adrRegistry = json('docs/adr/registry.json');
  const essRegistry = json('.ai/registry/ess-registry.json');

  const authorities = authorityRegistry.entries ?? [];
  const controls = catalog.controls ?? [];
  const adrs = adrRegistry.migratedRecords ?? [];
  const inactiveAdrLifecycles = new Set(['superseded', 'historical', 'rejected', 'suspended']);
  const activeAdrs = adrs.filter((item) => !inactiveAdrLifecycles.has(item.lifecycle));

  for (const id of duplicates(authorities.map((item) => item.authorityId))) fail('DUPLICATE_AUTHORITY_ID', id);
  for (const id of duplicates(controls.map((item) => item.controlId))) fail('DUPLICATE_CONTROL_ID', id);
  for (const id of duplicates(activeAdrs.map((item) => item.displayId))) fail('DUPLICATE_ACTIVE_ADR_DISPLAY_ID', id);
  for (const id of duplicates(adrs.map((item) => item.authorityId))) fail('DUPLICATE_ADR_AUTHORITY_ID', id);

  for (const finding of validateGovernanceRegistryRelations({ authorityRegistry, adrRegistry, documentRegistry })) {
    fail(finding.code, finding.message);
  }

  const authorityIds = new Set(authorities.map((item) => item.authorityId));
  const authorityById = new Map(authorities.map((item) => [item.authorityId, item]));

  for (const authority of authorities) {
    if (!/^AUTH-[A-Z0-9-]+$/.test(String(authority.authorityId ?? ''))) fail('INVALID_AUTHORITY_ID', String(authority.authorityId));
    if (!authority.path || !exists(authority.path)) fail('AUTHORITY_TARGET_MISSING', `${authority.authorityId}: ${authority.path ?? '<missing path>'}`);
    if (!/^\d+\.\d+\.\d+$/.test(String(authority.version ?? ''))) fail('AUTHORITY_VERSION_INVALID', `${authority.authorityId}: ${authority.version ?? '<missing>'}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(authority.date ?? ''))) fail('AUTHORITY_DATE_INVALID', `${authority.authorityId}: ${authority.date ?? '<missing>'}`);
  }

  const registryContracts = [
    { id: authorityRegistry.registryAuthorityId, declaredVersion: authorityRegistry.version, expectedPath: 'docs/governance/authority-registry.json', name: 'authority registry' },
    { id: catalog.catalogAuthorityId, declaredVersion: catalog.version, expectedPath: 'docs/governance/control-catalog.json', name: 'control catalog' },
    { id: adrRegistry.registryAuthorityId, declaredVersion: adrRegistry.version, expectedPath: 'docs/adr/registry.json', name: 'ADR registry' },
  ];

  for (const registry of registryContracts) {
    const authority = authorityById.get(registry.id);
    if (!authority) {
      fail('REGISTRY_AUTHORITY_UNRESOLVED', `${registry.name}: ${registry.id ?? '<missing>'}`);
      continue;
    }
    if (authority.path !== registry.expectedPath) fail('REGISTRY_AUTHORITY_PATH_MISMATCH', `${registry.name}: ${authority.path} != ${registry.expectedPath}`);
    if (authority.version !== registry.declaredVersion) fail('REGISTRY_VERSION_MISMATCH', `${registry.name}: registry=${registry.declaredVersion}, authority=${authority.version}`);
  }

  for (const control of controls) {
    if (!/^CTRL-[A-Z0-9-]+$/.test(String(control.controlId ?? ''))) fail('INVALID_CONTROL_ID', String(control.controlId));
    if (!['required', 'advisory', 'informational'].includes(control.status)) fail('INVALID_CONTROL_STATUS', `${control.controlId}: ${control.status}`);
    for (const authorityRef of control.authorityRefs ?? []) {
      if (!authorityIds.has(authorityRef)) fail('UNRESOLVED_CONTROL_AUTHORITY', `${control.controlId}: ${authorityRef}`);
    }
    for (const evidencePath of control.evidence ?? []) {
      if (evidencePath && !exists(evidencePath)) fail('CONTROL_EVIDENCE_TARGET_MISSING', `${control.controlId}: ${evidencePath}`);
    }
  }

  const versionControl = controls.find((item) => item.controlId === 'CTRL-GOV-VERSION-001');
  if (!versionControl || !/package\.json#version/.test(String(versionControl.requirement ?? ''))) {
    fail('VERSION_AUTHORITY_CONTROL_MISSING', 'CTRL-GOV-VERSION-001 must identify package.json#version as the sole platform-version authority.');
  }

  const hygieneControl = controls.find((item) => item.controlId === 'CTRL-GOV-DOC-HYGIENE-001');
  if (!hygieneControl || !/read-only/i.test(String(hygieneControl.requirement ?? ''))) {
    fail('DOCUMENTARY_HYGIENE_CONTROL_MISSING', 'CTRL-GOV-DOC-HYGIENE-001 must bind hygiene to a read-only Documentary service.');
  }

  const documentRoleControl = controls.find((item) => item.controlId === 'CTRL-GOV-DOC-ROLE-001');
  if (!documentRoleControl || !/non-normative/i.test(String(documentRoleControl.requirement ?? ''))) {
    fail('DOCUMENT_ROLE_CONTROL_MISSING', 'CTRL-GOV-DOC-ROLE-001 must enforce non-normative inventory/roadmap roles.');
  }

  const reservationControl = controls.find((item) => item.controlId === 'CTRL-GOV-ADR-RESERVATION-001');
  if (!reservationControl || !/live GitHub/i.test(String(reservationControl.requirement ?? ''))) {
    fail('ADR_RESERVATION_CONTROL_MISSING', 'CTRL-GOV-ADR-RESERVATION-001 must keep deterministic CI independent of live GitHub access.');
  }

  const m10Control = controls.find((item) => item.controlId === 'CTRL-CI-M10-001');
  const m10Requirement = String(m10Control?.requirement ?? '');
  if (!m10Control || m10Control.status !== 'required') {
    fail('M10_CONTROL_CONTRACT_INVALID', 'CTRL-CI-M10-001 must exist as a required structured control.');
  } else {
    for (const requiredAuthority of [
      'AUTH-GOV-AGENT-TRUST-ROOT',
      'AUTH-GOV-HUMAN-OWNER-PR-APPROVAL',
      'AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION',
    ]) {
      if (!(m10Control.authorityRefs ?? []).includes(requiredAuthority)) {
        fail('M10_CONTROL_AUTHORITY_REF_MISSING', `CTRL-CI-M10-001 must reference ${requiredAuthority}.`);
      }
    }
  }
  if (!m10Control || !/retired/i.test(m10Requirement) || !/PR #691/i.test(m10Requirement)) {
    fail('M10_RETIRED_STATE_MISSING', 'CTRL-CI-M10-001 must bind productive M10 retirement to Human Merge of PR #691.');
  }
  if (!/MUST NOT search/i.test(m10Requirement) || !/absence of a productive M10 implementation as a gap/i.test(m10Requirement)) {
    fail('M10_DISCOVERY_BOUNDARY_MISSING', 'CTRL-CI-M10-001 must prohibit current-state M10 implementation discovery/gap reporting.');
  }
  if (/reactivation requires|before reactivation/i.test(m10Requirement)) {
    fail('M10_REACTIVATION_BACKLOG_PRESENT', 'CTRL-CI-M10-001 must not retain a current-state M10 reactivation prerequisite backlog.');
  }

  const adr0104 = adrs.find((item) => item.displayId === 'ADR-0104');
  if (!adr0104 || adr0104.version !== '1.5.0') {
    fail('ADR_0104_PROJECT_SET_VERSION_MISSING', 'ADR-0104 registry must project the accepted bounded project-set authority as v1.5.0.');
  } else {
    const scope = adr0104.supersessionScope;
    const projectSet = adr0104.projectSetPolicy;
    const inSetSwitchTarget = scope?.targets?.find((target) =>
      target.controls?.includes('IN_SET_PROJECT_SWITCH')
    );
    if (!scope || scope.type !== 'conditional-partial') {
      fail('ADR_0104_SUPERSESSION_SCOPE_MISSING', 'ADR-0104 supersession metadata must be conditional-partial.');
    }
    if (!Array.isArray(scope?.targets) || scope.targets.length === 0 || !Array.isArray(scope?.exclusions) || scope.exclusions.length === 0) {
      fail('ADR_0104_SUPERSESSION_SCOPE_INCOMPLETE', 'ADR-0104 scoped supersession must identify targets and exclusions.');
    }
    if (!inSetSwitchTarget) {
      fail('ADR_0104_IN_SET_SWITCH_TARGET_MISSING', 'ADR-0104 v1.5 must name the bounded IN_SET_PROJECT_SWITCH approval surface without restoring withdrawn handoff overlays.');
    }
    if (!scope?.exclusions?.includes('CTRL-MERGE-HUMAN-001')) {
      fail('ADR_0104_SUPERSESSION_EXCLUSIONS_INCOMPLETE', 'ADR-0104 must explicitly preserve the Human merge boundary.');
    }
    if ((scope?.exclusions ?? []).some((item) => /CHAT_RUN|POST_PR|HANDOFF/i.test(String(item)))) {
      fail('ADR_0104_RETIRED_CHAT_CONTINUATION_PRESENT', 'ADR-0104 supersession metadata must not preserve retired chat-continuation mechanisms.');
    }
    if (projectSet?.mode !== 'immutable-predeclared-bounded-set' || projectSet?.minProjects !== 1 || projectSet?.maxProjects !== 3 || projectSet?.runtimeProjectAdditionAllowed !== false || projectSet?.canonicalMappingRequired !== true) {
      fail('ADR_0104_PROJECT_SET_POLICY_INVALID', 'ADR-0104 must bind an immutable predeclared project set of one to three projects, require canonical mapping and prohibit runtime additions.');
    }
    const navigation = projectSet?.humanReadableNavigation;
    if (!Array.isArray(navigation) || navigation.join('|') !== 'docs/projects/PROJECT_VALUE_CHAIN.md|docs/projects/<project>/ROADMAP.md|applicable ADR|applicable ESS') {
      fail('ADR_0104_NAVIGATION_INVALID', 'ADR-0104 v1.5 must use the Human-readable PVC → project Roadmap → ADR → ESS navigation model.');
    }
    const slots = projectSet?.slots;
    if (slots?.['ADR-0104-S1'] !== 'CONSUMED' || slots?.['ADR-0104-S2'] !== 'CONSUMED' || slots?.['ADR-0104-S3'] !== 'AVAILABLE') {
      fail('ADR_0104_SLOT_LEDGER_INVALID', 'ADR-0104 v1.5 registry must project S1/S2 consumed and S3 available.');
    }
  }

  for (const adr of adrs) {
    if (!authorityIds.has(adr.authorityId)) fail('ADR_AUTHORITY_UNRESOLVED', `${adr.displayId}: ${adr.authorityId}`);
    if (!adr.path || !exists(adr.path)) {
      fail('ADR_TARGET_MISSING', `${adr.displayId}: ${adr.path ?? '<missing path>'}`);
      continue;
    }
    const text = read(adr.path);
    if (!text.includes(adr.displayId)) fail('ADR_DISPLAY_ID_MISMATCH', `${adr.path} does not contain ${adr.displayId}.`);
    if (!/^AUTH-[A-Z0-9-]+$/.test(String(adr.authorityId ?? ''))) fail('ADR_AUTHORITY_ID_INVALID', `${adr.displayId}: ${adr.authorityId}`);
    if (!/^\d+\.\d+\.\d+$/.test(String(adr.version ?? ''))) fail('ADR_VERSION_INVALID', `${adr.displayId}: ${adr.version}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(adr.date ?? ''))) fail('ADR_DATE_INVALID', `${adr.displayId}: ${adr.date}`);

    const registeredAuthority = authorityById.get(adr.authorityId);
    if (registeredAuthority && registeredAuthority.path !== adr.path) fail('ADR_AUTHORITY_PATH_MISMATCH', `${adr.displayId}: ADR registry=${adr.path}, authority registry=${registeredAuthority.path}`);
    if (registeredAuthority && registeredAuthority.version !== adr.version) fail('ADR_AUTHORITY_VERSION_MISMATCH', `${adr.displayId}: ADR registry=${adr.version}, authority registry=${registeredAuthority.version}`);
    if (adr.lifecycle === 'suspended' && registeredAuthority && registeredAuthority.lifecycle !== 'suspended') {
      fail('SUSPENDED_ADR_AUTHORITY_LIFECYCLE_MISMATCH', `${adr.displayId}: ADR registry is suspended but authority registry is ${registeredAuthority.lifecycle}.`);
    }

    for (const alias of adr.legacyAliases ?? []) {
      if (!alias.path) continue;
      if (!exists(alias.path)) {
        fail('ADR_LEGACY_REDIRECT_MISSING', `${adr.displayId}: ${alias.path}`);
        continue;
      }
      const redirect = read(alias.path);
      if (!/Legacy ADR Redirect\s*[—-]\s*NON-AUTHORIZING/i.test(redirect)) fail('ADR_LEGACY_REDIRECT_NOT_MARKED', `${adr.displayId}: ${alias.path}`);
      if (!redirect.includes(adr.authorityId) || !redirect.includes(adr.path)) fail('ADR_LEGACY_REDIRECT_TARGET_MISMATCH', `${adr.displayId}: ${alias.path}`);
    }
  }

  const adr0094 = adrs.find((item) => item.displayId === 'ADR-0094');
  if (!adr0094 || adr0094.lifecycle !== 'accepted' || adr0094.authorityId !== 'AUTH-ADR-OPEN-SOURCE-MEDIA-RENDERING-2026-08-19') {
    fail('ADR_0094_MERGED_STATE_NOT_REGISTERED', 'Merged ADR-0094 from PR #446 must be registered as accepted with its stable authority ID.');
  }

  const ess0004 = (essRegistry.entries ?? []).find((item) => item.id === 'ESS-0004');
  if (!ess0004 || String(ess0004.status).toLowerCase() !== 'suspended') {
    fail('ESS_0004_REGISTRY_NOT_SUSPENDED', 'ESS registry must mark ESS-0004 suspended.');
  }
  if (ess0004?.document !== 'docs/archive/governance/suspended/ESS-0004-Enterprise-Version-Manager.md') {
    fail('ESS_0004_ARCHIVE_PATH_INVALID', String(ess0004?.document));
  }

  const ess0012 = (essRegistry.entries ?? []).find((item) => item.id === 'ESS-0012');
  if (!ess0012 || !/documentation-only/i.test(String(ess0012.scope ?? ess0012.rationale ?? ''))) {
    fail('ESS_0012_SCOPE_AMBIGUOUS', 'ESS-0012 registry metadata must explicitly restrict it to documentation-only governance.');
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
  for (const id of duplicates(essIds.map((item) => item.id))) {
    const files = essIds.filter((item) => item.id === id).map((item) => item.file).join(', ');
    fail('DUPLICATE_ACTIVE_ESS_ID', `${id}: ${files}`);
  }

  const forbiddenActiveLegacySkill = '.ai/skills/ESS-0012-Enterprise-Version-Manager.md';
  if (exists(forbiddenActiveLegacySkill)) fail('LEGACY_ACTIVE_ESS_COLLISION_REMAINS', forbiddenActiveLegacySkill);

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