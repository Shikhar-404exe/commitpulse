import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, fireEvent } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('useKeyboardShortcuts', () => {
  let addEventSpy: ReturnType<typeof vi.spyOn>;
  let removeEventSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    addEventSpy = vi.spyOn(window, 'addEventListener');
    removeEventSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers a keydown listener on mount', () => {
    renderHook(() => useKeyboardShortcuts());
    expect(addEventSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('navigates on g then d shortcut', () => {
    renderHook(() => useKeyboardShortcuts());
    fireEvent.keyDown(window, { key: 'g' });
    fireEvent.keyDown(window, { key: 'd' });
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('navigates on g then c shortcut', () => {
    renderHook(() => useKeyboardShortcuts());
    fireEvent.keyDown(window, { key: 'g' });
    fireEvent.keyDown(window, { key: 'c' });
    expect(mockPush).toHaveBeenCalledWith('/contributors');
  });

  it('does not navigate when modifier keys are held', () => {
    renderHook(() => useKeyboardShortcuts());
    fireEvent.keyDown(window, { key: 'g', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'd' });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not navigate when focus is on an input element', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    renderHook(() => useKeyboardShortcuts());
    fireEvent.keyDown(input, { key: 'g' });
    fireEvent.keyDown(input, { key: 'd' });
    expect(mockPush).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('removes event listener on unmount', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts());
    unmount();
    expect(removeEventSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
