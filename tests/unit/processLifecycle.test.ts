import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installProcessLifecycleHandlers,
  type ProcessLifecycleTarget,
} from '../../server/bootstrap/processLifecycle';
import {
  getProcessHealthSnapshot,
  resetProcessHealthForTests,
} from '../../server/runtime/processHealth';

const logger = {
  error: vi.fn(),
  info: vi.fn(),
};

let dispose: (() => void) | undefined;

beforeEach(() => {
  resetProcessHealthForTests();
  logger.error.mockClear();
  logger.info.mockClear();
  dispose = undefined;
});

afterEach(() => {
  dispose?.();
  resetProcessHealthForTests();
});

describe('process lifecycle fatal handling', () => {
  it('latches uncaughtException as fatal before invoking bounded shutdown once', () => {
    const target = new EventEmitter() as unknown as ProcessLifecycleTarget;
    const onFatal = vi.fn();
    dispose = installProcessLifecycleHandlers(logger, { onFatal }, target);
    const error = new Error('fatal-test');

    (target as unknown as EventEmitter).emit('uncaughtException', error);

    expect(getProcessHealthSnapshot()).toMatchObject({
      healthy: false,
      fatalSource: 'uncaughtException',
    });
    expect(onFatal).toHaveBeenCalledTimes(1);
    expect(onFatal).toHaveBeenCalledWith('uncaughtException', error);
    expect(logger.error).toHaveBeenCalledWith('Uncaught exception', expect.objectContaining({
      fatalSource: 'uncaughtException',
      error: 'fatal-test',
    }));
  });

  it('treats unhandledRejection as fatal and never starts a second shutdown sequence', () => {
    const emitter = new EventEmitter();
    const target = emitter as unknown as ProcessLifecycleTarget;
    const onFatal = vi.fn();
    dispose = installProcessLifecycleHandlers(logger, { onFatal }, target);

    emitter.emit('unhandledRejection', 'promise-failure');
    emitter.emit('uncaughtException', new Error('secondary-failure'));

    expect(getProcessHealthSnapshot()).toMatchObject({
      healthy: false,
      fatalSource: 'unhandledRejection',
    });
    expect(onFatal).toHaveBeenCalledTimes(1);
    expect(onFatal.mock.calls[0][0]).toBe('unhandledRejection');
    expect(onFatal.mock.calls[0][1]).toBeInstanceOf(Error);
    expect(onFatal.mock.calls[0][1].message).toBe('promise-failure');
    expect(logger.error).toHaveBeenCalledTimes(2);
  });

  it('removes installed listeners when disposed', () => {
    const emitter = new EventEmitter();
    const target = emitter as unknown as ProcessLifecycleTarget;
    const onFatal = vi.fn();
    dispose = installProcessLifecycleHandlers(logger, { onFatal }, target);

    dispose();
    dispose = undefined;
    emitter.emit('uncaughtException', new Error('after-dispose'));

    expect(onFatal).not.toHaveBeenCalled();
    expect(getProcessHealthSnapshot().healthy).toBe(true);
  });
});
