import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = fs.readFileSync('.github/workflows/container-security.yml', 'utf8');

describe('GHCR digest publication contract', () => {
  it('keeps package write authority out of the PR-facing image-security job', () => {
    const [imageSecurity, publishGhcr] = workflow.split('\n  publish-ghcr:');
    expect(imageSecurity).not.toContain('packages: write');
    expect(publishGhcr).toContain('packages: write');
    expect(publishGhcr).toContain("github.event_name == 'push'");
    expect(publishGhcr).toContain("github.event_name == 'workflow_dispatch'");
    expect(publishGhcr).toContain("github.actor == 'SvenKulessa'");
    expect(publishGhcr).toContain("inputs.publish_ghcr == true");
    expect(publishGhcr).toContain("github.ref == 'refs/heads/main'");
    expect(publishGhcr).toContain("vars.GHCR_DIGEST_PUBLISH_ENABLED == 'true'");
  });

  it('keeps manual publication explicit, default-off and main-only', () => {
    expect(workflow).toContain('publish_ghcr:');
    expect(workflow).toContain('type: boolean');
    expect(workflow).toContain('default: false');
    expect(workflow).toContain("github.ref == 'refs/heads/main'");
    expect(workflow).toContain("vars.GHCR_DIGEST_PUBLISH_ENABLED == 'true'");
  });

  it('publishes the exact scanned image without latest authority', () => {
    expect(workflow).toContain('docker save "capital-ai-security:$SOURCE_SHA"');
    expect(workflow).toContain('docker tag "capital-ai-security:$GITHUB_SHA" "$GHCR_IMAGE:$GITHUB_SHA"');
    expect(workflow).toContain('test "$pushed_digest" = "$expected_digest"');
    expect(workflow).not.toContain('$GHCR_IMAGE:latest');
  });

  it('requires keyless signature plus provenance and SBOM attestations', () => {
    expect(workflow).toContain('cosign sign --yes "$image_ref"');
    expect(workflow).toContain('cosign attest --yes --type slsaprovenance1');
    expect(workflow).toContain('cosign attest --yes --type cyclonedx');
    expect(workflow).toContain('--certificate-oidc-issuer "$issuer"');
    expect(workflow).toContain('container-security.yml@refs/heads/main');
  });

  it('prepares only an exact Render digest reference and never deploys it', () => {
    expect(workflow).toContain('renderDigestImageReference.mjs');
    expect(workflow).not.toContain('RENDER_DEPLOY_HOOK_URL');
    expect(workflow).not.toContain('curl ');
  });
});
