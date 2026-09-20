import { describe, expect, it, vi } from 'vitest';
import {
  ENTERPRISE_COST_CENTER_AI_CREDIT_POOL_ENABLED,
  ENTERPRISE_COST_CENTER_NAME,
  createGitHubEnterpriseCostCenterWriter,
} from '../../scripts/operations/githubEnterpriseCostCenterWriter.mjs';

function reader(active: any[] = [], deleted: any[] = []) {
  return {
    execute: vi.fn(async (_capability: string, input: { state: string }) => (
      input.state === 'active' ? active : deleted
    )),
  };
}

describe('GitHub Enterprise Cost Center Writer', () => {
  it('is idempotent when Enterprise already exists', async () => {
    const billingReader = reader([
      { id: 'cc-1', name: 'Enterprise', state: 'active', aiCreditPoolEnabled: false },
    ]);
    const createCostCenter = vi.fn();

    const writer = createGitHubEnterpriseCostCenterWriter({ billingReader, createCostCenter });
    const result = await writer.ensure();

    expect(result).toMatchObject({ status: 'EXISTS', created: false });
    expect(createCostCenter).not.toHaveBeenCalled();
  });

  it('creates exactly the canonical Enterprise cost center when none exists', async () => {
    const billingReader = reader();
    const createCostCenter = vi.fn(async (input) => ({
      id: 'cc-new',
      name: input.name,
      state: 'active',
      ai_credit_pool_enabled: input.aiCreditPoolEnabled,
    }));

    const writer = createGitHubEnterpriseCostCenterWriter({ billingReader, createCostCenter });
    const result = await writer.ensure();

    expect(createCostCenter).toHaveBeenCalledTimes(1);
    expect(createCostCenter).toHaveBeenCalledWith({
      name: ENTERPRISE_COST_CENTER_NAME,
      aiCreditPoolEnabled: ENTERPRISE_COST_CENTER_AI_CREDIT_POOL_ENABLED,
    });
    expect(result).toMatchObject({
      status: 'CREATED',
      created: true,
      costCenter: { id: 'cc-new', name: 'Enterprise', aiCreditPoolEnabled: false },
    });
  });

  it('fails closed when an archived Enterprise cost center exists', async () => {
    const billingReader = reader([], [
      { id: 'cc-old', name: 'Enterprise', state: 'deleted', aiCreditPoolEnabled: false },
    ]);
    const createCostCenter = vi.fn();

    const writer = createGitHubEnterpriseCostCenterWriter({ billingReader, createCostCenter });

    await expect(writer.ensure()).rejects.toThrow(/archived Enterprise cost center/);
    expect(createCostCenter).not.toHaveBeenCalled();
  });

  it('fails closed when duplicate active Enterprise cost centers exist', async () => {
    const billingReader = reader([
      { id: 'cc-1', name: 'Enterprise', state: 'active', aiCreditPoolEnabled: false },
      { id: 'cc-2', name: 'enterprise', state: 'active', aiCreditPoolEnabled: false },
    ]);
    const createCostCenter = vi.fn();

    const writer = createGitHubEnterpriseCostCenterWriter({ billingReader, createCostCenter });

    await expect(writer.ensure()).rejects.toThrow(/multiple active Enterprise cost centers/);
    expect(createCostCenter).not.toHaveBeenCalled();
  });
});
