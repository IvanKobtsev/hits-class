import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { CreateAssignmentModal } from './CreateAssignmentModal.tsx';

const mockMutateAsync = vi.fn();
vi.mock('services/api/api-client/AssignmentQuery', () => ({
  useCreateAssignmentMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

const mockInvalidateQueries = vi.fn();
vi.mock('@tanstack/react-query', async (importActual) => {
  const actual = await importActual<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  };
});

const mockShowError = vi.fn();
vi.mock('components/uikit/modal/useModal', async (importActual) => {
  const actual =
    await importActual<typeof import('components/uikit/modal/useModal')>();
  return {
    ...actual,
    useModal: () => ({ showError: mockShowError }),
  };
});

const mockCourseData = {
  id: 42,
  title: 'Курс',
  description: '',
  inviteCode: 'abc',
  createdAt: new Date(),
  owner: { id: 'o1', email: 'o@t.com', legalName: 'Owner', groupNumber: null },
  teachers: [],
  students: [
    { id: 's1', email: 's1@t.com', legalName: 'Студент 1', groupNumber: 'А', roles: [] },
    { id: 's2', email: 's2@t.com', legalName: 'Студент 2', groupNumber: 'А', roles: [] },
  ],
};

vi.mock('services/api/api-client/CourseQuery', () => ({
  useGetCourseQuery: () => ({ data: mockCourseData, isLoading: false }),
}));

const mockUploadFileAsync = vi.fn();
vi.mock('services/api/api-client/FilesQuery', () => ({
  useUploadFileMutation: () => ({
    mutateAsync: mockUploadFileAsync,
    isPending: false,
  }),
}));

vi.mock('components/uikit/inputs/date-time/HookFormDatePicker', () => ({
  HookFormDatePicker: ({ name, control }: { name: string; control: unknown }) => (
    <input data-test-id={`CreateAssignment-${name}`} type="date" readOnly />
  ),
}));

vi.mock('components/uikit/suspense/Loading', () => ({
  Loading: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../TargetStudents/TargetStudents', () => ({
  TargetStudents: ({
    selectedIds,
    onSelectionChange,
  }: {
    selectedIds: Set<string>;
    onSelectionChange: (ids: Set<string>) => void;
  }) => (
    <div data-test-id="target-students">
      <button
        data-test-id="target-students-deselect-one"
        onClick={() => {
          const next = new Set(selectedIds);
          next.delete('s1');
          onSelectionChange(next);
        }}
      >
        Deselect s1
      </button>
      <button
        data-test-id="target-students-deselect-all"
        onClick={() => onSelectionChange(new Set())}
      >
        Deselect all
      </button>
    </div>
  ),
}));

vi.mock('components/uikit/modal/CustomModal', () => ({
  CustomModal: ({
    isOpen,
    title,
    children,
  }: {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) =>
    isOpen ? (
      <div>
        <span>{title}</span>
        {children}
      </div>
    ) : null,
}));

function renderModal(isOpen = true, onClose = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={['/courses/42']}>
      <Routes>
        <Route
          path="/courses/:courseId"
          element={<CreateAssignmentModal isOpen={isOpen} onClose={onClose} />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CreateAssignmentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders modal title when open', () => {
    renderModal();

    expect(screen.getByText('Создать задание')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    renderModal(false);

    expect(screen.queryByText('Создать задание')).not.toBeInTheDocument();
  });

  test('renders title field', () => {
    renderModal();

    expect(screen.getByTestId('CreateAssignment-title-input')).toBeInTheDocument();
  });

  test('renders content field', () => {
    renderModal();

    expect(screen.getByTestId('CreateAssignment-content-input')).toBeInTheDocument();
  });

  test('renders deadline field', () => {
    renderModal();

    expect(screen.getByTestId('CreateAssignment-deadlineUtc')).toBeInTheDocument();
  });

  test('renders attachments section', () => {
    renderModal();

    expect(screen.getByTestId('CreateAssignment-attachments')).toBeInTheDocument();
  });

  test('renders submit button with Создать title', () => {
    renderModal();

    expect(screen.getByRole('button', { name: /создать/i })).toBeInTheDocument();
  });

  test('calls mutation with targetUsersIds null when all students selected', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    renderModal();

    await user.type(screen.getByTestId('CreateAssignment-title-input'), 'Задание 1');
    await user.type(screen.getByTestId('CreateAssignment-content-input'), 'Описание задания');
    await waitFor(() => {
      expect(screen.getByTestId('target-students')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        content: 'Описание задания',
        targetUsersIds: null,
        attachments: null,
        payload: {
          publicationType: 'Assignment',
          title: 'Задание 1',
          deadlineUtc: null,
        },
      });
    });
  });

  test('calls onClose after successful creation', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockMutateAsync.mockResolvedValue({});
    renderModal(true, onClose);

    await user.type(screen.getByTestId('CreateAssignment-title-input'), 'Задание 1');
    await user.type(screen.getByTestId('CreateAssignment-content-input'), 'Описание');
    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('invalidates queries after successful creation', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    renderModal();

    await user.type(screen.getByTestId('CreateAssignment-title-input'), 'Задание 1');
    await user.type(screen.getByTestId('CreateAssignment-content-input'), 'Описание');
    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: [] });
    });
  });

  test('shows required error under content field when submit is pressed with empty content', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByTestId('CreateAssignment-title-input'), 'Задание 1');
    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      const textarea = screen.getByTestId('CreateAssignment-content-input');
      expect(textarea.closest('div')).toHaveTextContent('Обязательное поле');
      expect(textarea).toHaveAttribute('data-error', 'true');
    });
  });

  test('shows required error under title field when submit is pressed with empty title', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(
        within(screen.getByTestId('CreateAssignment-title')).getByText('Обязательное поле'),
      ).toBeInTheDocument();
    });
  });

  test('does not call mutation when title is empty', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /создать/i }));

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  test('does not upload file immediately when selected', async () => {
    const user = userEvent.setup();
    const mockFile = new File(['data'], 'report.pdf', { type: 'application/pdf' });
    renderModal();

    await user.upload(screen.getByTestId('CreateAssignment-file-input'), mockFile);

    expect(mockUploadFileAsync).not.toHaveBeenCalled();
  });

  test('uploads attached files via uploadFileAsync at submit time and passes them as attachments', async () => {
    const user = userEvent.setup();
    const mockFile = new File(['data'], 'report.pdf', { type: 'application/pdf' });
    const mockFileInfo = {
      id: 'uuid-1',
      fileName: 'report.pdf',
      size: 4,
      createdAt: new Date('2025-01-01'),
      metadata: { externalId: null },
    };
    mockUploadFileAsync.mockResolvedValue(mockFileInfo);
    mockMutateAsync.mockResolvedValue({});
    renderModal();

    await user.upload(screen.getByTestId('CreateAssignment-file-input'), mockFile);
    await user.type(screen.getByTestId('CreateAssignment-title-input'), 'Задание 1');
    await user.type(screen.getByTestId('CreateAssignment-content-input'), 'Описание');
    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(mockUploadFileAsync).toHaveBeenCalledWith({
        file: { data: mockFile, fileName: 'report.pdf' },
      });
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [
            expect.objectContaining({ uuid: 'uuid-1', fileName: 'report.pdf' }),
          ],
        }),
      );
    });
  });

  test('disables Create button when no students selected', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByTestId('CreateAssignment-title-input'), 'Задание 1');
    await user.type(screen.getByTestId('CreateAssignment-content-input'), 'Описание');
    await waitFor(() => {
      expect(screen.getByTestId('target-students-deselect-all')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('target-students-deselect-all'));

    const createButton = screen.getByRole('button', { name: /создать/i });
    expect(createButton).toBeDisabled();
  });

  test('passes targetUsersIds when some students deselected', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    renderModal();

    await user.type(screen.getByTestId('CreateAssignment-title-input'), 'Задание 1');
    await user.type(screen.getByTestId('CreateAssignment-content-input'), 'Описание');
    await waitFor(() => {
      expect(screen.getByTestId('target-students-deselect-one')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('target-students-deselect-one'));
    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          targetUsersIds: expect.arrayContaining(['s2']),
        }),
      );
      expect(mockMutateAsync.mock.calls[0][0].targetUsersIds).toHaveLength(1);
    });
  });

  test('shows error popup when creation fails', async () => {
    // TODO: specify the error reason in the popup text (e.g. network error, server error message)
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Server error'));
    renderModal();

    await user.type(screen.getByTestId('CreateAssignment-title-input'), 'Задание 1');
    await user.type(screen.getByTestId('CreateAssignment-content-input'), 'Описание');
    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalled();
    });
  });
});
