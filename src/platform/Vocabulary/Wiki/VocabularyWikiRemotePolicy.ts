export const CAPITAL_AI_WIKI_HTTPS_REMOTE = 'https://github.com/SvenKulessa/Finance.wiki.git' as const;
export const CAPITAL_AI_WIKI_SSH_REMOTE = 'git@github.com:SvenKulessa/Finance.wiki.git' as const;
export const CAPITAL_AI_WIKI_SSH_URL_REMOTE = 'ssh://git@github.com/SvenKulessa/Finance.wiki.git' as const;

const ALLOWED_WIKI_REMOTES = new Set<string>([
  CAPITAL_AI_WIKI_HTTPS_REMOTE,
  CAPITAL_AI_WIKI_SSH_REMOTE,
  CAPITAL_AI_WIKI_SSH_URL_REMOTE,
]);

/**
 * Exact allowlist only. Deliberately rejects credential-bearing HTTPS origins,
 * alternate hosts, redirects, similarly named repositories and path suffix matches.
 */
export function isAllowedVocabularyWikiRemote(remote: string): boolean {
  return ALLOWED_WIKI_REMOTES.has(remote.trim().replace(/\/$/, ''));
}
