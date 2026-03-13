import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { StudentToBeTargeted } from './StudentToBeTargeted';
import type { UserDto } from 'services/api/api-client.types';

vi.mock('components/uikit/avatar/Avatar', () => ({
  Avatar: ({ user }: { user?: UserDto }) => (
    <div data-test-id={`avatar-${user?.id ?? ''}`} />
  ),
}));

const mockUser: UserDto = {
  id: 'user-1',
  email: 'student@test.com',
  legalName: 'Иван Иванов',
  groupNumber: 'А-101',
  roles: [],
};

describe('StudentToBeTargeted', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders avatar', () => {
    const onChange = vi.fn();
    render(
      <StudentToBeTargeted user={mockUser} checked={false} onChange={onChange} />,
    );

    expect(screen.getByTestId('avatar-user-1')).toBeInTheDocument();
  });

  test('renders user legalName', () => {
    const onChange = vi.fn();
    render(
      <StudentToBeTargeted user={mockUser} checked={false} onChange={onChange} />,
    );

    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
  });

  test('renders user email', () => {
    const onChange = vi.fn();
    render(
      <StudentToBeTargeted user={mockUser} checked={false} onChange={onChange} />,
    );

    expect(screen.getByText('student@test.com')).toBeInTheDocument();
  });

  test('renders group badge', () => {
    const onChange = vi.fn();
    render(
      <StudentToBeTargeted user={mockUser} checked={false} onChange={onChange} />,
    );

    expect(screen.getByText('А-101')).toBeInTheDocument();
  });

  test('renders group as — when groupNumber is null', () => {
    const userWithoutGroup = { ...mockUser, groupNumber: null };
    const onChange = vi.fn();
    render(
      <StudentToBeTargeted
        user={userWithoutGroup}
        checked={false}
        onChange={onChange}
      />,
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  test('renders checkbox', () => {
    const onChange = vi.fn();
    render(
      <StudentToBeTargeted user={mockUser} checked={false} onChange={onChange} />,
    );

    expect(screen.getByTestId('student-to-be-targeted-checkbox-user-1')).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  test('checkbox is checked when checked prop is true', () => {
    const onChange = vi.fn();
    render(
      <StudentToBeTargeted user={mockUser} checked={true} onChange={onChange} />,
    );

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  test('calls onChange when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <StudentToBeTargeted user={mockUser} checked={false} onChange={onChange} />,
    );

    await user.click(screen.getByRole('checkbox'));

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test('calls onChange when row is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <StudentToBeTargeted user={mockUser} checked={false} onChange={onChange} />,
    );

    await user.click(screen.getByTestId('student-to-be-targeted-user-1'));

    expect(onChange).toHaveBeenCalled();
  });
});
