import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { AvatarMenu } from './AvatarMenu';

vi.mock('components/uikit/avatar/Avatar', () => ({
  Avatar: ({ user }: { user?: { id: string } }) => (
    <div data-test-id="avatar">{user?.id ?? 'no-user'}</div>
  ),
}));

vi.mock('helpers/auth/auth-interceptor', () => ({
  logOut: vi.fn(),
}));

import { logOut } from 'helpers/auth/auth-interceptor';

const mockedLogOut = vi.mocked(logOut);

const mockUser = {
  id: '1',
  email: 'user@test.com',
  legalName: 'Test User',
  groupNumber: null,
};

function renderAvatarMenu(user = mockUser) {
  return render(<AvatarMenu user={user} />);
}

describe('AvatarMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedLogOut.mockResolvedValue(undefined);
  });

  test('renders avatar button', () => {
    renderAvatarMenu();

    expect(screen.getByTestId('avatar-menu-button')).toBeInTheDocument();
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });

  test('shows dropdown when avatar button is clicked', async () => {
    const user = userEvent.setup();
    renderAvatarMenu();

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('avatar-menu-button'));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Выйти из аккаунта')).toBeInTheDocument();
  });

  test('hides dropdown when clicking logout', async () => {
    const user = userEvent.setup();
    renderAvatarMenu();

    await user.click(screen.getByTestId('avatar-menu-button'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.click(screen.getByText('Выйти из аккаунта'));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('calls logOut when logout button is clicked', async () => {
    const user = userEvent.setup();
    renderAvatarMenu();

    await user.click(screen.getByTestId('avatar-menu-button'));
    await user.click(screen.getByText('Выйти из аккаунта'));

    expect(mockedLogOut).toHaveBeenCalledOnce();
  });

  test('hides dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    renderAvatarMenu();

    await user.click(screen.getByTestId('avatar-menu-button'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.click(document.body);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
