// ESS-0013-CONTRACTS Abschnitt 4 (Compatibility Contract).
// Semantic-Versioning-Format fuer einzelne Event Contracts, unabhaengig von der
// Plattformversion (ESS-0001-CONTRACTS Chapter 9).

export interface EventVersion {
  major: number;
  minor: number;
  patch: number;
}

export function parseEventVersion(value: string): EventVersion {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value.trim());
  if (!match) {
    throw new Error(`Ungueltiges EventVersion-Format: "${value}" (erwartet MAJOR.MINOR.PATCH)`);
  }
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

export function formatEventVersion(version: EventVersion): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

export type VersionBump = 'major' | 'minor' | 'patch';

export function bumpEventVersion(version: EventVersion, bump: VersionBump): EventVersion {
  switch (bump) {
    case 'major':
      return { major: version.major + 1, minor: 0, patch: 0 };
    case 'minor':
      return { major: version.major, minor: version.minor + 1, patch: 0 };
    case 'patch':
      return { major: version.major, minor: version.minor, patch: version.patch + 1 };
  }
}

export const INITIAL_EVENT_VERSION: EventVersion = { major: 1, minor: 0, patch: 0 };
