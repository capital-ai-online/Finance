import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => fs.readFileSync(path, 'utf8');

function jobBlock(yaml: string, jobId: string): string {
  const marker = `  ${jobId}:\n`;
  const start = yaml.indexOf(marker);
  if (start < 0) throw new Error(`Job ${jobId} not found`);
  const rest = yaml.slice(start + marker.length);
  const next = rest.search(/\n  [a-zA-Z0-9_-]+:\n/);
  return next >= 0 ? rest.slice(0, next) : rest;
}

describe('PR Draft -> Ready pipeline gate', () => {
  it('keeps CI runner-free for draft PRs and eligible once the PR is ready', () => {
    const yaml = read('.github/workflows/ci.yml');
    expect(yaml).toContain('types: [opened, synchronize, reopened, ready_for_review]');
    expect(jobBlock(yaml, 'build-and-test')).toContain(
      "if: github.event_name != 'pull_request' || github.event.pull_request.draft == false",
    );
  });

  it('keeps container security runner-free for draft PRs and eligible once the PR is ready', () => {
    const yaml = read('.github/workflows/container-security.yml');
    expect(yaml).toContain('types: [opened, synchronize, reopened, ready_for_review]');
    expect(jobBlock(yaml, 'image-security')).toContain(
      "if: github.event_name != 'pull_request' || github.event.pull_request.draft == false",
    );
  });

  it('runs governance only for non-draft pull requests including ready_for_review', () => {
    const yaml = read('.github/workflows/pr-governance.yml');
    expect(yaml).toContain('types: [opened, reopened, synchronize, ready_for_review, edited]');
    expect(jobBlock(yaml, 'governance')).toContain(
      "if: github.event_name == 'pull_request' && github.event.pull_request.draft == false",
    );
  });

  it('explicitly includes ready_for_review for zizmor and gates draft PR runners', () => {
    const yaml = read('.github/workflows/zizmor.yml');
    expect(yaml).toContain('types: [opened, synchronize, reopened, ready_for_review]');
    expect(jobBlock(yaml, 'zizmor')).toContain(
      "if: github.event_name != 'pull_request' || github.event.pull_request.draft == false",
    );
  });
});
