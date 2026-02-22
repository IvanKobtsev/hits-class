import { MemoryRouter } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { LoginPage } from './LoginPage.tsx';

vi.mock('lottie-web', () => ({
  default: { loadAnimation: vi.fn(() => ({ destroy: vi.fn() })) },
}));

vi.mock('helpers/auth/auth-client', () => ({
  sendLoginRequest: vi.fn(),
  handleLoginErrors: vi.fn(),
}));

vi.mock('services/api/query-client-helper', () => ({
  queryClient: { resetQueries: vi.fn() },
}));

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  test('renders "Already have an account?" text and "Login" button', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(
      screen.getByRole('button', { name: /^create an account$/i }),
    );

    expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^login$/i }),
    ).toBeInTheDocument();
  });

  test('renders "Dont have an account?" text and "Create an account" button after switching to register form', async () => {
    renderLoginPage();

    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^create an account$/i }),
    ).toBeInTheDocument();
  });
});
