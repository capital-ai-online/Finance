declare const __CAPITAL_AI_VERSION__: string;

const PLATFORM_SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/**
 * Browser-safe projection of the sole platform-version authority.
 *
 * Authority remains package.json#version. Vite reads that value during the
 * build and injects __CAPITAL_AI_VERSION__. Client code must consume this
 * projection instead of pinning a second platform-version literal.
 */
function requireInjectedPlatformVersion(value: string): string {
  if (!PLATFORM_SEMVER.test(value)) {
    throw new Error('[ClientVersion] Injected platform version violates strict MAJOR.MINOR.PATCH SemVer.');
  }
  return value;
}

export const CAPITAL_AI_VERSION = requireInjectedPlatformVersion(__CAPITAL_AI_VERSION__);
export const CAPITAL_AI_VERSION_LABEL = `Version ${CAPITAL_AI_VERSION}`;
