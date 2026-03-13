import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe } from 'vitest';
import { UserWithRole, ADMIN_ROLE, STUDENT_ROLE } from './UserWithRole';
import type { UserDto } from 'services/api/api-client.types';

vi.mock('components/uikit/avatar/Avatar', () => ({
  Avatar: ({ user }: { user: UserDto }) => (
    <div data-test-id="user-avatar">{user?.legalName ?? 'N/A'}</div>
  ),
}));

const mockUser: UserDto = {
  id: 'u1',
  email: 'user@test.com',
  legalName: 'Иванов Иван',
  groupNumber: '201',
};

describe('UserWithRole', () => {
  test('renders avatar, name, group, and role dropdown', () => {
    const onRoleChange = vi.fn();
    render(
      <UserWithRole
        user={mockUser}
        selectedRole={STUDENT_ROLE}
        onRoleChange={onRoleChange}
      />
    );

    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
    expect(screen.getByTestId('user-with-role-u1')).toBeInTheDocument();
    expect(screen.getByText('user@test.com')).toBeInTheDocument();
    expect(screen.getByText('201')).toBeInTheDocument();
    expect(screen.getByTestId('user-with-role-select-u1')).toBeInTheDocument();
  });

  test('renders group as em dash when groupNumber is null', () => {
    const userWithoutGroup: UserDto = { ...mockUser, groupNumber: null };
    render(
      <UserWithRole
        user={userWithoutGroup}
        selectedRole={STUDENT_ROLE}
        onRoleChange={vi.fn()}
      />
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  test('calls onRoleChange when role dropdown changes', async () => {
    const onRoleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <UserWithRole
        user={mockUser}
        selectedRole={STUDENT_ROLE}
        onRoleChange={onRoleChange}
      />
    );

    const select = screen.getByTestId('user-with-role-select-u1');
    await user.selectOptions(select, ADMIN_ROLE);

    expect(onRoleChange).toHaveBeenCalledWith(ADMIN_ROLE);
  });

  test('displays selected role in dropdown', () => {
    render(
      <UserWithRole
        user={mockUser}
        selectedRole={ADMIN_ROLE}
        onRoleChange={vi.fn()}
      />
    );

    const select = screen.getByTestId('user-with-role-select-u1') as HTMLSelectElement;
    expect(select.value).toBe(ADMIN_ROLE);
  });
});
