import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { SubmissionPanel } from './SubmissionPanel';

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

const mockCreateSubmission = vi.fn();
vi.mock('services/api/api-client/SubmissionQuery', () => ({
  useCreateSubmissionMutation: () => ({
    mutate: mockCreateSubmission,
    mutateAsync: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    data: undefined,
    error: null,
    reset: vi.fn(),
  }),
}));

function renderSubmissionPanel(
  initialEntries: string[] = ['/create-submission'],
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <SubmissionPanel />
    </MemoryRouter>,
  );
}

describe('SubmissionPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  test('renders panel with add-attachment-panel test id', () => {
    renderSubmissionPanel();

    expect(screen.getByTestId('add-attachment-panel')).toBeInTheDocument();
  });

  test('renders AttachedFilesTable', () => {
    renderSubmissionPanel();

    expect(screen.getByTestId('attached-files-table')).toBeInTheDocument();
  });

  test('renders submit button', () => {
    renderSubmissionPanel();

    expect(
      screen.getByRole('button', { name: /submit|сдать|отправить/i }),
    ).toBeInTheDocument();
  });

  test('renders file input to add files', () => {
    renderSubmissionPanel();

    const input = screen.getByTestId('add-attachment-file-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'file');
  });

  // --- Upload on add (one by one) ---

  test('calls upload mutation with selected file when user selects one file', async () => {
    const user = userEvent.setup();
    renderSubmissionPanel();

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
    renderSubmissionPanel();

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

  test('submit button is active when there are uploaded files and no upload in progress', async () => {
    const user = userEvent.setup();
    renderSubmissionPanel(['/create-submission?assignmentId=1']);

    const file = new File(['content'], 'report.pdf', {
      type: 'application/pdf',
    });
    const input = screen.getByTestId('add-attachment-file-input');
    await user.upload(input, file);

    expect(mockMutate).toHaveBeenCalledTimes(1);
    const [, options] = mockMutate.mock.calls[0];
    const fakeFileInfo = {
      id: 'server-file-id',
      fileName: 'report.pdf',
      size: 1024,
      metadata: { externalId: null },
      createdAt: new Date(),
    };
    options.onSuccess(fakeFileInfo);

    await waitFor(() => {
      const submitButton = screen.getByRole('button', {
        name: /submit|сдать|отправить/i,
      });
      expect(submitButton).not.toBeDisabled();
    });
  });
});
