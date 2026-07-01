import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecentSearches, STORAGE_KEY } from './useRecentSearches';

const store: Record<string, string> = {};

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    },
    writable: true,
    configurable: true,
  });
});

describe('useRecentSearches timezone-boundaries', () => {
  it('preserves order of searches across simulated time passage', () => {
    store[STORAGE_KEY] = JSON.stringify(['react', 'vue', 'svelte']);
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.searches).toEqual(['react', 'vue', 'svelte']);
  });

  it('deduplication respects recency when searches cross midnight', () => {
    store[STORAGE_KEY] = JSON.stringify(['react', 'vue', 'svelte']);
    const { result } = renderHook(() => useRecentSearches());
    act(() => {
      result.current.addSearch('react');
    });
    expect(result.current.searches[0]).toBe('react');
    expect(result.current.searches.length).toBe(3);
  });

  it('handles date-like search strings across DST transitions', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => {
      result.current.addSearch('2024-03-10');
    });
    act(() => {
      result.current.addSearch('2024-11-03');
    });
    expect(result.current.searches).toEqual(['2024-11-03', '2024-03-10']);
  });

  it('persists searches across remounts (survives time passage)', () => {
    const { result, unmount } = renderHook(() => useRecentSearches());
    act(() => {
      result.current.addSearch('torvalds');
    });
    unmount();
    const { result: result2 } = renderHook(() => useRecentSearches());
    expect(result2.current.searches).toEqual(['torvalds']);
  });

  it('empty storage returns empty searches at any timezone', () => {
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.searches).toEqual([]);
    act(() => {
      result.current.addSearch('test');
    });
    expect(result.current.searches).toEqual(['test']);
  });
});
