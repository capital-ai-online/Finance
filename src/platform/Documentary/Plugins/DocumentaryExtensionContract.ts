export const DOCUMENTARY_EXTENSION_CONTRACT_VERSION = '1.0.0' as const;

export const DOCUMENTARY_EXTENSION_LIFECYCLE = [
  'discovery',
  'validation',
  'registration',
  'initialization',
  'activation',
  'execution',
  'deactivation',
  'disposal',
] as const;

export type DocumentaryExtensionType =
  | 'generator'
  | 'validator'
  | 'discovery'
  | 'knowledge'
  | 'documentation'
  | 'diagram'
  | 'report'
  | 'event'
  | 'integration'
  | 'ai';

export type DocumentaryExtensionSecurityClassification =
  | 'public'
  | 'internal'
  | 'restricted'
  | 'critical';

export interface DocumentaryExtensionDescriptor {
  id: string;
  name: string;
  version: string;
  type: DocumentaryExtensionType;
  description: string;
  owner: 'CAPITAL-AI-DOC';
  sourcePath: string;
  dependencies: readonly string[];
  requiredInterfaces: readonly string[];
  producedEvents: readonly string[];
  consumedEvents: readonly string[];
  configurationKeys: readonly string[];
  essReferences: readonly string[];
  adrReferences: readonly string[];
  securityClassification: DocumentaryExtensionSecurityClassification;
  securityReviewReference: string | null;
  minimumPlatformVersion: string;
  maximumPlatformVersion: string;
  requiredInterfaceVersion: string;
  requiredEventVersion: string;
  declaresNetworkAccess: boolean;
  declaresDirectDatabaseAccess: boolean;
  executesForeignCode: boolean;
  usesDynamicCodeGeneration: boolean;
}

export interface DocumentaryExtensionValidationContext {
  registeredPluginIds: readonly string[];
}

export type DocumentaryExtensionValidationStatus = 'VALID_FOR_REGISTRATION_REQUEST' | 'BLOCKED';

export interface DocumentaryExtensionValidationResult {
  contractVersion: typeof DOCUMENTARY_EXTENSION_CONTRACT_VERSION;
  status: DocumentaryExtensionValidationStatus;
  pluginId: string;
  blockers: readonly string[];
  lifecycle: typeof DOCUMENTARY_EXTENSION_LIFECYCLE;
  registryMutationPerformed: false;
  activationAuthorized: false;
  externalCapabilityAuthorized: false;
}

const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const PLUGIN_ID_PATTERN = /^documentary\.(generator|validator|discovery|knowledge|documentation|diagram|report|event|integration|ai)\.[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DOCUMENTARY_PLUGIN_PATH_PREFIX = 'src/platform/Documentary/Plugins/';

function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

function allNonEmpty(values: readonly string[]): boolean {
  return values.every(isNonEmpty);
}

function hasDuplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}

function addReferenceBlocker(
  blockers: string[],
  values: readonly string[],
  label: string,
  requiredPrefix?: string,
): void {
  if (!allNonEmpty(values)) blockers.push(`${label}-contains-empty-value`);
  if (hasDuplicates(values)) blockers.push(`${label}-contains-duplicates`);
  if (requiredPrefix && values.some((value) => !value.startsWith(requiredPrefix))) {
    blockers.push(`${label}-invalid-reference`);
  }
}

export function validateDocumentaryExtension(
  descriptor: DocumentaryExtensionDescriptor,
  context: DocumentaryExtensionValidationContext,
): DocumentaryExtensionValidationResult {
  const blockers: string[] = [];

  if (!PLUGIN_ID_PATTERN.test(descriptor.id)) blockers.push('plugin-id-invalid');
  if (!descriptor.id.startsWith(`documentary.${descriptor.type}.`)) blockers.push('plugin-id-type-mismatch');
  if (!isNonEmpty(descriptor.name)) blockers.push('plugin-name-required');
  if (!SEMVER_PATTERN.test(descriptor.version)) blockers.push('plugin-version-invalid');
  if (!isNonEmpty(descriptor.description)) blockers.push('plugin-description-required');
  if (descriptor.owner !== 'CAPITAL-AI-DOC') blockers.push('foreign-plugin-owner');

  if (!descriptor.sourcePath.startsWith(DOCUMENTARY_PLUGIN_PATH_PREFIX)) {
    blockers.push('plugin-path-outside-documentary-plugins');
  }
  if (descriptor.sourcePath.includes('..')) blockers.push('plugin-path-unsafe');

  if (context.registeredPluginIds.includes(descriptor.id)) blockers.push('plugin-id-already-registered');
  if (!allNonEmpty(context.registeredPluginIds)) blockers.push('registry-context-invalid');
  if (hasDuplicates(context.registeredPluginIds)) blockers.push('registry-context-contains-duplicates');

  addReferenceBlocker(blockers, descriptor.dependencies, 'dependencies');
  addReferenceBlocker(blockers, descriptor.requiredInterfaces, 'required-interfaces');
  addReferenceBlocker(blockers, descriptor.producedEvents, 'produced-events');
  addReferenceBlocker(blockers, descriptor.consumedEvents, 'consumed-events');
  addReferenceBlocker(blockers, descriptor.configurationKeys, 'configuration-keys');
  addReferenceBlocker(blockers, descriptor.essReferences, 'ess-references', 'ESS-');
  addReferenceBlocker(blockers, descriptor.adrReferences, 'adr-references', 'ADR-');

  if (!descriptor.essReferences.includes('ESS-0001-CONTRACTS')) blockers.push('enterprise-plugin-contract-reference-required');
  if (!descriptor.essReferences.includes('ESS-0010')) blockers.push('documentary-contract-reference-required');

  if (!SEMVER_PATTERN.test(descriptor.minimumPlatformVersion)) blockers.push('minimum-platform-version-invalid');
  if (!SEMVER_PATTERN.test(descriptor.maximumPlatformVersion)) blockers.push('maximum-platform-version-invalid');
  if (!SEMVER_PATTERN.test(descriptor.requiredInterfaceVersion)) blockers.push('required-interface-version-invalid');
  if (!SEMVER_PATTERN.test(descriptor.requiredEventVersion)) blockers.push('required-event-version-invalid');

  if (descriptor.executesForeignCode) blockers.push('foreign-code-execution-prohibited');
  if (descriptor.usesDynamicCodeGeneration) blockers.push('dynamic-code-generation-prohibited');

  if (
    (descriptor.securityClassification === 'restricted' || descriptor.securityClassification === 'critical') &&
    (!descriptor.securityReviewReference || !isNonEmpty(descriptor.securityReviewReference))
  ) {
    blockers.push('security-review-reference-required');
  }

  if (descriptor.declaresDirectDatabaseAccess) blockers.push('direct-database-access-requires-separate-authorization');
  if (descriptor.declaresNetworkAccess) blockers.push('network-access-requires-separate-authorization');

  return Object.freeze({
    contractVersion: DOCUMENTARY_EXTENSION_CONTRACT_VERSION,
    status: blockers.length === 0 ? 'VALID_FOR_REGISTRATION_REQUEST' : 'BLOCKED',
    pluginId: descriptor.id,
    blockers: Object.freeze([...blockers]),
    lifecycle: DOCUMENTARY_EXTENSION_LIFECYCLE,
    registryMutationPerformed: false,
    activationAuthorized: false,
    externalCapabilityAuthorized: false,
  });
}
