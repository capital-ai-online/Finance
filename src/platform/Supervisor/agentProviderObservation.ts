/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Supervisor observation of the DEVELOPMENT Chain / AI value-chain agent providers.
 * Read-only. Does not grant authority. Complements ESS-0002 Observation Domains (AI-Wertschöpfungskette).
 * Owner 2026-08-16: canonical providers = ChatGPT, Claude, Grok.
 */

import {
  CANONICAL_VALUE_CHAIN_PROVIDER_IDS,
  evaluateProviderCutoverReadiness,
  getCanonicalValueChainProviderInventory,
  PROVIDER_PROFILES,
  RETIRED_PROVIDER_ALIASES,
  type ProviderCutoverEvidence,
  type ProviderCutoverReadinessDecision,
} from '../Security/providerProfile';

export interface AgentProviderObservation {
  inventoryComplete: boolean;
  expectedProviders: readonly string[];
  presentProviders: string[];
  missingProviders: string[];
  retiredAliases: readonly string[];
  cutoverByProvider: Record<string, ProviderCutoverReadinessDecision['status']>;
  notes: string[];
}

/** Empty evidence → fail-closed readiness snapshot for observation only. */
const EMPTY_EVIDENCE: ProviderCutoverEvidence = {
  realCallerVerified: false,
  canonicalControlPlanePathVerified: false,
  providerSpecificBypassDenied: false,
  auditCorrelationVerified: false,
  rollbackToReadOnlyVerified: false,
  externalHostConfigurationVerified: false,
};

/**
 * Observe the agent provider control-plane surface used by DEVELOPMENT Chain / M8.
 * Never elevates authority; reports only registry completeness and cutover readiness status.
 */
export function observeAgentProviderChain(
  evidenceByProvider: Partial<Record<string, ProviderCutoverEvidence>> = {},
): AgentProviderObservation {
  const inventory = getCanonicalValueChainProviderInventory();
  const cutoverByProvider: Record<string, ProviderCutoverReadinessDecision['status']> = {};

  for (const id of CANONICAL_VALUE_CHAIN_PROVIDER_IDS) {
    const evidence = evidenceByProvider[id] ?? EMPTY_EVIDENCE;
    cutoverByProvider[id] = evaluateProviderCutoverReadiness(id, evidence).status;
  }

  for (const alias of RETIRED_PROVIDER_ALIASES) {
    cutoverByProvider[alias] = evaluateProviderCutoverReadiness(alias, EMPTY_EVIDENCE).status;
  }

  const notes: string[] = [
    'Canonical DEVELOPMENT Chain / AI value-chain providers (Owner 2026-08-16): ChatGPT, Claude, Grok.',
    'Google AI Studio, NotebookLM and Gemini are retired aliases — not part of the active value chain.',
    'Cutover statuses without injected evidence are fail-closed (BLOCKED until full M8 evidence).',
    `Active registry size: ${Object.keys(PROVIDER_PROFILES).length}.`,
  ];

  if (!inventory.complete) {
    notes.push(`Missing canonical profiles: ${inventory.missing.join(', ')}`);
  }

  return {
    inventoryComplete: inventory.complete,
    expectedProviders: [...inventory.expected],
    presentProviders: [...inventory.present],
    missingProviders: [...inventory.missing],
    retiredAliases: [...RETIRED_PROVIDER_ALIASES],
    cutoverByProvider,
    notes,
  };
}
