import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncQueue } from './syncQueue';

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

describe('SyncQueue', () => {
  let queue: SyncQueue;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    queue = new SyncQueue();
    vi.useFakeTimers();
  });

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
    vi.useRealTimers();
  });

  it('executes a single task when enqueued', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    queue.enqueue(fn);
    await vi.runAllTimersAsync();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('executes tasks sequentially with stagger delay', async () => {
    const order: number[] = [];
    queue.enqueue(async () => {
      order.push(1);
    });
    queue.enqueue(async () => {
      order.push(2);
    });

    // First task runs immediately, second waits for stagger delay
    await vi.advanceTimersByTimeAsync(2100);
    expect(order).toEqual([1, 2]);
  });

  it('does not enqueue duplicate tasks while the first is pending', () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    queue.enqueue(fn);
    // Second enqueue of the same task reference — not truly duplicate detection
    // but tests that isProcessing flag prevents concurrent execution
    queue.enqueue(fn);
    // Only one should be called since isProcessing blocks
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('isolates errors so one failing task does not block the next', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = vi.fn().mockRejectedValue(new Error('task error'));
    const succeeding = vi.fn().mockResolvedValue(undefined);

    queue.enqueue(failing);
    queue.enqueue(succeeding);

    await vi.advanceTimersByTimeAsync(2100);

    expect(failing).toHaveBeenCalledTimes(1);
    expect(succeeding).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith('[SyncQueue] Task failed:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('reports pending task count via pendingTasks', () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    queue.enqueue(fn);
    queue.enqueue(fn);
    // One is processing, one is pending
    expect(queue.pendingTasks).toBe(1);
  });

  it('bypasses queue and runs immediately in test environment', async () => {
    process.env.NODE_ENV = 'test';
    const queue2 = new SyncQueue();
    const fn = vi.fn().mockResolvedValue(undefined);
    queue2.enqueue(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
