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

vi.mock('services/api/api-client/FilesQuery', () => ({
  useUploadFileMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('components/uikit/inputs/date-time/HookFormDatePicker', () => ({
  HookFormDatePicker: ({
    name,
    control,
  }: {
    name: string;
    control: unknown;
  }) => (
    <input data-test-id={`CreateAssignment-${name}`} type="date" readOnly />
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

    expect(
      screen.getByTestId('CreateAssignment-title-input'),
    ).toBeInTheDocument();
  });

  test('renders content field', () => {
    renderModal();

    expect(
      screen.getByTestId('CreateAssignment-content-input'),
    ).toBeInTheDocument();
  });

  test('renders deadline field', () => {
    renderModal();

    expect(
      screen.getByTestId('CreateAssignment-deadlineUtc'),
    ).toBeInTheDocument();
  });

  test('renders attachments section', () => {
    renderModal();

    expect(
      screen.getByTestId('CreateAssignment-attachments'),
    ).toBeInTheDocument();
  });

  test('renders submit button with Создать title', () => {
    renderModal();

    expect(
      screen.getByRole('button', { name: /создать/i }),
    ).toBeInTheDocument();
  });

  test('calls mutation with title, content and empty attachments on submit', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    renderModal();

    await user.type(
      screen.getByTestId('CreateAssignment-title-input'),
      'Задание 1',
    );
    await user.type(
      screen.getByTestId('CreateAssignment-content-input'),
      'Описание задания',
    );
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

    await user.type(
      screen.getByTestId('CreateAssignment-title-input'),
      'Задание 1',
    );
    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('invalidates queries after successful creation', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    renderModal();

    await user.type(
      screen.getByTestId('CreateAssignment-title-input'),
      'Задание 1',
    );
    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: [] });
    });
  });

  test('shows Required error under title field when submit is pressed with empty title', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(
        within(screen.getByTestId('CreateAssignment-title')).getByText(
          'Обязательное поле',
        ),
      ).toBeInTheDocument();
    });
  });

  test('does not call mutation when title is empty', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /создать/i }));

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  test('shows error popup when creation fails', async () => {
    // TODO: specify the error reason in the popup text (e.g. network error, server error message)
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Server error'));
    renderModal();

    await user.type(
      screen.getByTestId('CreateAssignment-title-input'),
      'Задание 1',
    );
    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalled();
    });
  });
});
