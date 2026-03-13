import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { JoinCourseModal } from './JoinCourseModal.tsx';

const mockMutateAsync = vi.fn();

const mockInvalidateQueries = vi.fn();
vi.mock('@tanstack/react-query', async (importActual) => {
  const actual = await importActual<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  };
});

vi.mock('services/api/api-client/CourseQuery', async (importActual) => {
  const actual = await importActual<typeof import('services/api/api-client/CourseQuery')>();
  return {
    ...actual,
    useJoinCourseMutation: (_inviteCode: string) => ({
      mutateAsync: mockMutateAsync,
      isPending: false,
    }),
  };
});

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
  return render(<JoinCourseModal isOpen={isOpen} onClose={onClose} />);
}

describe('JoinCourseModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders modal title when open', () => {
    renderModal();

    expect(screen.getByText('Записаться на курс')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    renderModal(false);

    expect(screen.queryByText('Записаться на курс')).not.toBeInTheDocument();
  });

  test('renders invite code field', () => {
    renderModal();

    expect(screen.getByTestId('JoinCourse-inviteCode')).toBeInTheDocument();
  });

  test('renders submit button', () => {
    renderModal();

    expect(
      screen.getByRole('button', { name: /записаться/i }),
    ).toBeInTheDocument();
  });

  test('calls mutation on submit with entered invite code', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue(undefined);
    renderModal();

    await user.type(screen.getByTestId('JoinCourse-inviteCode'), 'ABC-123');
    await user.click(screen.getByRole('button', { name: /записаться/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });
  });

  test('calls onClose after successful join', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockMutateAsync.mockResolvedValue(undefined);
    renderModal(true, onClose);

    await user.type(screen.getByTestId('JoinCourse-inviteCode'), 'ABC-123');
    await user.click(screen.getByRole('button', { name: /записаться/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('shows error message when joining fails', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Not found'));
    renderModal();

    await user.type(screen.getByTestId('JoinCourse-inviteCode'), 'WRONG-CODE');
    await user.click(screen.getByRole('button', { name: /записаться/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Не удалось присоединиться к курсу'),
      ).toBeInTheDocument();
    });
  });

  test('invalidates queries after successful join', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue(undefined);
    renderModal();

    await user.type(screen.getByTestId('JoinCourse-inviteCode'), 'ABC-123');
    await user.click(screen.getByRole('button', { name: /записаться/i }));

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['CourseClient'] });
    });
  });

  test('does not submit when invite code is empty', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /записаться/i }));

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});
