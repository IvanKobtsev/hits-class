import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, describe, vi, beforeEach } from 'vitest';
import { AttachedFilesTable } from './AttachedFilesTable';

// Props contract for AttachedFilesTable (to be implemented).
// File size in bytes. status: too_large = over 400 MB, error = upload failed.
const MAX_FILE_SIZE_BYTES = 400 * 1024 * 1024;
const MAX_TOTAL_SIZE_BYTES = 1024 * 1024 * 1024;

describe('AttachedFilesTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  test('renders table with attached-files-table test id', () => {
    render(<AttachedFilesTable files={[]} onRemove={vi.fn()} />);

    expect(screen.getByTestId('attached-files-table')).toBeInTheDocument();
  });

  test('renders table with five columns: icon, name, size, progress, remove', () => {
    render(<AttachedFilesTable files={[]} onRemove={vi.fn()} />);

    const table = screen.getByTestId('attached-files-table');
    expect(table).toBeInTheDocument();
    const tableEl = table.closest('table') ?? table;
    const headerCells = tableEl.querySelectorAll('th');
    expect(headerCells.length).toBe(5);
  });

  test('renders one row per file with file icon, name and size', () => {
    const files = [
      { id: '1', name: 'report.pdf', size: 1024, status: 'uploaded' as const },
      { id: '2', name: 'image.png', size: 2048, status: 'uploaded' as const },
    ];
    render(<AttachedFilesTable files={files} onRemove={vi.fn()} />);

    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('image.png')).toBeInTheDocument();
    expect(screen.getByText(/1[.,]0.*KB|1024/)).toBeInTheDocument();
    expect(screen.getByText(/2[.,]0.*KB|2048/)).toBeInTheDocument();
    const rows = screen
      .getByTestId('attached-files-table')
      .querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  // --- Progress bar visibility ---

  test('shows progress bar in progress column when file is uploading', () => {
    const files = [
      {
        id: '1',
        name: 'doc.pdf',
        size: 1000,
        status: 'uploading' as const,
        progress: 50,
      },
    ];
    render(<AttachedFilesTable files={files} onRemove={vi.fn()} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('hides progress bar when file is fully uploaded', () => {
    const files = [
      { id: '1', name: 'doc.pdf', size: 1000, status: 'uploaded' as const },
    ];
    render(<AttachedFilesTable files={files} onRemove={vi.fn()} />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  // --- File too big (400 MB) ---

  test('shows "Размер файла не должен превышать 400 MB" in progress column when file is too big', () => {
    const files = [
      {
        id: '1',
        name: 'huge.zip',
        size: MAX_FILE_SIZE_BYTES + 1,
        status: 'too_large' as const,
      },
    ];
    render(<AttachedFilesTable files={files} onRemove={vi.fn()} />);

    expect(
      screen.getByText('Размер файла не должен превышать 400 MB'),
    ).toBeInTheDocument();
  });

  // --- Upload failed ---

  test('shows "Ошибка загрузки" in progress column when upload fails', () => {
    const files = [
      { id: '1', name: 'failed.pdf', size: 100, status: 'error' as const },
    ];
    render(<AttachedFilesTable files={files} onRemove={vi.fn()} />);

    expect(screen.getByText('Ошибка загрузки')).toBeInTheDocument();
  });

  // --- Remove button ---

  test('each row has a remove button', () => {
    const files = [
      { id: '1', name: 'a.pdf', size: 100, status: 'uploaded' as const },
    ];
    render(<AttachedFilesTable files={files} onRemove={vi.fn()} />);

    const removeButton = screen.getByRole('button', {
      name: /remove|delete|удалить|remove file/i,
    });
    expect(removeButton).toBeInTheDocument();
  });

  test('calls onRemove with file id when remove button is clicked', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const files = [
      { id: 'file-123', name: 'a.pdf', size: 100, status: 'uploaded' as const },
    ];
    render(<AttachedFilesTable files={files} onRemove={onRemove} />);

    const removeButton = screen.getByRole('button', {
      name: /remove|delete|удалить|remove file/i,
    });
    await user.click(removeButton);

    expect(onRemove).toHaveBeenCalledWith('file-123');
  });

  test('when parent removes file from list after onRemove, row disappears', async () => {
    const user = userEvent.setup();
    const initialFiles = [
      { id: '1', name: 'only.pdf', size: 100, status: 'uploaded' as const },
    ];
    let currentFiles = [...initialFiles];
    const onRemove = vi.fn((id: string) => {
      currentFiles = currentFiles.filter((f) => f.id !== id);
    });
    const { rerender } = render(
      <AttachedFilesTable files={currentFiles} onRemove={onRemove} />,
    );

    expect(screen.getByText('only.pdf')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', {
        name: /remove|delete|удалить|remove file/i,
      }),
    );
    expect(onRemove).toHaveBeenCalledWith('1');

    rerender(<AttachedFilesTable files={currentFiles} onRemove={onRemove} />);
    expect(screen.queryByText('only.pdf')).not.toBeInTheDocument();
  });

  // --- Total size over 1 GB → toast ---

  test('shows toast "Файлы не должны весить больше 1GB в сумме" when total size exceeds 1 GB', () => {
    const halfGb = Math.floor(MAX_TOTAL_SIZE_BYTES / 2) + 1;
    const files = [
      { id: '1', name: 'a.zip', size: halfGb, status: 'uploaded' as const },
      { id: '2', name: 'b.zip', size: halfGb, status: 'uploaded' as const },
    ];
    render(<AttachedFilesTable files={files} onRemove={vi.fn()} />);

    expect(
      screen.getByText(
        /Файлы не должны весить больше 1GB в сумме|Файлы не должны весть больше 1GB в сумме/i,
      ),
    ).toBeInTheDocument();
  });
});
