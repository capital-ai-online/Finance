import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  ASYNC_EXECUTION_ENVELOPE_SCHEMA,
  InlineAsyncExecutionPort,
  validateAsyncExecutionEnvelope,
  type AsyncExecutionEnvelope,
} from '../../src/platform/Supervisor/Execution/AsyncExecutionPort';

function task(payload: { value: number }): AsyncExecutionEnvelope<{ value: number }> {
  return {
    schemaVersion: ASYNC_EXECUTION_ENVELOPE_SCHEMA,
    taskType: 'test.task',
    taskId: 'task-1',
    correlationId: 'corr-1',
    createdAt: new Date().toISOString(),
    payload,
    policy: { maxAttempts: 2, timeoutMs: 5_000 },
  };
}

describe('AsyncExecutionPort', () => {
  it('preserves inline behavior behind a provider-neutral serializable envelope', async () => {
    const handler = vi.fn(async (_payload: { value: number }) => undefined);
    const port = new InlineAsyncExecutionPort({ 'test.task': handler });

    const receipt = await port.dispatch(task({ value: 42 }));

    expect(handler).toHaveBeenCalledWith({ value: 42 });
    expect(receipt).toEqual({
      accepted: true,
      mode: 'inline',
      taskType: 'test.task',
      taskId: 'task-1',
      correlationId: 'corr-1',
      completedInline: true,
    });
  });

  it('fails closed for an unregistered task type', async () => {
    const port = new InlineAsyncExecutionPort({});
    await expect(port.dispatch(task({ value: 1 }))).rejects.toThrow('no inline handler registered');
  });

  it('validates execution metadata without making business decisions', () => {
    const invalid = task({ value: 1 });
    invalid.policy.maxAttempts = 0;
    expect(() => validateAsyncExecutionEnvelope(invalid)).toThrow('maxAttempts');
  });

  it('keeps Render Workflows out of the canonical domain/supervisor contract', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/platform/Supervisor/Execution/AsyncExecutionPort.ts'),
      'utf8',
    );
    expect(source).not.toContain('@render');
    expect(source).not.toContain('render.com');
    expect(source).toContain('MUST NOT choose a domain orchestrator');
  });
});
