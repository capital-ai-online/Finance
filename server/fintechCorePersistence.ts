import type {
  FinTechCoreDecisionRecord,
  FinTechCoreDomainEvent,
  FinTechCoreOrderIntent,
} from '../src/platform/FinTechCore/CoreContracts';
import { finTechCoreFixedPointToDecimalString } from '../src/platform/FinTechCore/Financial/FixedPoint';
import type {
  FinTechCoreDomainEventReaderPort,
  FinTechCoreOrderIntentPersistenceInput,
  FinTechCorePersistencePort,
  FinTechCoreWorkflowRunPersistenceInput,
  FinTechCoreWorkflowTransitionPersistenceInput,
} from '../src/platform/FinTechCore/Persistence/FinTechCorePersistencePort';
import type { FinTechCoreReconciliationRecord } from '../src/platform/FinTechCore/Reconciliation/ReconciliationContracts';
import {
  assertPrivilegedSupabaseConfigured,
  getPrivilegedServerSupabase,
} from './db';

const TERMINAL_WORKFLOW_STATUSES = new Set([
  'COMPLETED',
  'REJECTED',
  'FAILED',
  'EMERGENCY_STOPPED',
]);

function errorMessage(value: unknown): string {
  if (value && typeof value === 'object' && 'message' in value) {
    return String((value as { message?: unknown }).message ?? 'unknown Supabase error');
  }
  return String(value);
}

async function callPersistenceRpc(
  rpcName: string,
  params: Readonly<Record<string, unknown>>,
  context: string,
): Promise<boolean> {
  assertPrivilegedSupabaseConfigured(context);
  const supabase = getPrivilegedServerSupabase();
  const { data, error } = await supabase.rpc(rpcName, params);

  if (error) {
    throw new Error(`[FinTechCore][Persistence] ${context} failed: ${errorMessage(error)}`);
  }
  if (typeof data !== 'boolean') {
    throw new Error(`[FinTechCore][Persistence] ${context} returned an invalid acknowledgement.`);
  }
  return data;
}

function requiredString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`[FinTechCore][Persistence] domain-event replay row is missing ${key}.`);
  }
  return value;
}

function optionalString(row: Record<string, unknown>, key: string): string | undefined {
  const value = row[key];
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`[FinTechCore][Persistence] domain-event replay row has invalid ${key}.`);
  }
  return value;
}

function stringArray(row: Record<string, unknown>, key: string): readonly string[] {
  const value = row[key];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new Error(`[FinTechCore][Persistence] domain-event replay row has invalid ${key}.`);
  }
  return Object.freeze([...value]);
}

function recordPayload(row: Record<string, unknown>): Readonly<Record<string, unknown>> {
  const value = row.payload;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('[FinTechCore][Persistence] domain-event replay row has invalid payload.');
  }
  return Object.freeze({ ...(value as Record<string, unknown>) });
}

function mapDomainEventRow(value: unknown): FinTechCoreDomainEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('[FinTechCore][Persistence] domain-event replay returned a non-object row.');
  }
  const row = value as Record<string, unknown>;
  return Object.freeze({
    contractVersion: requiredString(row, 'contract_version') as FinTechCoreDomainEvent['contractVersion'],
    eventId: requiredString(row, 'event_id'),
    eventType: requiredString(row, 'event_type'),
    eventVersion: requiredString(row, 'event_version'),
    runId: requiredString(row, 'run_id'),
    traceId: requiredString(row, 'trace_id'),
    correlationId: requiredString(row, 'correlation_id'),
    causationId: optionalString(row, 'causation_id'),
    moduleId: requiredString(row, 'module_id'),
    assetId: requiredString(row, 'asset_id'),
    decisionVersion: requiredString(row, 'decision_version'),
    occurredAt: requiredString(row, 'occurred_at'),
    evidenceRefs: stringArray(row, 'evidence_refs'),
    payload: recordPayload(row),
  });
}

function assertWorkflowCreationInput(input: FinTechCoreWorkflowRunPersistenceInput): void {
  const { context, state } = input;
  if (state.runId !== context.runId) {
    throw new Error('[FinTechCore][Persistence] Workflow state runId does not match its context.');
  }
  if (state.moduleId !== context.moduleId) {
    throw new Error('[FinTechCore][Persistence] Workflow state moduleId does not match its context.');
  }
  if (state.contractVersion !== context.contractVersion) {
    throw new Error('[FinTechCore][Persistence] Workflow state contract version does not match its context.');
  }
  if (state.status !== 'CREATED' || state.sequence !== 0) {
    throw new Error('[FinTechCore][Persistence] A durable workflow must be created from CREATED sequence 0.');
  }
  if (state.updatedAt !== context.startedAt) {
    throw new Error('[FinTechCore][Persistence] Initial workflow timestamp must equal context.startedAt.');
  }
}

function assertWorkflowTransitionInput(input: FinTechCoreWorkflowTransitionPersistenceInput): void {
  const { previousState, nextState } = input;
  if (previousState.runId !== nextState.runId || previousState.moduleId !== nextState.moduleId) {
    throw new Error('[FinTechCore][Persistence] Workflow transition identity changed across states.');
  }
  if (previousState.contractVersion !== nextState.contractVersion) {
    throw new Error('[FinTechCore][Persistence] Workflow transition contract version changed across states.');
  }
  if (nextState.sequence !== previousState.sequence + 1) {
    throw new Error('[FinTechCore][Persistence] Workflow transition sequence must advance by exactly one.');
  }
  if (nextState.previousStatus !== previousState.status) {
    throw new Error('[FinTechCore][Persistence] Workflow transition previousStatus does not match the persisted predecessor.');
  }
  if (!nextState.updatedAt.trim()) {
    throw new Error('[FinTechCore][Persistence] Workflow transition timestamp is required.');
  }
}

function assertBoundOrderIntent(intent: FinTechCoreOrderIntent): asserts intent is FinTechCoreOrderIntent & {
  readonly bindingVersion: string;
  readonly clientOrderId: string;
  readonly riskDecisionId: string;
  readonly riskDecisionHash: string;
  readonly riskPolicyId: string;
  readonly riskPolicyVersion: string;
  readonly complianceDecisionId: string;
  readonly complianceDecisionHash: string;
  readonly compliancePolicyId: string;
  readonly compliancePolicyVersion: string;
} {
  if (
    intent.bindingState !== 'BOUND'
    || !intent.bindingVersion?.trim()
    || !intent.clientOrderId?.trim()
    || !intent.riskDecisionId?.trim()
    || !intent.riskDecisionHash?.trim()
    || !intent.riskPolicyId?.trim()
    || !intent.riskPolicyVersion?.trim()
    || !intent.complianceDecisionId?.trim()
    || !intent.complianceDecisionHash?.trim()
    || !intent.compliancePolicyId?.trim()
    || !intent.compliancePolicyVersion?.trim()
  ) {
    throw new Error('[FinTechCore][Persistence] FT-6 BOUND OrderIntent is missing immutable binding fields.');
  }
}

/**
 * FT-3 through FT-6 production durability adapter.
 * Private tables remain service-role-only behind narrow SECURITY INVOKER RPCs. Persistence is
 * evidence durability only and grants no exchange, custody, settlement or execution authority.
 */
export class SupabaseFinTechCorePersistenceAdapter
implements FinTechCorePersistencePort, FinTechCoreDomainEventReaderPort {
  async createWorkflowRun(input: FinTechCoreWorkflowRunPersistenceInput): Promise<void> {
    assertWorkflowCreationInput(input);
    const { context, state } = input;
    await callPersistenceRpc('fintech_core_create_workflow_run_v1', {
      p_run_id: context.runId,
      p_contract_version: context.contractVersion,
      p_state_machine_version: state.stateMachineVersion,
      p_trace_id: context.traceId,
      p_correlation_id: context.correlationId,
      p_module_id: context.moduleId,
      p_strategy_id: context.strategyId ?? null,
      p_portfolio_id: context.portfolioId ?? null,
      p_decision_version: context.decisionVersion,
      p_operating_mode: context.operatingMode,
      p_asset_id: context.asset.assetId,
      p_asset_identity: context.asset,
      p_status: state.status,
      p_sequence: state.sequence,
      p_started_at: context.startedAt,
      p_updated_at: state.updatedAt,
      p_evidence_refs: [...(input.evidenceRefs ?? [])],
    }, 'FinTech Core workflow creation');
  }

  async persistWorkflowTransition(input: FinTechCoreWorkflowTransitionPersistenceInput): Promise<void> {
    assertWorkflowTransitionInput(input);
    const { previousState, nextState } = input;
    const completedAt = TERMINAL_WORKFLOW_STATUSES.has(nextState.status) ? nextState.updatedAt : null;
    await callPersistenceRpc('fintech_core_advance_workflow_run_v1', {
      p_run_id: nextState.runId,
      p_expected_status: previousState.status,
      p_expected_sequence: previousState.sequence,
      p_next_status: nextState.status,
      p_next_sequence: nextState.sequence,
      p_updated_at: nextState.updatedAt,
      p_completed_at: completedAt,
    }, 'FinTech Core workflow transition');
  }

  async appendDomainEvent(event: FinTechCoreDomainEvent): Promise<void> {
    await callPersistenceRpc('fintech_core_append_domain_event_v1', {
      p_event_id: event.eventId,
      p_contract_version: event.contractVersion,
      p_event_type: event.eventType,
      p_event_version: event.eventVersion,
      p_run_id: event.runId,
      p_trace_id: event.traceId,
      p_correlation_id: event.correlationId,
      p_causation_id: event.causationId ?? null,
      p_module_id: event.moduleId,
      p_asset_id: event.assetId,
      p_decision_version: event.decisionVersion,
      p_occurred_at: event.occurredAt,
      p_evidence_refs: [...event.evidenceRefs],
      p_payload: event.payload,
    }, 'FinTech Core domain-event append');
  }

  async listDomainEvents(runId: string): Promise<readonly FinTechCoreDomainEvent[]> {
    if (!runId.trim()) {
      throw new Error('[FinTechCore][Persistence] runId is required for domain-event replay.');
    }
    const context = 'FinTech Core domain-event replay';
    assertPrivilegedSupabaseConfigured(context);
    const supabase = getPrivilegedServerSupabase();
    const { data, error } = await supabase.rpc('fintech_core_list_domain_events_v1', { p_run_id: runId });
    if (error) throw new Error(`[FinTechCore][Persistence] ${context} failed: ${errorMessage(error)}`);
    if (!Array.isArray(data)) {
      throw new Error(`[FinTechCore][Persistence] ${context} returned an invalid row set.`);
    }
    return Object.freeze(data.map(mapDomainEventRow));
  }

  async appendDecisionRecord(record: FinTechCoreDecisionRecord): Promise<void> {
    await callPersistenceRpc('fintech_core_append_decision_record_v1', {
      p_decision_id: record.decisionId,
      p_contract_version: record.contractVersion,
      p_decision_type: record.decisionType,
      p_decision_version: record.decisionVersion,
      p_outcome: record.outcome,
      p_run_id: record.runId,
      p_trace_id: record.traceId,
      p_correlation_id: record.correlationId,
      p_module_id: record.moduleId,
      p_asset_id: record.assetId,
      p_policy_id: record.policyId ?? null,
      p_policy_version: record.policyVersion ?? null,
      p_input_hash: record.inputHash,
      p_output_hash: record.outputHash,
      p_evidence_refs: [...record.evidenceRefs],
      p_decided_at: record.decidedAt,
    }, 'FinTech Core decision-record append');
  }

  async appendOrderIntent(input: FinTechCoreOrderIntentPersistenceInput): Promise<void> {
    const intent = input.intent;
    if (intent.bindingState === 'BOUND') {
      assertBoundOrderIntent(intent);
      await callPersistenceRpc('fintech_core_append_order_intent_v2', {
        p_order_intent_id: intent.orderIntentId,
        p_contract_version: intent.contractVersion,
        p_order_intent_contract_version: intent.orderIntentContractVersion,
        p_binding_version: intent.bindingVersion,
        p_run_id: intent.runId,
        p_trace_id: intent.traceId,
        p_correlation_id: intent.correlationId,
        p_client_order_id: intent.clientOrderId,
        p_idempotency_key: intent.idempotencyKey,
        p_asset_id: intent.assetId,
        p_side: intent.side,
        p_quantity_fixed: intent.quantity,
        p_order_type: intent.orderType,
        p_price_bounds: intent.priceBounds,
        p_max_slippage_bps: intent.maxSlippageBps,
        p_strategy_id: intent.strategyId ?? null,
        p_portfolio_id: intent.portfolioId ?? null,
        p_decision_version: intent.decisionVersion,
        p_risk_decision_id: intent.riskDecisionId,
        p_risk_decision_hash: intent.riskDecisionHash,
        p_risk_policy_id: intent.riskPolicyId,
        p_risk_policy_version: intent.riskPolicyVersion,
        p_compliance_decision_id: intent.complianceDecisionId,
        p_compliance_decision_hash: intent.complianceDecisionHash,
        p_compliance_policy_id: intent.compliancePolicyId,
        p_compliance_policy_version: intent.compliancePolicyVersion,
        p_created_at: intent.createdAt,
        p_expires_at: intent.expiresAt,
        p_intent_hash: intent.intentHash,
        p_effect_class: intent.effectClass,
        p_evidence_refs: [...(input.evidenceRefs ?? [])],
      }, 'FinTech Core FT-6 order-intent append');
      return;
    }

    await callPersistenceRpc('fintech_core_append_order_intent_v1', {
      p_order_intent_id: intent.orderIntentId,
      p_contract_version: intent.contractVersion,
      p_run_id: intent.runId,
      p_trace_id: intent.traceId,
      p_correlation_id: intent.correlationId,
      p_idempotency_key: intent.idempotencyKey,
      p_asset_id: intent.assetId,
      p_side: intent.side,
      p_quantity: finTechCoreFixedPointToDecimalString(intent.quantity),
      p_order_type: intent.orderType,
      p_limit_price: intent.priceBounds.limitPrice
        ? finTechCoreFixedPointToDecimalString(intent.priceBounds.limitPrice)
        : null,
      p_max_slippage_bps: intent.maxSlippageBps,
      p_strategy_id: intent.strategyId ?? null,
      p_portfolio_id: intent.portfolioId ?? null,
      p_decision_version: intent.decisionVersion,
      p_risk_approval: intent.riskApproval,
      p_compliance_approval: intent.complianceApproval,
      p_expires_at: intent.expiresAt,
      p_intent_hash: intent.intentHash,
      p_effect_class: intent.effectClass,
      p_evidence_refs: [...(input.evidenceRefs ?? [])],
    }, 'FinTech Core legacy UNBOUND order-intent append');
  }

  async appendReconciliationRecord(record: FinTechCoreReconciliationRecord): Promise<void> {
    await callPersistenceRpc('fintech_core_append_reconciliation_record_v2', {
      p_reconciliation_id: record.reconciliationId,
      p_reconciliation_contract_version: record.reconciliationContractVersion,
      p_run_id: record.runId,
      p_trace_id: record.traceId,
      p_correlation_id: record.correlationId,
      p_order_intent_id: record.orderIntentId,
      p_client_order_id: record.clientOrderId,
      p_venue_order_id: record.venueOrderId ?? null,
      p_reconciliation_type: record.reconciliationType,
      p_status: record.status,
      p_settlement_state: record.settlementState,
      p_source_system: record.sourceSystem,
      p_target_system: record.targetSystem,
      p_asset_id: record.assetId,
      p_expected_quantity: record.expectedQuantity,
      p_observed_quantity: record.observedQuantity ?? null,
      p_expected_price_bounds: record.expectedPriceBounds,
      p_observed_execution_price: record.observedExecutionPrice ?? null,
      p_fee_evidence: record.feeEvidence ?? null,
      p_observed_at: record.observedAt,
      p_reconciled_at: record.reconciledAt,
      p_input_hash: record.inputHash,
      p_output_hash: record.outputHash,
      p_evidence_refs: [...record.evidenceRefs],
      p_supervisor_escalation_required: record.supervisorEscalationRequired,
      p_details: record.details,
    }, 'FinTech Core FT-6 reconciliation append');
  }
}

export function createSupabaseFinTechCorePersistenceAdapter():
FinTechCorePersistencePort & FinTechCoreDomainEventReaderPort {
  return new SupabaseFinTechCorePersistenceAdapter();
}
