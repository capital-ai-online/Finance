import { describe, expect, it, vi } from 'vitest';
import { runPdfExportFlow } from '../../src/lib/pdfExportFlow';

describe('runPdfExportFlow', () => {
  it('prepares, consumes and only then commits a limited export', async () => {
    const order: string[] = [];
    const commit = vi.fn(async () => { order.push('commit'); });
    const result = await runPdfExportFlow({
      unlimited: false,
      prepareExport: async () => { order.push('prepare'); return commit; },
      consumeCredit: async () => { order.push('consume'); return { credits: 2 }; },
    });

    expect(order).toEqual(['prepare', 'consume', 'commit']);
    expect(result).toEqual({ credits: 2 });
  });

  it('does not consume or download when PDF preparation fails', async () => {
    const consumeCredit = vi.fn();
    const commit = vi.fn();

    await expect(runPdfExportFlow({
      unlimited: false,
      prepareExport: async () => { throw new Error('generation failed'); },
      consumeCredit,
    })).rejects.toThrow('generation failed');

    expect(consumeCredit).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
  });

  it('does not download when the authenticated debit is rejected', async () => {
    const commit = vi.fn();

    await expect(runPdfExportFlow({
      unlimited: false,
      prepareExport: async () => commit,
      consumeCredit: async () => { throw new Error('unauthorized'); },
    })).rejects.toThrow('unauthorized');

    expect(commit).not.toHaveBeenCalled();
  });

  it('never consumes credits for unlimited Enterprise exports', async () => {
    const consumeCredit = vi.fn();
    const commit = vi.fn();

    const result = await runPdfExportFlow({
      unlimited: true,
      prepareExport: async () => commit,
      consumeCredit,
    });

    expect(consumeCredit).not.toHaveBeenCalled();
    expect(commit).toHaveBeenCalledOnce();
    expect(result).toBeNull();
  });
});
