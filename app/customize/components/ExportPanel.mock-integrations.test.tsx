import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { ExportPanel } from './ExportPanel';

vi.mock('../utils', () => ({
  getPlaceholderSnippet: (format: string) => `placeholder-${format}`,
}));

describe('ExportPanel mock integrations', () => {
  const baseProps = {
    format: 'markdown' as const,
    snippet: '# Hello World',
    copied: false,
    hasUsername: true,
    onFormatChange: vi.fn(),
    onCopy: vi.fn(),
  };

  it('renders the format label based on current format', () => {
    const { rerender } = render(<ExportPanel {...baseProps} />);
    expect(screen.getByText('Markdown Export Snippet')).toBeInTheDocument();
    rerender(<ExportPanel {...baseProps} format="html" />);
    expect(screen.getByText('HTML Export Snippet')).toBeInTheDocument();
  });

  it('renders format toggle buttons with aria-pressed', () => {
    render(<ExportPanel {...baseProps} />);
    const formatGroup = screen.getByLabelText('Export format');
    const mdBtn = within(formatGroup).getByRole('button', { name: /markdown/i });
    const htmlBtn = within(formatGroup).getByRole('button', { name: /html/i });
    expect(mdBtn).toHaveAttribute('aria-pressed', 'true');
    expect(htmlBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onFormatChange when a format button is clicked', () => {
    const onFormatChange = vi.fn();
    render(<ExportPanel {...baseProps} onFormatChange={onFormatChange} />);
    fireEvent.click(screen.getByRole('button', { name: /html/i }));
    expect(onFormatChange).toHaveBeenCalledWith('html');
  });

  it('disables copy button when hasUsername is false', () => {
    render(<ExportPanel {...baseProps} hasUsername={false} />);
    expect(screen.getByRole('button', { name: /copy/i })).toBeDisabled();
  });

  it('shows Copied! text when copied is true', () => {
    const { rerender } = render(<ExportPanel {...baseProps} />);
    expect(screen.getByRole('button', { name: /copy/i })).toHaveTextContent(/copy/i);
    rerender(<ExportPanel {...baseProps} copied={true} />);
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('calls onCopy when copy button is clicked', () => {
    const onCopy = vi.fn();
    render(<ExportPanel {...baseProps} onCopy={onCopy} />);
    fireEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(onCopy).toHaveBeenCalledOnce();
  });

  it('shows the snippet when hasUsername is true', () => {
    render(<ExportPanel {...baseProps} snippet="# Hello World" />);
    expect(screen.getByText('# Hello World')).toBeInTheDocument();
  });

  it('shows placeholder when hasUsername is false', () => {
    render(<ExportPanel {...baseProps} hasUsername={false} />);
    expect(screen.getByText('placeholder-markdown')).toBeInTheDocument();
  });

  it('shows placeholder with correct format when format changes', () => {
    render(<ExportPanel {...baseProps} hasUsername={false} format="html" />);
    expect(screen.getByText('placeholder-html')).toBeInTheDocument();
  });
});
