import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { CreateCourseModal } from './CreateCourseModal.tsx';

const mockMutateAsync = vi.fn();
vi.mock('services/api/api-client/CourseQuery', async (importActual) => {
  const actual = await importActual<typeof import('services/api/api-client/CourseQuery')>();
  return {
    ...actual,
    useCreateCourseMutation: () => ({
      mutateAsync: mockMutateAsync,
      isPending: false,
    }),
  };
});

const mockInvalidateQueries = vi.fn();
vi.mock('@tanstack/react-query', async (importActual) => {
  const actual = await importActual<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
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
  return render(
    <MemoryRouter>
      <CreateCourseModal isOpen={isOpen} onClose={onClose} />
    </MemoryRouter>,
  );
}

describe('CreateCourseModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders modal title when open', () => {
    renderModal();

    expect(screen.getByText('Создать курс')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    renderModal(false);

    expect(screen.queryByText('Создать курс')).not.toBeInTheDocument();
  });

  test('renders title field', () => {
    renderModal();

    expect(screen.getByTestId('CreateCourse-title')).toBeInTheDocument();
  });

  test('renders description field', () => {
    renderModal();

    expect(screen.getByTestId('CreateCourse-description')).toBeInTheDocument();
  });

  test('renders submit button', () => {
    renderModal();

    expect(
      screen.getByRole('button', { name: /создать/i }),
    ).toBeInTheDocument();
  });

  test('calls mutation with title and description on submit', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    renderModal();

    await user.type(screen.getByTestId('CreateCourse-title'), 'Алгоритмы');
    await user.type(
      screen.getByTestId('CreateCourse-description'),
      'Курс по алгоритмам',
    );
    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        title: 'Алгоритмы',
        description: 'Курс по алгоритмам',
      });
    });
  });

  test('calls onClose after successful creation', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockMutateAsync.mockResolvedValue({});
    renderModal(true, onClose);

    await user.type(screen.getByTestId('CreateCourse-title'), 'Алгоритмы');
    await user.type(screen.getByTestId('CreateCourse-description'), 'Описание');
    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('invalidates courses query after successful creation', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    renderModal();

    await user.type(screen.getByTestId('CreateCourse-title'), 'Алгоритмы');
    await user.type(screen.getByTestId('CreateCourse-description'), 'Описание');
    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['CourseClient'],
      });
    });
  });

  test('does not submit when title is empty', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /создать/i }));

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});
