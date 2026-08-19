// M10 Phase 5 — retry-free GitHub Actions dispatcher adapter.
//
// This adapter intentionally performs exactly one HTTP request and contains no retry/backoff logic.
// After a durable M10 consumption claim, a transport ambiguity must be reconciled by a Human rather
// than risking a second expensive CI run. The target workflow is introduced/activated only by the
// later controlled-cutover change; this module is not live-wired on its own.
import type { M10CiDispatcher, M10CiDispatchRequest } from './atomicCiConsumption';

export interface M10GithubDispatcherOptions {
  token: string;
  workflowFile: string;
  workflowRef?: string;
  fetchImpl?: typeof fetch;
}

function validateRepository(repository: string): { owner: string; repo: string } {
  const parts = repository.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1] || !/^[A-Za-z0-9_.-]+$/.test(parts[0]) || !/^[A-Za-z0-9_.-]+$/.test(parts[1])) {
    throw new Error('Ungültiges GitHub-Repository für M10-CI-Dispatch.');
  }
  return { owner: parts[0], repo: parts[1] };
}

function validateWorkflowFile(workflowFile: string): string {
  if (!workflowFile || !/^[A-Za-z0-9_.-]+\.ya?ml$/.test(workflowFile)) {
    throw new Error('Ungültige GitHub-Workflow-Datei für M10-CI-Dispatch.');
  }
  return workflowFile;
}

export function createM10GithubActionsDispatcher(options: Readonly<M10GithubDispatcherOptions>): M10CiDispatcher {
  const token = options.token.trim();
  if (!token) throw new Error('M10 GitHub Actions token fehlt.');
  const workflowFile = validateWorkflowFile(options.workflowFile);
  const workflowRef = options.workflowRef?.trim() || 'main';
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async dispatch(request: Readonly<M10CiDispatchRequest>) {
      const { owner, repo } = validateRepository(request.repository);
      const response = await fetchImpl(
        `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(workflowFile)}/dispatches`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          body: JSON.stringify({
            ref: workflowRef,
            inputs: {
              m10_consumption_id: request.consumptionId,
              m10_approval_id: request.approvalId,
              m10_pr_number: String(request.prNumber),
              m10_base_sha: request.baseSha,
              m10_head_sha: request.headSha,
              m10_authorization_digest: request.authorizationDigest,
              m10_action: request.action,
            },
          }),
          redirect: 'error',
        },
      );

      return {
        accepted: response.status === 204,
        reference: response.headers.get('x-github-request-id') || undefined,
      };
    },
  };
}
