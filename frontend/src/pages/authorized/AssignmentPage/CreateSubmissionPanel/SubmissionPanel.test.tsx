import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
const mockRetractSubmission = vi.fn();
const mockSaveDraft = vi.fn();
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
  useRetractSubmissionMutation: () => ({
    mutate: mockRetractSubmission,
    mutateAsync: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    data: undefined,
    error: null,
    reset: vi.fn(),
  }),
  useSaveDraftMutation: () => ({
    mutate: mockSaveDraft,
    mutateAsync: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    data: undefined,
    error: null,
    reset: vi.fn(),
  }),
  getMySubmissionQueryKey: (id: number) => ['SubmissionClient', 'getMySubmission', id],
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

import type { SubmissionDto } from 'services/api/api-client.types';

function renderSubmissionPanel(assignmentId?: number) {
  return render(<SubmissionPanel assignmentId={assignmentId} />);
}

function makeDraftSubmission(fileNames: string[]): SubmissionDto {
  return {
    id: 1,
    state: 'Draft',
    mark: null,
    lastSubmittedAtUTC: null,
    lastMarkedAtUTC: null,
    attachments: fileNames.map((name, i) => ({
      id: `id-${i}`,
      fileName: name,
      size: 100,
      metadata: { externalId: null },
      createdAt: new Date(),
    })),
    author: { id: 'user-1', legalName: 'Test User', email: 'test@test.com', groupNumber: '123' },
    comments: [],
  } as unknown as SubmissionDto;
}

function makeSubmittedSubmission(fileNames: string[]): SubmissionDto {
  return {
    id: 1,
    state: 'Submitted',
    mark: null,
    lastSubmittedAtUTC: new Date(),
    lastMarkedAtUTC: null,
    attachments: fileNames.map((name, i) => ({
      id: `id-${i}`,
      fileName: name,
      size: 100,
      metadata: { externalId: null },
      createdAt: new Date(),
    })),
    author: {
      id: 'user-1',
      legalName: 'Test User',
      email: 'test@test.com',
      groupNumber: '123',
    },
    comments: [],
  } as unknown as SubmissionDto;
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

  // --- Submitted state ---

  test('pre-populates files from Draft submission on page load', () => {
    const submission = makeDraftSubmission(['draft1.pdf', 'draft2.pdf']);
    render(<SubmissionPanel assignmentId={1} submission={submission} />);

    expect(screen.getByText('draft1.pdf')).toBeInTheDocument();
    expect(screen.getByText('draft2.pdf')).toBeInTheDocument();
    expect(screen.getByTestId('add-attachment-file-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit|сдать|отправить/i })).toBeInTheDocument();
  });

  test('shows upload UI and submit button when no submission is provided', () => {
    renderSubmissionPanel(1);

    expect(screen.getByTestId('add-attachment-file-input')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /submit|сдать|отправить/i }),
    ).toBeInTheDocument();
  });

  test('shows submitted files from existing submission when state is Submitted', () => {
    const submission = makeSubmittedSubmission(['report.pdf', 'notes.txt']);
    render(<SubmissionPanel assignmentId={1} submission={submission} />);

    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('notes.txt')).toBeInTheDocument();
  });

  test('shows cancel button when submission state is Submitted', () => {
    const submission = makeSubmittedSubmission(['file.pdf']);
    render(<SubmissionPanel assignmentId={1} submission={submission} />);

    expect(
      screen.getByRole('button', { name: /отменить сдачу/i }),
    ).toBeInTheDocument();
  });

  test('does not show file input when submission state is Submitted', () => {
    const submission = makeSubmittedSubmission(['file.pdf']);
    render(<SubmissionPanel assignmentId={1} submission={submission} />);

    expect(
      screen.queryByTestId('add-attachment-file-input'),
    ).not.toBeInTheDocument();
  });

  test('calls deleteSubmission mutation when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const submission = makeSubmittedSubmission(['file.pdf']);
    render(<SubmissionPanel assignmentId={1} submission={submission} />);

    await user.click(screen.getByRole('button', { name: /отменить сдачу/i }));

    expect(mockRetractSubmission).toHaveBeenCalledTimes(1);
  });

  test('restores files to local state after cancel so student can re-submit without re-uploading', async () => {
    const user = userEvent.setup();
    const submission = makeSubmittedSubmission(['report.pdf', 'notes.txt']);
    const { rerender } = render(<SubmissionPanel assignmentId={1} submission={submission} />);

    // Simulate successful retract
    mockRetractSubmission.mockImplementationOnce((_: unknown, options: { onSuccess: () => void }) => {
      options.onSuccess();
    });

    await user.click(screen.getByRole('button', { name: /отменить сдачу/i }));

    // Simulate query invalidation: parent re-renders with Draft submission (no longer Submitted)
    rerender(<SubmissionPanel assignmentId={1} submission={undefined} />);

    // Panel should now show upload mode with previous files pre-populated
    expect(screen.getByTestId('add-attachment-file-input')).toBeInTheDocument();
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('notes.txt')).toBeInTheDocument();
  });

  // --- Draft auto-save ---

  test('calls saveDraft after a file is successfully uploaded', async () => {
    const user = userEvent.setup();
    renderSubmissionPanel(1);

    const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('add-attachment-file-input');
    await user.upload(input, file);

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
      expect(mockSaveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: expect.arrayContaining([
            expect.objectContaining({ id: 'server-file-id' }),
          ]),
        }),
      );
    });
  });

  test('submit button is active when there are uploaded files and no upload in progress', async () => {
    const user = userEvent.setup();
    renderSubmissionPanel(1);

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
