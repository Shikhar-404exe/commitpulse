import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportButton from './ExportButton';
import { useExportImage } from '@/hooks/useExportImage';

const mockExportImage = vi.fn();

vi.mock('@/hooks/useExportImage', () => ({
  useExportImage: vi.fn(() => ({
    exportImage: mockExportImage,
    isExporting: false,
    error: null,
  })),
}));

describe('ExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useExportImage).mockImplementation(() => ({
      exportImage: mockExportImage,
      isExporting: false,
      error: null,
    }));
  });

  it('renders the export button', () => {
    render(<ExportButton />);
    expect(screen.getByRole('button', { name: /export/i })).toBeDefined();
  });

  it('opens the dropdown on click', async () => {
    const user = userEvent.setup();
    render(<ExportButton />);
    await user.click(screen.getByRole('button', { name: /export/i }));
    expect(screen.getByRole('menu')).toBeDefined();
    expect(screen.getByText('Download PNG')).toBeDefined();
    expect(screen.getByText('Download SVG')).toBeDefined();
  });

  it('calls exportImage on PNG selection', async () => {
    const user = userEvent.setup();
    render(<ExportButton />);
    await user.click(screen.getByRole('button', { name: /export/i }));
    await user.click(screen.getByText('Download PNG'));
    expect(mockExportImage).toHaveBeenCalledWith('png');
  });

  it('closes dropdown after selecting a format', async () => {
    const user = userEvent.setup();
    render(<ExportButton />);
    await user.click(screen.getByRole('button', { name: /export/i }));
    await user.click(screen.getByText('Download SVG'));
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('disables the button when exporting', () => {
    vi.mocked(useExportImage).mockImplementation(() => ({
      exportImage: mockExportImage,
      isExporting: true,
      error: null,
    }));
    render(<ExportButton />);
    expect(screen.getByRole('button', { name: /exporting/i })).toBeDisabled();
  });

  it('closes dropdown when clicking the backdrop overlay', async () => {
    const user = userEvent.setup();
    const { container } = render(<ExportButton />);
    await user.click(screen.getByRole('button', { name: /export/i }));
    expect(screen.getByRole('menu')).toBeDefined();
    const overlay = container.querySelector('.fixed.inset-0');
    expect(overlay).not.toBeNull();
    if (overlay) fireEvent.click(overlay);
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
