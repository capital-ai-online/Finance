// ADR-0036 — immutable production deployment identity for PR preflight.
//
// Render exposes RENDER_GIT_COMMIT / RENDER_GIT_BRANCH / RENDER_GIT_REPO_SLUG at runtime.
// Exposing those non-secret identifiers through /healthz allows development agents and CI to
// prove exactly which repository state is currently deployed before opening or validating a PR.

import fs from 'fs';
import path from 'path';

export interface DeploymentIdentity {
  version: string;
  commitSha: string | null;
  branch: string | null;
  repoSlug: string | null;
  provider: 'render' | 'github-actions' | 'local';
  isPullRequest: boolean;
}

let cachedVersion: string | null = null;

function readPackageVersion(): string {
  if (cachedVersion) return cachedVersion;
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const parsed = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    cachedVersion = typeof parsed.version === 'string' && parsed.version ? parsed.version : 'unknown';
  } catch {
    cachedVersion = 'unknown';
  }
  return cachedVersion;
}

function clean(value: string | undefined): string | null {
  const normalized = String(value || '').trim();
  return normalized || null;
}

export function getDeploymentIdentity(): DeploymentIdentity {
  const render = process.env.RENDER === 'true';
  const githubActions = process.env.GITHUB_ACTIONS === 'true';

  return {
    version: readPackageVersion(),
    commitSha: clean(process.env.RENDER_GIT_COMMIT) || clean(process.env.GITHUB_SHA),
    branch: clean(process.env.RENDER_GIT_BRANCH) || clean(process.env.GITHUB_REF_NAME),
    repoSlug: clean(process.env.RENDER_GIT_REPO_SLUG) || clean(process.env.GITHUB_REPOSITORY),
    provider: render ? 'render' : githubActions ? 'github-actions' : 'local',
    isPullRequest: process.env.IS_PULL_REQUEST === 'true',
  };
}
