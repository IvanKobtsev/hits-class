import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { AdminPage } from './AdminPage';
import type { UserDto } from 'services/api/api-client.types';

vi.mock('components/uikit/suspense/Loading', () => ({
  Loading: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockAddRoleToUser = vi.hoisted(() => vi.fn());
const mockRemoveRolesFromUser = vi.hoisted(() => vi.fn());
vi.mock('services/api/api-client/UserQuery', async (importActual) => {
  const actual = await importActual<typeof import('services/api/api-client/UserQuery')>();
  return {
    ...actual,
    Client: {
      addRoleToUser: mockAddRoleToUser,
      removeRolesFromUser: mockRemoveRolesFromUser,
    },
    useGetUsersQuery: vi.fn(),
    useGetCurrentUserInfoQuery: vi.fn(),
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

import { useGetUsersQuery, useGetCurrentUserInfoQuery } from 'services/api/api-client/UserQuery';

const mockedUseGetUsersQuery = vi.mocked(useGetUsersQuery);
const mockedUseGetCurrentUserInfoQuery = vi.mocked(useGetCurrentUserInfoQuery);

const mockUsers: UserDto[] = [
  {
    id: 'u1',
    email: 'ivan@test.com',
    legalName: 'Иванов Иван',
    groupNumber: '201',
  },
  {
    id: 'u2',
    email: 'petr@test.com',
    legalName: 'Петров Пётр',
    groupNumber: '101',
  },
];

function setupQuery(data: UserDto[] = mockUsers, currentUserId?: string) {
  mockedUseGetUsersQuery.mockReturnValue({
    data: { data, totalCount: data.length },
    isLoading: false,
    isError: false,
  } as any);
  mockedUseGetCurrentUserInfoQuery.mockReturnValue({
    data: currentUserId ? { id: currentUserId } : undefined,
  } as any);
}

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddRoleToUser.mockResolvedValue(undefined);
    mockRemoveRolesFromUser.mockResolvedValue(undefined);
    mockInvalidateQueries.mockResolvedValue(undefined);
    setupQuery();
  });

  test('renders search bar, user list, and Save button', () => {
    render(<AdminPage />);

    expect(screen.getByTestId('admin-page')).toBeInTheDocument();
    expect(screen.getByTestId('admin-page-search')).toBeInTheDocument();
    expect(screen.getByTestId('admin-page-save')).toBeInTheDocument();
    expect(screen.getByText('Сохранить')).toBeInTheDocument();
    expect(screen.getByText('Иванов Иван')).toBeInTheDocument();
    expect(screen.getByText('Петров Пётр')).toBeInTheDocument();
  });

  test('search filters users by legalName', async () => {
    const user = userEvent.setup();
    render(<AdminPage />);

    await user.type(screen.getByTestId('admin-page-search'), 'Иванов');

    expect(screen.getByText('Иванов Иван')).toBeInTheDocument();
    expect(screen.queryByText('Петров Пётр')).not.toBeInTheDocument();
  });

  test('search filters users by email', async () => {
    const user = userEvent.setup();
    render(<AdminPage />);

    await user.type(screen.getByTestId('admin-page-search'), 'petr@');

    expect(screen.getByText('Петров Пётр')).toBeInTheDocument();
    expect(screen.queryByText('Иванов Иван')).not.toBeInTheDocument();
  });

  test('Save button is disabled when no changes', () => {
    render(<AdminPage />);

    const saveBtn = screen.getByTestId('admin-page-save');
    expect(saveBtn).toHaveAttribute('data-disabled', 'true');
  });

  test('Save button is enabled after role change', async () => {
    const user = userEvent.setup();
    render(<AdminPage />);

    const select = screen.getByTestId('user-with-role-select-u1');
    await user.selectOptions(select, 'Admin');

    expect(screen.getByTestId('admin-page-save')).not.toBeDisabled();
  });

  test('Save calls addRoleToUser and invalidates queries when role changed to Admin', async () => {
    const user = userEvent.setup();
    render(<AdminPage />);

    const select = screen.getByTestId('user-with-role-select-u1');
    await user.selectOptions(select, 'Admin');
    await user.click(screen.getByTestId('admin-page-save'));

    await vi.waitFor(() => {
      expect(mockRemoveRolesFromUser).toHaveBeenCalledWith('u1', 'Teacher');
      expect(mockAddRoleToUser).toHaveBeenCalledWith('u1', 'Admin');
      expect(mockInvalidateQueries).toHaveBeenCalled();
    });
  });

  test('Save calls addRoleToUser when role changed to Teacher', async () => {
    const user = userEvent.setup();
    render(<AdminPage />);

    const select = screen.getByTestId('user-with-role-select-u1');
    await user.selectOptions(select, 'Teacher');
    await user.click(screen.getByTestId('admin-page-save'));

    await vi.waitFor(() => {
      expect(mockRemoveRolesFromUser).toHaveBeenCalledWith('u1', 'Admin');
      expect(mockAddRoleToUser).toHaveBeenCalledWith('u1', 'Teacher');
    });
  });

  test('displays current role from API as default (Admin)', () => {
    const usersWithRoles: UserDto[] = [
      { ...mockUsers[0], roles: ['Admin'] },
      { ...mockUsers[1], roles: [] },
    ];
    setupQuery(usersWithRoles);
    render(<AdminPage />);

    const select1 = screen.getByTestId('user-with-role-select-u1') as HTMLSelectElement;
    const select2 = screen.getByTestId('user-with-role-select-u2') as HTMLSelectElement;
    expect(select1.value).toBe('Admin');
    expect(select2.value).toBe('Student');
  });

  test('displays current role from API as default (Teacher)', () => {
    const usersWithRoles: UserDto[] = [
      { ...mockUsers[0], roles: ['Teacher'] },
    ];
    setupQuery(usersWithRoles);
    render(<AdminPage />);

    const select = screen.getByTestId('user-with-role-select-u1') as HTMLSelectElement;
    expect(select.value).toBe('Teacher');
  });

  test('role dropdown is disabled for current user (admin)', () => {
    setupQuery(mockUsers, 'u1');
    render(<AdminPage />);

    const currentUserSelect = screen.getByTestId('user-with-role-select-u1');
    const otherUserSelect = screen.getByTestId('user-with-role-select-u2');
    expect(currentUserSelect).toBeDisabled();
    expect(otherUserSelect).not.toBeDisabled();
  });

  test('role dropdown is enabled for all users when current user is not in list', () => {
    setupQuery(mockUsers, 'other-admin-id');
    render(<AdminPage />);

    expect(screen.getByTestId('user-with-role-select-u1')).not.toBeDisabled();
    expect(screen.getByTestId('user-with-role-select-u2')).not.toBeDisabled();
  });
});
