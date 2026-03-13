import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { CourseMembersTab } from './CourseMembersTab';
import type { CourseDto, UserDto } from 'services/api/api-client.types';
import type { CourseRole } from '../useCourseRole';

const mockShowConfirm = vi.fn();
vi.mock('components/uikit/modal/useModal', () => ({
  useModal: () => ({ showConfirm: mockShowConfirm }),
}));

const mockBanStudent = vi.fn();
const mockUnbanStudent = vi.fn();
vi.mock('services/api/api-client/CourseQuery', async (importActual) => {
  const actual = await importActual<typeof import('services/api/api-client/CourseQuery')>();
  return {
    ...actual,
    useBanStudentMutation: () => ({
      mutateAsync: mockBanStudent,
      isPending: false,
    }),
    useUnbanStudentMutation: () => ({
      mutateAsync: mockUnbanStudent,
      isPending: false,
    }),
  };
});

const mockInvalidateQueries = vi.fn();
vi.mock('@tanstack/react-query', async (importActual) => {
  const actual = await importActual<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  };
});

const mockOwner: UserDto = {
  id: 'u1',
  email: 'owner@test.com',
  legalName: 'Иванов И.И.',
  groupNumber: null,
  roles: null,
};

const mockCourse: CourseDto = {
  id: 1,
  createdAt: new Date(),
  title: 'Курс',
  description: 'Описание',
  inviteCode: 'CODE',
  owner: mockOwner,
  teachers: [mockOwner],
  students: [],
  bannedStudents: [],
};

const mockStudent: UserDto = {
  id: 'u-student',
  email: 'student@test.com',
  legalName: 'Сидоров С.С.',
  groupNumber: '201',
  roles: null,
};

const mockBannedUser: UserDto = {
  id: 'u2',
  email: 'banned@test.com',
  legalName: 'Петров П.П.',
  groupNumber: '101',
  roles: null,
};

const mockCourseWithStudents: CourseDto = {
  ...mockCourse,
  students: [mockStudent],
};

function renderTab(course: CourseDto = mockCourse, role: CourseRole = 'student') {
  return render(<CourseMembersTab course={course} role={role} />);
}

describe('CourseMembersTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShowConfirm.mockResolvedValue(false);
    mockBanStudent.mockResolvedValue(undefined);
    mockUnbanStudent.mockResolvedValue(undefined);
    mockInvalidateQueries.mockResolvedValue(undefined);
  });

  // --- Banned section visibility ---

  test('renders banned section when role is teacher', () => {
    renderTab(mockCourse, 'teacher');

    expect(screen.getByText('Заблокированные')).toBeInTheDocument();
  });

  test('does NOT render banned section when role is student', () => {
    renderTab({ ...mockCourse, bannedStudents: [mockBannedUser] }, 'student');

    expect(screen.queryByText('Заблокированные')).not.toBeInTheDocument();
  });

  // --- Banned section content ---

  test('renders empty state when no banned users', () => {
    renderTab(mockCourse, 'teacher');

    expect(screen.getByText('Нет заблокированных')).toBeInTheDocument();
  });

  test('renders list of banned users when present', () => {
    renderTab({ ...mockCourse, bannedStudents: [mockBannedUser] }, 'teacher');

    expect(screen.getByText('Петров П.П.')).toBeInTheDocument();
    expect(screen.getByText('banned@test.com')).toBeInTheDocument();
    expect(screen.getByTestId('member-row-u2')).toBeInTheDocument();
  });

  test('shows pluralization for banned count', () => {
    renderTab({ ...mockCourse, bannedStudents: [mockBannedUser] }, 'teacher');

    expect(screen.getByText('1 заблокированный')).toBeInTheDocument();
  });

  // --- Ban/Unban menu ---

  test('menu button is visible for students when role is teacher', () => {
    renderTab(mockCourseWithStudents, 'teacher');

    expect(screen.getByTestId('member-row-menu-button-u-student')).toBeInTheDocument();
  });

  test('menu button is NOT visible for students when role is student', () => {
    renderTab(mockCourseWithStudents, 'student');

    expect(screen.queryByTestId('member-row-menu-button-u-student')).not.toBeInTheDocument();
  });

  test('menu button is NOT visible for teachers', () => {
    renderTab(mockCourse, 'teacher');

    expect(screen.queryByTestId('member-row-menu-button-u1')).not.toBeInTheDocument();
  });

  test('menu button is visible for banned users when role is teacher', () => {
    renderTab({ ...mockCourse, bannedStudents: [mockBannedUser] }, 'teacher');

    expect(screen.getByTestId('member-row-menu-button-u2')).toBeInTheDocument();
  });

  test('clicking menu button opens Menu with Заблокировать for student', async () => {
    const user = userEvent.setup();
    renderTab(mockCourseWithStudents, 'teacher');

    await user.click(screen.getByTestId('member-row-menu-button-u-student'));

    expect(screen.getByRole('menuitem', { name: 'Заблокировать' })).toBeInTheDocument();
  });

  test('clicking menu button opens Menu with Разблокировать for banned user', async () => {
    const user = userEvent.setup();
    renderTab({ ...mockCourse, bannedStudents: [mockBannedUser] }, 'teacher');

    await user.click(screen.getByTestId('member-row-menu-button-u2'));

    expect(screen.getByRole('menuitem', { name: 'Разблокировать' })).toBeInTheDocument();
  });

  test('clicking Заблокировать opens confirmation modal', async () => {
    const user = userEvent.setup();
    renderTab(mockCourseWithStudents, 'teacher');

    await user.click(screen.getByTestId('member-row-menu-button-u-student'));
    await user.click(screen.getByRole('menuitem', { name: 'Заблокировать' }));

    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Вы точно хотите заблокировать выбранного пользователя?',
      }),
    );
  });

  test('confirming ban calls useBanStudentMutation and invalidates queries', async () => {
    mockShowConfirm.mockResolvedValue(true);
    const user = userEvent.setup();
    renderTab(mockCourseWithStudents, 'teacher');

    await user.click(screen.getByTestId('member-row-menu-button-u-student'));
    await user.click(screen.getByRole('menuitem', { name: 'Заблокировать' }));

    await vi.waitFor(() => {
      expect(mockBanStudent).toHaveBeenCalledWith('u-student');
      expect(mockInvalidateQueries).toHaveBeenCalled();
    });
  });

  test('clicking Разблокировать opens confirmation modal', async () => {
    const user = userEvent.setup();
    renderTab({ ...mockCourse, bannedStudents: [mockBannedUser] }, 'teacher');

    await user.click(screen.getByTestId('member-row-menu-button-u2'));
    await user.click(screen.getByRole('menuitem', { name: 'Разблокировать' }));

    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Вы точно хотите разблокировать выбранного пользователя?',
      }),
    );
  });

  test('confirming unban calls useUnbanStudentMutation and invalidates queries', async () => {
    mockShowConfirm.mockResolvedValue(true);
    const user = userEvent.setup();
    renderTab({ ...mockCourse, bannedStudents: [mockBannedUser] }, 'teacher');

    await user.click(screen.getByTestId('member-row-menu-button-u2'));
    await user.click(screen.getByRole('menuitem', { name: 'Разблокировать' }));

    await vi.waitFor(() => {
      expect(mockUnbanStudent).toHaveBeenCalledWith('u2');
      expect(mockInvalidateQueries).toHaveBeenCalled();
    });
  });

  test('canceling confirmation does NOT call mutation', async () => {
    mockShowConfirm.mockResolvedValue(false);
    const user = userEvent.setup();
    renderTab(mockCourseWithStudents, 'teacher');

    await user.click(screen.getByTestId('member-row-menu-button-u-student'));
    await user.click(screen.getByRole('menuitem', { name: 'Заблокировать' }));

    expect(mockBanStudent).not.toHaveBeenCalled();
  });
});
