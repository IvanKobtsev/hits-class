import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { AddAttachmentPanel } from './AddAttachmentPanel';

const mockMutate = vi.fn();
vi.mock('services/api/api-client/FilesQuery', () => ({
  useUploadFileMutation: () => ({
    mutate: mockMutate,
    mutateAsync: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    data: undefined,
    error: null,
    reset: vi.fn(),
  }),
}));

function renderAddAttachmentPanel() {
  return render(<AddAttachmentPanel />);
}

describe('AddAttachmentPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  test('renders panel with add-attachment-panel test id', () => {
    renderAddAttachmentPanel();

    expect(screen.getByTestId('add-attachment-panel')).toBeInTheDocument();
  });

  test('renders AttachedFilesTable', () => {
    renderAddAttachmentPanel();

    expect(screen.getByTestId('attached-files-table')).toBeInTheDocument();
  });

  test('renders submit button', () => {
    renderAddAttachmentPanel();

    expect(
      screen.getByRole('button', { name: /submit|сдать|отправить/i }),
    ).toBeInTheDocument();
  });

  test('renders file input to add files', () => {
    renderAddAttachmentPanel();

    const input = screen.getByTestId('add-attachment-file-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'file');
  });

  // --- Upload on add (one by one) ---

  test('calls upload mutation with selected file when user selects one file', async () => {
    const user = userEvent.setup();
    renderAddAttachmentPanel();

    const file = new File(['content'], 'report.pdf', {
      type: 'application/pdf',
    });
    const input = screen.getByTestId('add-attachment-file-input');
    await user.upload(input, file);

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        file: expect.objectContaining({
          data: file,
          fileName: 'report.pdf',
        }),
      }),
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });

  test('calls upload mutation once per file when user selects multiple files', async () => {
    const user = userEvent.setup();
    renderAddAttachmentPanel();

    const file1 = new File(['a'], 'a.pdf', { type: 'application/pdf' });
    const file2 = new File(['b'], 'b.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('add-attachment-file-input');
    await user.upload(input, [file1, file2]);

    expect(mockMutate).toHaveBeenCalledTimes(2);
    expect(mockMutate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        file: expect.objectContaining({ fileName: 'a.pdf' }),
      }),
      expect.any(Object),
    );
    expect(mockMutate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        file: expect.objectContaining({ fileName: 'b.pdf' }),
      }),
      expect.any(Object),
    );
  });
});
