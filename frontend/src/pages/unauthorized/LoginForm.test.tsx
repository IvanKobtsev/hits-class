import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { LoginForm } from './LoginForm.tsx';

vi.mock('helpers/auth/auth-client', () => ({
  sendLoginRequest: vi.fn(),
  handleLoginErrors: vi.fn((e: unknown) => {
    throw e;
  }),
}));

vi.mock('services/api/query-client-helper', () => ({
  queryClient: { resetQueries: vi.fn() },
}));

vi.mock('lottie-web', () => ({
  default: { loadAnimation: vi.fn(() => ({ destroy: vi.fn() })) },
}));

import { sendLoginRequest, handleLoginErrors } from 'helpers/auth/auth-client';
import { queryClient } from 'services/api/query-client-helper';

const mockedSendLogin = vi.mocked(sendLoginRequest);
const mockedHandleLoginErrors = vi.mocked(handleLoginErrors);

function renderLoginForm() {
  return render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>,
  );
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedHandleLoginErrors.mockImplementation((e: unknown) => {
      throw e;
    });
  });

  // --- Rendering ---

  test('renders login field, password field, and login button', () => {
    renderLoginForm();

    expect(screen.getByTestId('Login')).toBeInTheDocument();
    expect(screen.getByTestId('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  // --- Validation ---

  test('shows required error under login field when submitted empty', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(
      within(screen.getByTestId('Login')).getByText('Required'),
    ).toBeInTheDocument();
  });

  test('shows required error under password field when submitted empty', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(
      within(screen.getByTestId('Password')).getByText('Required'),
    ).toBeInTheDocument();
  });

  // --- Happy path ---

  test('calls sendLoginRequest with entered credentials on submit', async () => {
    const user = userEvent.setup();
    mockedSendLogin.mockResolvedValueOnce({
      access_token: 'tok',
      refresh_token: 'ref',
      expires_in: 3600,
    });
    renderLoginForm();

    const loginInput = within(screen.getByTestId('Login')).getByRole('textbox');
    const passwordInput = screen
      .getByTestId('Password')
      .querySelector('input')!;

    await user.type(loginInput, 'admin');
    await user.type(passwordInput, 'mypass');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockedSendLogin).toHaveBeenCalledWith('admin', 'mypass');
    });
  });

  test('resets query cache after successful login', async () => {
    const user = userEvent.setup();
    mockedSendLogin.mockResolvedValueOnce({
      access_token: 'tok',
      refresh_token: 'ref',
      expires_in: 3600,
    });
    renderLoginForm();

    const loginInput = within(screen.getByTestId('Login')).getByRole('textbox');
    const passwordInput = screen
      .getByTestId('Password')
      .querySelector('input')!;

    await user.type(loginInput, 'admin');
    await user.type(passwordInput, 'password');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(vi.mocked(queryClient.resetQueries)).toHaveBeenCalled();
    });
  });

  test('shows loading indicator while request is in flight', async () => {
    const user = userEvent.setup();
    let resolveLogin!: (value: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }) => void;
    mockedSendLogin.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLogin = resolve;
      }),
    );
    renderLoginForm();

    const loginInput = within(screen.getByTestId('Login')).getByRole('textbox');
    const passwordInput = screen
      .getByTestId('Password')
      .querySelector('input')!;

    await user.type(loginInput, 'admin');
    await user.type(passwordInput, 'password');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByTestId('loading')).toBeInTheDocument();

    resolveLogin({
      access_token: 'tok',
      refresh_token: 'ref',
      expires_in: 3600,
    });
    await waitFor(() =>
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument(),
    );
  });

  // --- Error scenarios ---

  test('shows "Invalid login or password" when login fails', async () => {
    const user = userEvent.setup();
    mockedSendLogin.mockRejectedValueOnce(new Error('Invalid login or password'));
    renderLoginForm();

    const loginInput = within(screen.getByTestId('Login')).getByRole('textbox');
    const passwordInput = screen
      .getByTestId('Password')
      .querySelector('input')!;

    await user.type(loginInput, 'admin');
    await user.type(passwordInput, 'wrongpass');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(
      await screen.findByText('Invalid login or password'),
    ).toBeInTheDocument();
  });

  test('shows "Authentication failed" on unknown error', async () => {
    const user = userEvent.setup();
    mockedSendLogin.mockRejectedValueOnce(new Error('Authentication failed'));
    renderLoginForm();

    const loginInput = within(screen.getByTestId('Login')).getByRole('textbox');
    const passwordInput = screen
      .getByTestId('Password')
      .querySelector('input')!;

    await user.type(loginInput, 'admin');
    await user.type(passwordInput, 'password');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(
      await screen.findByText('Authentication failed'),
    ).toBeInTheDocument();
  });
});
