const DOC_PREFIXES = ['docs/', '.ai/'];
const GOVERNANCE_PREFIXES = ['docs/governance/', 'docs/adr/', '.ai/'];
const APPLICATION_PREFIXES = ['server/', 'src/', 'scripts/', 'tests/', 'supabase/'];

export function planChatGptSandboxChecks(changedFiles, options = {}) {
  const files = [...new Set((changedFiles ?? []).filter(Boolean))].sort();
  const full = options.full === true;
  const planned = [];
  const add = (script) => {
    if (!planned.includes(script)) planned.push(script);
  };

  if (files.some((file) => DOC_PREFIXES.some((prefix) => file.startsWith(prefix)))) {
    add('docs:hygiene:check');
  }
  if (files.some((file) => GOVERNANCE_PREFIXES.some((prefix) => file.startsWith(prefix)))) {
    add('governance:control-plane');
  }
  if (files.some((file) => file.startsWith('src/platform/Documentary/') || file.includes('DOCUMENTARY_MAINTENANCE'))) {
    add('documentary:maintenance:test');
  }
  if (files.some((file) => file.startsWith('src/platform/Vocabulary/') || file.includes('VOCABULARY_'))) {
    add('vocabulary:governance:check');
  }
  if (files.some((file) => APPLICATION_PREFIXES.some((prefix) => file.startsWith(prefix)) || file === 'package.json' || file === 'tsconfig.json')) {
    add('lint');
  }

  add('repository:quality:check');

  if (full) {
    add('test');
    add('build');
  }

  return Object.freeze({
    schemaVersion: 'chatgpt-sandbox-prepr/1.0.0',
    full,
    changedFiles: Object.freeze(files),
    scripts: Object.freeze(planned),
    networkInstallAllowed: false,
    repositoryMutationAllowed: false,
    mergeAuthority: false,
    hostedCiReplacement: false,
  });
}
