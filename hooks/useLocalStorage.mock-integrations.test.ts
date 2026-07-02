import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

const store: Record<string, string> = {};

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn((k: string) => store[k] ?? null),
      setItem: vi.fn((k: string, v: string) => {
        store[k] = v;
      }),
      removeItem: vi.fn((k: string) => {
        delete store[k];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((k) => delete store[k]);
      }),
    },
    writable: true,
    configurable: true,
  });
});

describe('useLocalStorage mock-integrations', () => {
  it('queries the local cache state before re-reading from storage on successive renders', () => {
    store['theme'] = JSON.stringify('dark');
    const { result, rerender } = renderHook(() => useLocalStorage('theme', 'light'));
    expect(result.current[0]).toBe('dark');
    store['theme'] = JSON.stringify('light');
    rerender();
    expect(result.current[0]).toBe('dark');
    expect(window.localStorage.getItem).toHaveBeenCalledTimes(1);
  });

  it('falls back to the initial value when localStorage.getItem throws', () => {
    window.localStorage.getItem = vi.fn(() => {
      throw new Error('Storage unreachable');
    });
    const { result } = renderHook(() => useLocalStorage('key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('updates internal cache state even when localStorage.setItem fails', () => {
    window.localStorage.setItem = vi.fn(() => {
      throw new Error('Quota exceeded');
    });
    const { result } = renderHook(() => useLocalStorage('key', 'initial'));
    act(() => {
      result.current[1]('new-value');
    });
    expect(result.current[0]).toBe('new-value');
  });

  it('resyncs from storage when the key changes (simulating key rotation)', () => {
    store['a'] = JSON.stringify('value-a');
    store['b'] = JSON.stringify('value-b');
    const { result, rerender } = renderHook(({ key }) => useLocalStorage(key, 'default'), {
      initialProps: { key: 'a' },
    });
    expect(result.current[0]).toBe('value-a');
    rerender({ key: 'b' });
    expect(result.current[0]).toBe('value-b');
  });

  it('writes to localStorage on setValue and the written value is retrievable', () => {
    const { result } = renderHook(() => useLocalStorage('syncKey', 'initial'));
    act(() => {
      result.current[1]('synced-value');
    });
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'syncKey',
      JSON.stringify('synced-value')
    );
    expect(JSON.parse(store['syncKey'])).toBe('synced-value');
  });
});
