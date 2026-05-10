import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { MarkType, type Attachment } from 'services/api/api-client.types';
import { QueryFactory } from 'services/api/index.ts';
import { EditAssignmentModal } from './EditAssignmentModal';
import { wrapInLexical } from '../../../../AssignmentPage/StudentSubmissionsTab/StudentSubmissionsTab.tsx';

const mockMutateAsync = vi.fn();
vi.mock('services/api/api-client/AssignmentQuery', () => ({
  usePatchAssignmentMutation: () => ({
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

const mockUploadFileAsync = vi.fn();
vi.mock('services/api/api-client/FilesQuery', () => ({
  useUploadFileMutation: () => ({
    mutateAsync: mockUploadFileAsync,
    isPending: false,
  }),
}));

vi.mock('components/uikit/inputs/date-time/HookFormDatePicker', () => ({
  HookFormDatePicker: ({ name }: { name: string; control: unknown }) => (
    <input data-test-id={`EditAssignment-${name}`} type="date" readOnly />
  ),
}));

vi.mock('components/uikit/suspense/Loading', () => ({
  Loading: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

const mockAttachment: Attachment = {
  uuid: 'att-uuid-1',
  fileName: 'task.pdf',
  size: 2048,
  createdAt: new Date('2025-01-01'),
};

function renderModal(
  overrides: {
    isOpen?: boolean;
    onClose?: () => void;
    onSuccess?: () => void;
    publicationId?: number;
    initialTitle?: string;
    initialContent?: string;
    initialDeadlineUtc?: Date | null;
    initialAttachments?: Attachment[];
    initialMarkType?: MarkType;
    initialMinMark?: number | null;
    initialMaxMark?: number | null;
  } = {},
) {
  const {
    isOpen = true,
    onClose = vi.fn(),
    onSuccess = vi.fn(),
    publicationId = 20,
    initialTitle = '',
    initialContent = '',
    initialDeadlineUtc = null,
    initialAttachments = [],
    initialMarkType = MarkType.Score,
    initialMinMark = 2,
    initialMaxMark = 5
  } = overrides;

  return render(
    <MemoryRouter>
      <EditAssignmentModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={onSuccess}
        publicationId={publicationId}
        initialTitle={initialTitle}
        initialContent={wrapInLexical(initialContent)}
        initialDeadlineUtc={initialDeadlineUtc}
        initialAttachments={initialAttachments}
        initialMarkType={initialMarkType}
        initialMinMark={initialMinMark}
        initialMaxMark={initialMaxMark}
      />
    </MemoryRouter>,
  );
}

describe('EditAssignmentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders modal title when open', () => {
    renderModal();

    expect(screen.getByText('Редактировать задание')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    renderModal({ isOpen: false });

    expect(screen.queryByText('Редактировать задание')).not.toBeInTheDocument();
  });

  test('renders title field', () => {
    renderModal();

    expect(
      screen.getByTestId('EditAssignment-title-input'),
    ).toBeInTheDocument();
  });

  test('renders content field', () => {
    renderModal();

    expect(screen.getByTestId('lexical-editor')).toBeInTheDocument();
  });

  test('renders deadline field', () => {
    renderModal();

    expect(
      screen.getByTestId('EditAssignment-deadlineUtc'),
    ).toBeInTheDocument();
  });

  test('renders attachments section', () => {
    renderModal();

    expect(
      screen.getByTestId('EditAssignment-attachments'),
    ).toBeInTheDocument();
  });

  test('renders submit button with Сохранить title', () => {
    renderModal();

    expect(
      screen.getByRole('button', { name: /сохранить/i }),
    ).toBeInTheDocument();
  });

  test('pre-fills title field with initialTitle', () => {
    renderModal({ initialTitle: 'Задание по алгебре' });

    expect(screen.getByTestId('EditAssignment-title-input')).toHaveValue(
      'Задание по алгебре',
    );
  });

  test('passes initialContent to mutation when submitting without content edits', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    const initialContent = 'Решить задачи 1–10';
    renderModal({ initialTitle: 'Задание', initialContent });

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            json: expect.stringContaining(initialContent),
          }),
        }),
      );
    });
  });

  test('shows initial attachment names in the file table', () => {
    renderModal({ initialAttachments: [mockAttachment] });

    expect(screen.getByText('task.pdf')).toBeInTheDocument();
  });

  test('calls mutation with updated title and content on submit', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    renderModal({
      initialTitle: 'Старое название',
      initialContent: 'Старое описание',
    });

    const titleInput = screen.getByTestId('EditAssignment-title-input');
    await user.clear(titleInput);
    await user.type(titleInput, 'Новое название');

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.any(Object),
          payload: expect.objectContaining({
            title: 'Новое название',
          }),
        }),
      );
    });
  });

  test('calls onClose after successful update', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockMutateAsync.mockResolvedValue({});
    renderModal({
      initialTitle: 'Название',
      initialContent: 'Описание',
      onClose,
    });

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('calls onSuccess callback after successful update', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockMutateAsync.mockResolvedValue({});
    renderModal({
      initialTitle: 'Название',
      initialContent: 'Описание',
      onSuccess,
    });

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  test('invalidates publications queries after successful update', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    renderModal({ initialTitle: 'Название', initialContent: 'Описание' });

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: QueryFactory.PublicationsQuery.getPublicationsQueryKey({
          courseId: 1,
        }).slice(0, 1),
      });
    });
  });

  test('shows required error under title field when submit is pressed with empty title', async () => {
    const user = userEvent.setup();
    renderModal({ initialContent: 'Описание' });

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(
        within(screen.getByTestId('EditAssignment-title')).getByText(
          'Обязательное поле',
        ),
      ).toBeInTheDocument();
    });
  });

  test('submits without content when title is provided', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    renderModal({ initialTitle: 'Название' });

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });
  });

  test('does not call mutation when title is empty', async () => {
    const user = userEvent.setup();
    renderModal({ initialContent: 'Описание' });

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  test('shows error popup when update fails', async () => {
    // TODO: specify the error reason in the popup text (e.g. network error, server error message)
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Server error'));
    renderModal({ initialTitle: 'Название', initialContent: 'Описание' });

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalled();
    });
  });

  test('does not call onClose when update fails', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockMutateAsync.mockRejectedValue(new Error('Server error'));
    renderModal({
      initialTitle: 'Название',
      initialContent: 'Описание',
      onClose,
    });

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalled();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
