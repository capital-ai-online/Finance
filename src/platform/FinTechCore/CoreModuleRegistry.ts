import type { UniversalAssetIdentity } from '../Scoring/contracts';
import type {
  FinTechCoreModule,
  FinTechCoreOperatingMode,
} from './CoreContracts';

export const FINTECH_CORE_MODULE_REGISTRY_VERSION = 'fintech-core/module-registry/0.1.0' as const;

export interface FinTechCoreModuleResolutionRequest {
  readonly moduleId?: string;
  readonly assetClass: UniversalAssetIdentity['assetClass'];
  readonly operatingMode: FinTechCoreOperatingMode;
}

export type FinTechCoreModuleResolution =
  | {
      readonly status: 'RESOLVED';
      readonly module: FinTechCoreModule;
    }
  | {
      readonly status: 'MODULE_NOT_AVAILABLE';
      readonly reason: string;
    };

function supports(
  module: FinTechCoreModule,
  request: FinTechCoreModuleResolutionRequest,
): boolean {
  return module.descriptor.supportedAssetClasses.includes(request.assetClass)
    && module.descriptor.supportedOperatingModes.includes(request.operatingMode);
}

/**
 * Immutable FT-1 registry. Module selection is constructor-bound and fail-closed.
 * Runtime registration/mutation is intentionally unavailable so an agent or request cannot
 * alter the financial module topology after process start.
 */
export class FinTechCoreModuleRegistry {
  private readonly modules: readonly FinTechCoreModule[];

  constructor(modules: readonly FinTechCoreModule[] = []) {
    const seen = new Set<string>();
    const ordered = [...modules].sort((left, right) =>
      left.descriptor.moduleId.localeCompare(right.descriptor.moduleId));

    for (const module of ordered) {
      const moduleId = module.descriptor.moduleId.trim();
      if (!moduleId) throw new Error('FINTECH_CORE_MODULE_ID_REQUIRED');
      if (seen.has(moduleId)) throw new Error(`FINTECH_CORE_MODULE_DUPLICATE:${moduleId}`);
      seen.add(moduleId);
    }

    this.modules = Object.freeze(ordered);
  }

  list(): readonly FinTechCoreModule[] {
    return this.modules;
  }

  get(moduleId: string): FinTechCoreModule | null {
    return this.modules.find((module) => module.descriptor.moduleId === moduleId) ?? null;
  }

  resolve(request: FinTechCoreModuleResolutionRequest): FinTechCoreModuleResolution {
    if (request.moduleId) {
      const exact = this.get(request.moduleId);
      if (!exact) {
        return {
          status: 'MODULE_NOT_AVAILABLE',
          reason: `FinTech Core module ${request.moduleId} is not registered.`,
        };
      }
      if (!supports(exact, request)) {
        return {
          status: 'MODULE_NOT_AVAILABLE',
          reason: `FinTech Core module ${request.moduleId} does not support ${request.assetClass}/${request.operatingMode}.`,
        };
      }
      return { status: 'RESOLVED', module: exact };
    }

    const candidates = this.modules.filter((module) => supports(module, request));
    if (candidates.length === 0) {
      return {
        status: 'MODULE_NOT_AVAILABLE',
        reason: `No FinTech Core module supports ${request.assetClass}/${request.operatingMode}.`,
      };
    }
    if (candidates.length > 1) {
      return {
        status: 'MODULE_NOT_AVAILABLE',
        reason: `Ambiguous FinTech Core module routing for ${request.assetClass}/${request.operatingMode}: ${candidates
          .map((module) => module.descriptor.moduleId)
          .join(', ')}.`,
      };
    }

    return { status: 'RESOLVED', module: candidates[0] };
  }
}
