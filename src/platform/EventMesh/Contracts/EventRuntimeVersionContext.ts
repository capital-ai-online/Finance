import { parseEventVersion } from './EventVersion';

export interface EventRuntimeVersionContext {
  schemaVersion: string;
  producerComponentVersion: string;
  platformVersion: string;
  sourceCommit: string;
}

export interface EventCompatibilityAssessment {
  compatible: boolean;
  breaking: boolean;
  reason: string;
}

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const COMMIT_SHA = /^[0-9a-f]{40}$/i;

export function validateEventRuntimeVersionContext(context: EventRuntimeVersionContext): string[] {
  const errors: string[] = [];
  if (!SEMVER.test(context.schemaVersion)) errors.push('schemaVersion must be strict MAJOR.MINOR.PATCH.');
  if (!SEMVER.test(context.producerComponentVersion)) errors.push('producerComponentVersion must be strict MAJOR.MINOR.PATCH.');
  if (!SEMVER.test(context.platformVersion)) errors.push('platformVersion must be strict MAJOR.MINOR.PATCH.');
  if (!COMMIT_SHA.test(context.sourceCommit)) errors.push('sourceCommit must be a full 40-character Git commit SHA.');
  return errors;
}

export function assertEventRuntimeVersionContext(context: EventRuntimeVersionContext): void {
  const errors = validateEventRuntimeVersionContext(context);
  if (errors.length > 0) throw new Error(`[EventRuntimeVersionContext] ${errors.join(' ')}`);
}

export function assessEventSchemaCompatibility(previousVersion: string, nextVersion: string): EventCompatibilityAssessment {
  const previous = parseEventVersion(previousVersion);
  const next = parseEventVersion(nextVersion);

  if (next.major !== previous.major) {
    return { compatible: false, breaking: true, reason: 'Major schema version changed; ADR/contract migration is required.' };
  }
  if (next.minor < previous.minor || (next.minor === previous.minor && next.patch < previous.patch)) {
    return { compatible: false, breaking: false, reason: 'Schema version downgrade is not allowed.' };
  }
  return { compatible: true, breaking: false, reason: 'Schema version remains within the same major compatibility line.' };
}
