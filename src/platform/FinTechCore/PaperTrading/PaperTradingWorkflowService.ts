import type { FinTechCoreDomainEvent } from '../CoreContracts';
import type {
  FinTechCoreDomainEventReaderPort,
  FinTechCorePersistencePort,
} from '../Persistence/FinTechCorePersistencePort';
import {
  initializePaperAccount,
  replayPaperTradingEvents,
  simulatePaperTrade,
} from './PaperTradingEngine';
import type {
  PaperAccountInitializationInput,
  PaperAccountState,
  PaperTradeSimulationRequest,
  PaperTradeSimulationResult,
  PaperTradingWorkflowContext,
} from './PaperTradingContracts';

export type PaperTradingEventStore = Pick<FinTechCorePersistencePort, 'appendDomainEvent'>
  & FinTechCoreDomainEventReaderPort;

/**
 * FT-4 orchestration service. All financial state is fictional and reconstructed from the durable
 * append-only domain-event journal. The service has no exchange, wallet, custody or live-order
 * dependency and cannot create a real OrderIntent.
 */
export class PaperTradingWorkflowService {
  constructor(private readonly eventStore: PaperTradingEventStore) {}

  async initialize(
    context: PaperTradingWorkflowContext,
    input: PaperAccountInitializationInput,
  ): Promise<PaperAccountState> {
    const existing = await this.eventStore.listDomainEvents(context.runId);
    const hasPaperInitialization = existing.some((event) => event.eventType === 'PAPER_ACCOUNT_INITIALIZED');
    if (hasPaperInitialization) {
      throw new Error(`[FinTechCore][Paper] Workflow ${context.runId} already has a paper account initialization.`);
    }

    const initialized = initializePaperAccount(context, input);
    await this.eventStore.appendDomainEvent(initialized.event);
    return initialized.state;
  }

  async load(runId: string): Promise<PaperAccountState> {
    if (!runId.trim()) {
      throw new Error('[FinTechCore][Paper] runId is required for durable replay.');
    }
    const events: readonly FinTechCoreDomainEvent[] = await this.eventStore.listDomainEvents(runId);
    const replay = replayPaperTradingEvents(events);
    if (replay.status !== 'REPLAYED') {
      throw new Error(`[FinTechCore][Paper] Durable replay failed for ${runId}: ${replay.reason}`);
    }
    return replay.state;
  }

  async simulateAndPersist(
    runId: string,
    request: PaperTradeSimulationRequest,
  ): Promise<PaperTradeSimulationResult> {
    const state = await this.load(runId);
    const result = simulatePaperTrade(state, request);
    if (result.status === 'FILLED') {
      await this.eventStore.appendDomainEvent(result.event);
    }
    return result;
  }
}
