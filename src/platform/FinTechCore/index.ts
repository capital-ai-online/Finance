export * from './CoreContracts';
export * from './CoreModuleRegistry';
export * from './CoreEngine';
export * from './CryptoModuleContracts';
export * from './Financial/FixedPoint';
export * from './Runtime/WorkflowStateMachine';
export * from './Persistence/FinTechCorePersistencePort';
export * from './PaperTrading/PaperTradingContracts';
export * from './PaperTrading/PaperTradingEngine';
export * from './PaperTrading/PaperTradingWorkflowService';
export * from './RiskCompliance/RiskComplianceContracts';
export * from './RiskCompliance/DeterministicPreTradeGate';
export * from './RiskCompliance/RiskComplianceDecisionRecords';
export * from './OrderIntent/OrderIntentBinding';
export * from './Reconciliation/ReconciliationContracts';
export * from './Portfolio/PortfolioAllocationContracts';
export * from './Portfolio/DeterministicPortfolioAllocator';
export * from './Portfolio/PortfolioRiskEvidenceProjection';
export * from './Modules/Crypto/CryptoCoreModule';
export * from './Modules/Crypto/CryptoCategoryProfileResolver';
export * from './Modules/Crypto/CryptoCategoryFeatureContracts';
export * from './Modules/Crypto/Adapters/VerifiedCryptoSnapshotFeatureAdapter';
export * from './Modules/Crypto/Pattern/PatternDetectionContracts';
export * from './Modules/Crypto/Pattern/PatternReliabilityRegistry';
export * from './Modules/Crypto/Pattern/PatternSignalResolver';
export * from './Modules/Crypto/Pattern/PatternResearchEngine';

import { FinTechCoreEngine } from './CoreEngine';
import { FinTechCoreModuleRegistry } from './CoreModuleRegistry';
import { cryptoCoreModule } from './Modules/Crypto/CryptoCoreModule';

/**
 * Default FT-1 composition. Module topology is fixed at process startup and cannot be mutated at
 * runtime. Additional modules must be added through versioned repository changes and review.
 */
export const finTechCoreModuleRegistry = new FinTechCoreModuleRegistry([
  cryptoCoreModule,
]);

export const finTechCoreEngine = new FinTechCoreEngine(finTechCoreModuleRegistry);
