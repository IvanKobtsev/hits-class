import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { PublicationType } from 'services/api/api-client.types';
import { QueryFactory } from 'services/api/index.ts';
import { EditTargetUsersModal } from './EditTargetUsersModal';

const mockAnnouncementMutateAsync = vi.fn();
vi.mock('services/api/api-client/AnnouncementQuery', () => ({
  useUpdateAnnouncementMutation: () => ({
    mutateAsync: mockAnnouncementMutateAsync,
    isPending: false,
  }),
}));

const mockAssignmentMutateAsync = vi.fn();
vi.mock('services/api/api-client/AssignmentQuery', () => ({
  usePatchAssignmentMutation: () => ({
    mutateAsync: mockAssignmentMutateAsync,
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
vi.mock('components/uikit/modal/useModal', () => ({
  useModal: () => ({ showError: mockShowError }),
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

vi.mock('components/uikit/suspense/Loading', () => ({
  Loading: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('components/uikit/avatar/Avatar', () => ({
  Avatar: ({ user }: { user?: { id?: string } }) => (
    <div data-test-id={`user-avatar-${user?.id ?? ''}`} />
  ),
}));

const mockCourseData = {
  id: 42,
  title: 'Курс',
  description: '',
  inviteCode: 'abc',
  createdAt: new Date(),
  owner: { id: 'owner-1', email: 'owner@test.com', legalName: 'Директор Курса', groupNumber: null },
  teachers: [
    { id: 'teacher-1', email: 't1@test.com', legalName: 'Иванов Иван', groupNumber: null },
  ],
  students: [
    { id: 'student-1', email: 's1@test.com', legalName: 'Студент Альфа', groupNumber: 'А-101' },
    { id: 'student-2', email: 's2@test.com', legalName: 'Студент Бета', groupNumber: 'Б-202' },
    { id: 'student-3', email: 's3@test.com', legalName: 'Студент Гамма', groupNumber: 'А-101' },
  ],
};

vi.mock('services/api/api-client/CourseQuery', () => ({
  useGetCourseQuery: () => ({
    data: mockCourseData,
    isLoading: false,
  }),
}));

function renderModal(
  overrides: {
    isOpen?: boolean;
    onClose?: () => void;
    onSuccess?: () => void;
    publicationId?: number;
    publicationType?: PublicationType;
    initialTargetUserIds?: string[];
  } = {},
) {
  const {
    isOpen = true,
    onClose = vi.fn(),
    onSuccess = vi.fn(),
    publicationId = 10,
    publicationType = PublicationType.Announcement,
    initialTargetUserIds = [],
  } = overrides;

  return render(
    <MemoryRouter initialEntries={['/courses/42']}>
      <Routes>
        <Route
          path="/courses/:courseId"
          element={
            <EditTargetUsersModal
              isOpen={isOpen}
              onClose={onClose}
              onSuccess={onSuccess}
              publicationId={publicationId}
              publicationType={publicationType}
              initialTargetUserIds={initialTargetUserIds}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EditTargetUsersModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders modal title when open', () => {
    renderModal();

    expect(
      screen.getByText('Изменить целевых пользователей'),
    ).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    renderModal({ isOpen: false });

    expect(
      screen.queryByText('Изменить целевых пользователей'),
    ).not.toBeInTheDocument();
  });

  test('renders teachers section header', () => {
    renderModal();

    expect(screen.getByText('Преподаватели')).toBeInTheDocument();
  });

  test('renders students section header', () => {
    renderModal();

    expect(screen.getByText('Студенты')).toBeInTheDocument();
  });

  test('renders teacher names from course data', () => {
    renderModal();

    expect(screen.getByText('Иванов Иван')).toBeInTheDocument();
  });

  test('renders student names from course data', () => {
    renderModal();

    expect(screen.getByText('Студент Альфа')).toBeInTheDocument();
    expect(screen.getByText('Студент Бета')).toBeInTheDocument();
  });

  test('renders Сохранить button', () => {
    renderModal();

    expect(
      screen.getByRole('button', { name: /сохранить/i }),
    ).toBeInTheDocument();
  });

  test('renders Отмена button', () => {
    renderModal();

    expect(
      screen.getByRole('button', { name: /отмена/i }),
    ).toBeInTheDocument();
  });

  test('Отмена button calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal({ onClose });

    await user.click(screen.getByRole('button', { name: /отмена/i }));

    expect(onClose).toHaveBeenCalled();
  });

  test('pre-checks users from initialTargetUserIds', () => {
    renderModal({ initialTargetUserIds: ['student-1'] });

    const checkboxes = screen.getAllByRole('checkbox');
    const checkedBoxes = checkboxes.filter(
      (cb) => (cb as HTMLInputElement).checked,
    );
    expect(checkedBoxes).toHaveLength(1);
  });

  test('renders search input', () => {
    renderModal();

    expect(
      screen.getByPlaceholderText(/поиск/i),
    ).toBeInTheDocument();
  });

  test('search filters visible users by legalName', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByPlaceholderText(/поиск/i), 'Альфа');

    await waitFor(() => {
      expect(screen.getByText('Студент Альфа')).toBeInTheDocument();
      expect(screen.queryByText('Студент Бета')).not.toBeInTheDocument();
    });
  });

  test('renders group filter dropdown', () => {
    renderModal();

    expect(
      screen.getByTestId('EditTargetUsers-group-filter'),
    ).toBeInTheDocument();
  });

  test('calls useUpdateAnnouncementMutation on save for announcement', async () => {
    const user = userEvent.setup();
    mockAnnouncementMutateAsync.mockResolvedValue({});
    renderModal({
      publicationType: PublicationType.Announcement,
      initialTargetUserIds: ['student-1'],
    });

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(mockAnnouncementMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          targetUsersIds: expect.arrayContaining(['student-1']),
        }),
      );
    });
  });

  test('calls usePatchAssignmentMutation on save for assignment', async () => {
    const user = userEvent.setup();
    mockAssignmentMutateAsync.mockResolvedValue({});
    renderModal({
      publicationType: PublicationType.Assignment,
      initialTargetUserIds: ['student-2'],
    });

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(mockAssignmentMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          targetUsersIds: expect.arrayContaining(['student-2']),
        }),
      );
    });
  });

  test('calls onClose after successful save', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockAnnouncementMutateAsync.mockResolvedValue({});
    renderModal({ onClose });

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('calls onSuccess after successful save', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockAnnouncementMutateAsync.mockResolvedValue({});
    renderModal({ onSuccess });

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  test('invalidates publications query after successful save', async () => {
    const user = userEvent.setup();
    mockAnnouncementMutateAsync.mockResolvedValue({});
    renderModal();

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: QueryFactory.PublicationsQuery.getPublicationsQueryKey({
          courseId: 1,
        }).slice(0, 1),
      });
    });
  });

  test('shows error popup when save fails', async () => {
    const user = userEvent.setup();
    mockAnnouncementMutateAsync.mockRejectedValue(new Error('Server error'));
    renderModal();

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalled();
    });
  });

  test('does not call onClose when save fails', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockAnnouncementMutateAsync.mockRejectedValue(new Error('Server error'));
    renderModal({ onClose });

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalled();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
