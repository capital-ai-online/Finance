#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateProjectValueChain } from './validateProjectValueChain.mjs';

const DIRECTIVE_FILES = [
  'docs/projects/PROJECT_EXECUTION_DIRECTIVE_01_AUTHORITY.yaml',
  'docs/projects/PROJECT_EXECUTION_DIRECTIVE_02_POST_MERGE.yaml',
  'docs/projects/PROJECT_EXECUTION_DIRECTIVE_03_IDLE_PVC.yaml',
];

const BINDINGS = {
  validator: 'scripts/governance/validateProjectExecutionDirective.mjs',
  workflow: '.github/workflows/project-execution-directive.yml',
  documentation: 'docs/projects/PROJECT_EXECUTION_DIRECTIVE_IMPLEMENTATION.md',
};

function parseScalar(raw) {
  const value = String(raw ?? '').trim();
  if (value === '') return '';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '~') return null;
  if (/^-?\d+$/.test(value)) return Number(value);
  if (value.startsWith('"') && value.endsWith('"')) return JSON.parse(value);
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'");
  return value;
}

function meaningfulLines(text) {
  return String(text)
    .split(/\r?\n/)
    .map((raw, index) => {
      const match = raw.match(/^(\s*)(.*)$/);
      return {
        index,
        indent: match ? match[1].replace(/\t/g, '  ').length : 0,
        content: match ? match[2].trim() : '',
      };
    })
    .filter((line) => line.content && !line.content.startsWith('#'));
}

export function parseProjectionYaml(text) {
  const lines = meaningfulLines(text);
  const root = {};
  const stack = [{ indent: -1, value: root }];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    while (stack.length > 1 && stack[stack.length - 1].indent >= line.indent) stack.pop();
    const parent = stack[stack.length - 1].value;

    if (line.content.startsWith('- ')) {
      if (!Array.isArray(parent)) throw new Error(`line ${line.index + 1}: sequence item has no array parent`);
      parent.push(parseScalar(line.content.slice(2)));
      continue;
    }

    const match = line.content.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!match) throw new Error(`line ${line.index + 1}: unsupported YAML syntax`);
    if (Array.isArray(parent)) throw new Error(`line ${line.index + 1}: mapping entry has array parent`);

    const [, key, rawValue = ''] = match;
    if (rawValue !== '') {
      parent[key] = parseScalar(rawValue);
      continue;
    }

    const next = lines[i + 1];
    const child = next && next.indent > line.indent && next.content.startsWith('- ') ? [] : {};
    parent[key] = child;
    stack.push({ indent: line.indent, value: child });
  }

  return root;
}

function at(value, dottedPath) {
  return dottedPath.split('.').reduce((current, key) => current?.[key], value);
}

function push(errors, code, message) {
  errors.push({ code, message });
}

function expectEqual(errors, value, dottedPath, expected, code) {
  const observed = at(value, dottedPath);
  if (observed !== expected) push(errors, code, `${dottedPath}: expected ${JSON.stringify(expected)}, observed ${JSON.stringify(observed)}`);
}

function expectArrayExact(errors, value, dottedPath, expected, code) {
  const observed = at(value, dottedPath);
  if (!Array.isArray(observed) || JSON.stringify(observed) !== JSON.stringify(expected)) {
    push(errors, code, `${dottedPath}: expected ${JSON.stringify(expected)}, observed ${JSON.stringify(observed)}`);
  }
}

function expectArrayContains(errors, value, dottedPath, expectedItems, code) {
  const observed = at(value, dottedPath);
  if (!Array.isArray(observed)) {
    push(errors, code, `${dottedPath}: expected array`);
    return;
  }
  const missing = expectedItems.filter((item) => !observed.includes(item));
  if (missing.length) push(errors, code, `${dottedPath}: missing ${missing.join(', ')}`);
}

export function validateProjectionContracts({ part1, part2, part3 }) {
  const errors = [];

  expectEqual(errors, part1, 'schema_version', '1.0.0', 'AUTH_SCHEMA_VERSION_INVALID');
  expectEqual(errors, part1, 'projection_id', 'CAPITAL-AI-PROJECT-EXECUTION-DIRECTIVE-01', 'AUTH_PROJECTION_ID_INVALID');
  expectEqual(errors, part1, 'part', '1/3', 'AUTH_PART_INVALID');
  expectEqual(errors, part1, 'status', 'NON_AUTHORIZING_PROJECTION', 'AUTH_STATUS_INVALID');
  expectEqual(errors, part1, 'authority.sole_execution_authority', '/AGENTS.md@CURRENT_MAIN', 'AUTH_TRUST_ROOT_INVALID');
  expectEqual(errors, part1, 'authority.normative_section', '4', 'AUTH_SECTION_INVALID');
  expectEqual(errors, part1, 'authority.precedence', 'AGENTS_WINS', 'AUTH_PRECEDENCE_INVALID');
  expectEqual(errors, part1, 'authority.may_create_authority', false, 'AUTH_CREATION_MUST_BE_FALSE');
  expectEqual(errors, part1, 'authority.may_transfer_ownership', false, 'AUTH_TRANSFER_MUST_BE_FALSE');
  expectEqual(errors, part1, 'applicability.resolver', 'ALL_CANONICAL_PROJECT_FOLDERS', 'AUTH_PROJECT_RESOLVER_INVALID');
  expectEqual(errors, part1, 'applicability.source', 'docs/projects/README.md@CURRENT_MAIN', 'AUTH_PROJECT_SOURCE_INVALID');
  expectEqual(errors, part1, 'applicability.include_new_canonical_projects_automatically', true, 'AUTH_DYNAMIC_PROJECT_SCOPE_INVALID');
  expectEqual(errors, part1, 'applicability.per_project_copy_required', false, 'AUTH_COPY_POLICY_INVALID');
  expectEqual(errors, part1, 'routing.primary_owner_source', 'docs/projects/PROJECT_VALUE_CHAIN.md@CURRENT_MAIN', 'AUTH_OWNER_SOURCE_INVALID');
  expectEqual(errors, part1, 'routing.project_folder_source', 'docs/projects/README.md@CURRENT_MAIN', 'AUTH_FOLDER_SOURCE_INVALID');
  expectEqual(errors, part1, 'routing.foreign_work_behavior', 'OWNER_CORRECT_HANDOVER', 'AUTH_FOREIGN_WORK_INVALID');
  expectEqual(errors, part1, 'routing.historical_state_behavior', 'EVIDENCE_ONLY', 'AUTH_HISTORICAL_STATE_INVALID');
  expectEqual(errors, part1, 'implementation_bindings.validator', BINDINGS.validator, 'AUTH_VALIDATOR_BINDING_INVALID');
  expectEqual(errors, part1, 'implementation_bindings.workflow', BINDINGS.workflow, 'AUTH_WORKFLOW_BINDING_INVALID');
  expectEqual(errors, part1, 'implementation_bindings.documentation', BINDINGS.documentation, 'AUTH_DOCUMENTATION_BINDING_INVALID');
  expectEqual(errors, part1, 'implementation_bindings.mode', 'READ_ONLY_FAIL_CLOSED_VALIDATION', 'AUTH_IMPLEMENTATION_MODE_INVALID');
  expectEqual(errors, part1, 'implementation_bindings.authority_source', '/AGENTS.md@CURRENT_MAIN', 'AUTH_IMPLEMENTATION_AUTHORITY_INVALID');
  expectEqual(errors, part1, 'implementation_bindings.may_mutate_repository', false, 'AUTH_IMPLEMENTATION_MUTATION_INVALID');

  expectEqual(errors, part2, 'schema_version', '1.0.0', 'POST_MERGE_SCHEMA_VERSION_INVALID');
  expectEqual(errors, part2, 'projection_id', 'CAPITAL-AI-PROJECT-EXECUTION-DIRECTIVE-02', 'POST_MERGE_PROJECTION_ID_INVALID');
  expectEqual(errors, part2, 'part', '2/3', 'POST_MERGE_PART_INVALID');
  expectEqual(errors, part2, 'status', 'NON_AUTHORIZING_PROJECTION', 'POST_MERGE_STATUS_INVALID');
  expectEqual(errors, part2, 'authority_ref.file', '/AGENTS.md@CURRENT_MAIN', 'POST_MERGE_AUTHORITY_INVALID');
  expectEqual(errors, part2, 'authority_ref.section', '4', 'POST_MERGE_SECTION_INVALID');
  expectEqual(errors, part2, 'trigger.event', 'HUMAN_OWNER_MERGE', 'POST_MERGE_TRIGGER_INVALID');
  expectArrayExact(errors, part2, 'required_sequence', [
    'READ_CURRENT_MAIN',
    'VERIFY_MERGED_OUTCOME',
    'RECONCILE_EXIT_EVIDENCE',
    'RECONCILE_ROADMAP_AND_WORK_PACKAGE',
    'RESOLVE_NEXT_CANONICAL_WORK_ITEM',
    'VERIFY_OWNER_DEPENDENCIES_BLOCKERS',
    'CONTINUE_DIRECTLY_IF_ELIGIBLE',
  ], 'POST_MERGE_SEQUENCE_INVALID');
  expectEqual(errors, part2, 'continuation.additional_chat_prompt_required', false, 'POST_MERGE_CHAT_PROMPT_INVALID');
  expectEqual(errors, part2, 'continuation.merge_is_idle_boundary', false, 'POST_MERGE_IDLE_BOUNDARY_INVALID');
  for (const field of ['canonical_identity_required', 'owner_correct', 'dependency_ready', 'blocker_free', 'within_resolved_scope']) {
    expectEqual(errors, part2, `continuation.allowed_next_item.${field}`, true, 'POST_MERGE_NEXT_ITEM_GATE_INVALID');
  }
  expectArrayContains(errors, part2, 'continuation.forbidden', [
    'REVIVE_CLOSED_OR_SUPERSEDED_WORK',
    'USE_STALE_BRANCH_STATE_AS_AUTHORITY',
    'BYPASS_HUMAN_OR_CODEOWNER_GATE',
    'TRANSFER_PRODUCTIVE_PVC_OWNERSHIP',
  ], 'POST_MERGE_FORBIDDEN_SET_INVALID');
  expectArrayContains(errors, part2, 'evidence.required', [
    'current_main_sha',
    'merged_pr_or_work_item',
    'exit_evidence',
    'reconciled_work_package_state',
    'next_step_identity_or_idle_transition',
  ], 'POST_MERGE_EVIDENCE_SET_INVALID');

  expectEqual(errors, part3, 'schema_version', '1.0.0', 'IDLE_SCHEMA_VERSION_INVALID');
  expectEqual(errors, part3, 'projection_id', 'CAPITAL-AI-PROJECT-EXECUTION-DIRECTIVE-03', 'IDLE_PROJECTION_ID_INVALID');
  expectEqual(errors, part3, 'part', '3/3', 'IDLE_PART_INVALID');
  expectEqual(errors, part3, 'status', 'NON_AUTHORIZING_PROJECTION', 'IDLE_STATUS_INVALID');
  expectEqual(errors, part3, 'authority_ref.file', '/AGENTS.md@CURRENT_MAIN', 'IDLE_AUTHORITY_INVALID');
  expectEqual(errors, part3, 'authority_ref.section', '4', 'IDLE_SECTION_INVALID');
  expectEqual(errors, part3, 'idle_entry.action', 'THREE_PVC_REVIEW', 'IDLE_ACTION_INVALID');
  expectEqual(errors, part3, 'pvc_review.count', 3, 'IDLE_PVC_COUNT_INVALID');
  expectEqual(errors, part3, 'pvc_review.source', 'docs/projects/PROJECT_VALUE_CHAIN.md@CURRENT_MAIN', 'IDLE_PVC_SOURCE_INVALID');
  expectEqual(errors, part3, 'pvc_review.ownership_transfer', false, 'IDLE_OWNERSHIP_TRANSFER_INVALID');
  expectArrayContains(errors, part3, 'pvc_review.required_fields', [
    'pvc_id',
    'primary_owner',
    'current_state',
    'evidence_state',
    'findings',
    'risks',
    'dependencies',
    'owner_correct_handover_if_required',
  ], 'IDLE_REPORT_FIELDS_INVALID');
  expectEqual(errors, part3, 'deduplication.required', true, 'IDLE_DEDUP_REQUIRED_INVALID');
  expectArrayContains(errors, part3, 'deduplication.compare_against', [
    'CURRENT_MAIN',
    'canonical project Roadmap',
    'active work packages',
    'open Pull Requests',
    '.ai/work-claims',
    'already resolved findings',
  ], 'IDLE_DEDUP_SOURCES_INVALID');
  expectEqual(errors, part3, 'work_package_derivation.required_when', 'fresh evidence-backed actionable follow-up exists', 'IDLE_WORK_PACKAGE_TRIGGER_INVALID');
  expectEqual(errors, part3, 'work_package_derivation.continue_after_creation', true, 'IDLE_CONTINUATION_INVALID');
  expectEqual(errors, part3, 'work_package_derivation.no_action_behavior.state', 'NO_ACTIONABLE_FINDING', 'IDLE_NO_ACTION_STATE_INVALID');
  expectEqual(errors, part3, 'work_package_derivation.no_action_behavior.create_artificial_mutation', false, 'IDLE_ARTIFICIAL_MUTATION_INVALID');
  expectArrayContains(errors, part3, 'guardrails', [
    'Do not fabricate defects or evidence.',
    'Do not duplicate active work.',
    'Foreign-owner findings become handovers, not local implementation.',
    'Security, Compliance, Human and CODEOWNER gates remain fail-closed.',
    'The YAML projection never overrides /AGENTS.md@CURRENT_MAIN.',
  ], 'IDLE_GUARDRAILS_INVALID');

  return errors;
}

function walkDirectiveCopies(projectsRoot) {
  const findings = [];
  for (const entry of fs.readdirSync(projectsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const queue = [path.join(projectsRoot, entry.name)];
    while (queue.length) {
      const current = queue.shift();
      for (const child of fs.readdirSync(current, { withFileTypes: true })) {
        const target = path.join(current, child.name);
        if (child.isDirectory()) queue.push(target);
        if (child.isFile() && /^PROJECT_EXECUTION_DIRECTIVE.*\.ya?ml$/i.test(child.name)) findings.push(target);
      }
    }
  }
  return findings;
}

export function validateProjectExecutionDirective({ root = process.cwd() } = {}) {
  const resolvedRoot = path.resolve(root);
  const errors = [];
  const warnings = [];
  const read = (relative) => fs.readFileSync(path.join(resolvedRoot, relative), 'utf8');
  const exists = (relative) => fs.existsSync(path.join(resolvedRoot, relative));

  for (const file of [...DIRECTIVE_FILES, 'AGENTS.md', 'docs/projects/README.md', 'docs/projects/PROJECT_VALUE_CHAIN.md', ...Object.values(BINDINGS)]) {
    if (!exists(file)) push(errors, 'DIRECTIVE_REQUIRED_FILE_MISSING', file);
  }
  if (errors.length) return { ok: false, errors, warnings, summary: null };

  let parts;
  try {
    parts = DIRECTIVE_FILES.map((file) => parseProjectionYaml(read(file)));
  } catch (error) {
    push(errors, 'DIRECTIVE_YAML_PARSE_FAILED', error instanceof Error ? error.message : String(error));
    return { ok: false, errors, warnings, summary: null };
  }

  errors.push(...validateProjectionContracts({ part1: parts[0], part2: parts[1], part3: parts[2] }));

  const agents = read('AGENTS.md');
  const authorityMarkers = [
    [/single repository-wide trust root and repository instruction surface/i, 'AGENTS_SINGLE_AUTHORITY_MISSING'],
    [/After a Human Owner merge of a work item that belongs to the current active work package/i, 'AGENTS_POST_MERGE_RULE_MISSING'],
    [/without requiring a second chat prompt/i, 'AGENTS_DIRECT_CONTINUATION_MISSING'],
    [/exactly three PVC units/i, 'AGENTS_THREE_PVC_RULE_MISSING'],
    [/deduplicate findings against current Roadmaps\/work packages, open Pull Requests, work claims/i, 'AGENTS_IDLE_DEDUP_RULE_MISSING'],
    [/derive one bounded follow-up work package/i, 'AGENTS_IDLE_WORK_PACKAGE_RULE_MISSING'],
    [/NO_ACTIONABLE_FINDING/i, 'AGENTS_NO_ACTION_RULE_MISSING'],
    [/foreign-owner findings become handovers rather than local implementation/i, 'AGENTS_FOREIGN_OWNER_BOUNDARY_MISSING'],
  ];
  for (const [pattern, code] of authorityMarkers) {
    if (!pattern.test(agents)) push(errors, code, `AGENTS.md does not contain required Section 4 semantics: ${pattern}`);
  }

  const pvcValidation = validateProjectValueChain({ root: resolvedRoot });
  if (!pvcValidation.ok) {
    for (const finding of pvcValidation.errors) push(errors, 'PROJECT_VALUE_CHAIN_INVALID', finding);
  }

  const rootDirectiveFiles = fs.readdirSync(path.join(resolvedRoot, 'docs/projects'))
    .filter((name) => /^PROJECT_EXECUTION_DIRECTIVE_0[123]_[A-Z0-9_]+\.yaml$/.test(name))
    .sort();
  const expectedRootFiles = DIRECTIVE_FILES.map((file) => path.basename(file)).sort();
  if (JSON.stringify(rootDirectiveFiles) !== JSON.stringify(expectedRootFiles)) {
    push(errors, 'DIRECTIVE_ROOT_SET_INVALID', `expected exactly ${expectedRootFiles.join(', ')}; observed ${rootDirectiveFiles.join(', ')}`);
  }

  const duplicateCopies = walkDirectiveCopies(path.join(resolvedRoot, 'docs/projects'))
    .map((file) => path.relative(resolvedRoot, file).split(path.sep).join('/'));
  if (duplicateCopies.length) {
    push(errors, 'PROJECT_LOCAL_DIRECTIVE_COPY_PRESENT', duplicateCopies.join(', '));
  }

  const workflow = read(BINDINGS.workflow);
  if (!/permissions:\s*\n\s+contents:\s*read\b/.test(workflow)) {
    push(errors, 'DIRECTIVE_WORKFLOW_PERMISSIONS_INVALID', 'workflow must declare contents: read');
  }
  if (/\b(?:contents|issues|pull-requests|actions|id-token):\s*write\b/.test(workflow)) {
    push(errors, 'DIRECTIVE_WORKFLOW_WRITE_PERMISSION_PRESENT', 'directive validation workflow must remain read-only');
  }
  for (const command of [
    'node scripts/governance/validateProjectExecutionDirective.mjs',
    'node --test scripts/governance/validateProjectExecutionDirective.test.mjs',
  ]) {
    if (!workflow.includes(command)) push(errors, 'DIRECTIVE_WORKFLOW_COMMAND_MISSING', command);
  }
  for (const scopeMarker of ['AGENTS.md', 'docs/projects/**', 'scripts/governance/validateProjectExecutionDirective.mjs']) {
    if (!workflow.includes(scopeMarker)) push(errors, 'DIRECTIVE_WORKFLOW_SCOPE_MISSING', scopeMarker);
  }

  const documentation = read(BINDINGS.documentation);
  if (!documentation.includes('NON-AUTHORIZING IMPLEMENTATION DOCUMENTATION')) {
    push(errors, 'DIRECTIVE_DOCUMENTATION_ROLE_INVALID', 'implementation documentation must be explicitly non-authorizing');
  }
  if (!documentation.includes('/AGENTS.md@CURRENT_MAIN')) {
    push(errors, 'DIRECTIVE_DOCUMENTATION_AUTHORITY_REF_MISSING', 'implementation documentation must resolve to /AGENTS.md@CURRENT_MAIN');
  }

  const summary = {
    directiveParts: 3,
    projectFolders: pvcValidation.summary?.projectFolders ?? null,
    pvcStages: pvcValidation.summary?.pvcStages ?? null,
    idleReviewCount: parts[2]?.pvc_review?.count ?? null,
    mode: parts[0]?.implementation_bindings?.mode ?? null,
  };

  return { ok: errors.length === 0, errors, warnings, summary };
}

export function formatProjectExecutionDirectiveValidation(result) {
  if (!result.ok) {
    return [
      `[project-execution-directive] FAIL (${result.errors.length} finding${result.errors.length === 1 ? '' : 's'})`,
      ...result.errors.map((item) => `- ${item.code}: ${item.message}`),
    ].join('\n');
  }
  const summary = result.summary;
  return `[project-execution-directive] PASS: ${summary.directiveParts} projections, ${summary.projectFolders} canonical project folders, ${summary.pvcStages} PVC stages, idle review count=${summary.idleReviewCount}, mode=${summary.mode}.`;
}

const isDirectExecution = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectExecution) {
  const result = validateProjectExecutionDirective();
  const formatted = formatProjectExecutionDirectiveValidation(result);
  if (result.ok) console.log(formatted);
  else {
    console.error(formatted);
    process.exitCode = 1;
  }
}
