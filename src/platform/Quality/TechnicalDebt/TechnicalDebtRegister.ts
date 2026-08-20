import type {
  TechnicalDebtItem,
  TechnicalDebtSnapshot,
} from '../Contracts/QualityCenterContract';

export const TECHNICAL_DEBT_REGISTER_VERSION = 'technical-debt-register/1.0.0' as const;

export interface TechnicalDebtRecordInput extends Omit<TechnicalDebtItem, 'status' | 'resolvedAt' | 'resolutionEvidenceRefs'> {
  status?: never;
  resolvedAt?: never;
  resolutionEvidenceRefs?: never;
}

function cloneItem(item: TechnicalDebtItem): TechnicalDebtItem {
  return Object.freeze({
    ...item,
    sourceRefs: Object.freeze([...item.sourceRefs]),
    resolutionEvidenceRefs: Object.freeze([...item.resolutionEvidenceRefs]),
  });
}

function validateRecord(input: TechnicalDebtRecordInput): void {
  if (!input.id.trim()) throw new Error('[TechnicalDebtRegister] id is required.');
  if (!input.component.trim()) throw new Error('[TechnicalDebtRegister] component is required.');
  if (!input.cause.trim()) throw new Error('[TechnicalDebtRegister] cause is required.');
  if (!input.impact.trim()) throw new Error('[TechnicalDebtRegister] impact is required.');
  if (Number.isNaN(Date.parse(input.createdAt))) {
    throw new Error('[TechnicalDebtRegister] createdAt must be an ISO-compatible timestamp.');
  }
  if (input.sourceRefs.length === 0) {
    throw new Error('[TechnicalDebtRegister] at least one source reference is required.');
  }
}

export class TechnicalDebtRegister {
  private readonly entries = new Map<string, TechnicalDebtItem>();

  constructor(initialItems: readonly TechnicalDebtItem[] = []) {
    for (const item of initialItems) {
      if (this.entries.has(item.id)) throw new Error(`[TechnicalDebtRegister] duplicate debt id ${item.id}.`);
      this.entries.set(item.id, cloneItem(item));
    }
  }

  record(input: TechnicalDebtRecordInput): TechnicalDebtItem {
    validateRecord(input);
    if (this.entries.has(input.id)) {
      throw new Error(`[TechnicalDebtRegister] technical debt ${input.id} already exists.`);
    }

    const item = cloneItem({
      ...input,
      status: 'OPEN',
      resolvedAt: null,
      resolutionEvidenceRefs: [],
    });
    this.entries.set(item.id, item);
    return item;
  }

  list(component?: string): readonly TechnicalDebtItem[] {
    const items = [...this.entries.values()]
      .filter((item) => !component || item.component === component)
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(cloneItem);
    return Object.freeze(items);
  }

  resolve(id: string, evidenceRefs: readonly string[], resolvedAt = new Date().toISOString()): TechnicalDebtItem {
    const existing = this.entries.get(id);
    if (!existing) throw new Error(`[TechnicalDebtRegister] unknown technical debt ${id}.`);
    if (existing.status === 'RESOLVED') {
      throw new Error(`[TechnicalDebtRegister] technical debt ${id} is already resolved.`);
    }
    if (evidenceRefs.length === 0 || evidenceRefs.some((ref) => !ref.trim())) {
      throw new Error('[TechnicalDebtRegister] resolution requires non-empty evidence references.');
    }
    if (Number.isNaN(Date.parse(resolvedAt))) {
      throw new Error('[TechnicalDebtRegister] resolvedAt must be an ISO-compatible timestamp.');
    }

    const resolved = cloneItem({
      ...existing,
      status: 'RESOLVED',
      resolvedAt,
      resolutionEvidenceRefs: Object.freeze([...evidenceRefs]),
    });
    this.entries.set(id, resolved);
    return resolved;
  }

  snapshot(): TechnicalDebtSnapshot {
    const items = this.list();
    return Object.freeze({
      schemaVersion: 'technical-debt-register/1.0.0' as const,
      open: items.filter((item) => item.status === 'OPEN').length,
      resolved: items.filter((item) => item.status === 'RESOLVED').length,
      items,
    });
  }
}
