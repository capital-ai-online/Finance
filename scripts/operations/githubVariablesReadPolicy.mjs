export function classifyGitHubVariablesReadStatus(repositoryVariable, organizationVariable) {
  const statuses = [repositoryVariable?.status, organizationVariable?.status];

  if (statuses.includes('BLOCKED')) {
    return Object.freeze({
      status: 'BLOCKED',
      exitCode: 2,
    });
  }

  if (statuses.includes('PASS')) {
    return Object.freeze({
      status: 'PASS',
      exitCode: 0,
    });
  }

  if (statuses.every((status) => status === 'NOT_CONFIGURED')) {
    return Object.freeze({
      status: 'NOT_CONFIGURED',
      exitCode: 0,
    });
  }

  throw new Error(
    `[PRIVATE-GITHUB-VARIABLES-READ] unsupported evidence state combination: ${statuses.join(',')}`,
  );
}
