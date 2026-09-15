import { describe, expect, it } from 'vitest';
import {
  validateDocumentaryExtension,
  type DocumentaryExtensionDescriptor,
} from '../../src/platform/Documentary/Plugins/DocumentaryExtensionContract';

function descriptor(overrides: Partial<DocumentaryExtensionDescriptor> = {}): DocumentaryExtensionDescriptor {
  return {
    id: 'documentary.generator.architecture-report',
    name: 'Architecture Report',
    version: '1.0.0',
    type: 'generator',
    description: 'Generates an existing Documentary model projection.',
    owner: 'CAPITAL-AI-DOC',
    sourcePath: 'src/platform/Documentary/Plugins/ArchitectureReportPlugin.ts',
    dependencies: [],
    requiredInterfaces: ['IDocumentationGenerator'],
    producedEvents: [],
    consumedEvents: [],
    configurationKeys: [],
    essReferences: ['ESS-0001-CONTRACTS', 'ESS-0010'],
    adrReferences: ['ADR-0010'],
    securityClassification: 'internal',
    securityReviewReference: null,
    minimumPlatformVersion: '0.6.0',
    maximumPlatformVersion: '0.6.0',
    requiredInterfaceVersion: '1.0.0',
    requiredEventVersion: '1.0.0',
    declaresNetworkAccess: false,
    declaresDirectDatabaseAccess: false,
    executesForeignCode: false,
    usesDynamicCodeGeneration: false,
    ...overrides,
  };
}

describe('Documentary extension contract', () => {
  it('accepts a Documentary-local descriptor only for a registration request', () => {
    const result = validateDocumentaryExtension(descriptor(), { registeredPluginIds: [] });

    expect(result.status).toBe('VALID_FOR_REGISTRATION_REQUEST');
    expect(result.blockers).toEqual([]);
    expect(result.registryMutationPerformed).toBe(false);
    expect(result.activationAuthorized).toBe(false);
    expect(result.externalCapabilityAuthorized).toBe(false);
    expect(result.lifecycle).toEqual([
      'discovery',
      'validation',
      'registration',
      'initialization',
      'activation',
      'execution',
      'deactivation',
      'disposal',
    ]);
  });

  it('blocks a plugin identity that already exists in the supplied enterprise-registry context', () => {
    const candidate = descriptor();
    const result = validateDocumentaryExtension(candidate, { registeredPluginIds: [candidate.id] });

    expect(result.status).toBe('BLOCKED');
    expect(result.blockers).toContain('plugin-id-already-registered');
  });

  it('blocks paths outside the Documentary plugin location and unsafe traversal', () => {
    const result = validateDocumentaryExtension(
      descriptor({ sourcePath: 'src/platform/Documentary/Plugins/../ForeignPlugin.ts' }),
      { registeredPluginIds: [] },
    );

    expect(result.status).toBe('BLOCKED');
    expect(result.blockers).toContain('plugin-path-unsafe');
  });

  it('blocks implicit external capability, database, foreign-code and dynamic-code authority', () => {
    const result = validateDocumentaryExtension(
      descriptor({
        declaresNetworkAccess: true,
        declaresDirectDatabaseAccess: true,
        executesForeignCode: true,
        usesDynamicCodeGeneration: true,
      }),
      { registeredPluginIds: [] },
    );

    expect(result.status).toBe('BLOCKED');
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        'network-access-requires-separate-authorization',
        'direct-database-access-requires-separate-authorization',
        'foreign-code-execution-prohibited',
        'dynamic-code-generation-prohibited',
      ]),
    );
    expect(result.externalCapabilityAuthorized).toBe(false);
  });

  it('requires explicit Security Review evidence for restricted or critical extensions', () => {
    const blocked = validateDocumentaryExtension(
      descriptor({ securityClassification: 'restricted', securityReviewReference: null }),
      { registeredPluginIds: [] },
    );
    const reviewed = validateDocumentaryExtension(
      descriptor({ securityClassification: 'restricted', securityReviewReference: 'SEC-REVIEW-DOC-001' }),
      { registeredPluginIds: [] },
    );

    expect(blocked.status).toBe('BLOCKED');
    expect(blocked.blockers).toContain('security-review-reference-required');
    expect(reviewed.status).toBe('VALID_FOR_REGISTRATION_REQUEST');
  });

  it('fails closed when required Enterprise and Documentary contract references are absent', () => {
    const result = validateDocumentaryExtension(
      descriptor({ essReferences: ['ESS-0019'] }),
      { registeredPluginIds: [] },
    );

    expect(result.status).toBe('BLOCKED');
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        'enterprise-plugin-contract-reference-required',
        'documentary-contract-reference-required',
      ]),
    );
  });
});
