import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { RegisterForm } from './RegisterForm.tsx';

vi.mock('services/api/api-client/UserClient', () => ({
  register: vi.fn(),
}));

vi.mock('lottie-web', () => ({
  default: { loadAnimation: vi.fn(() => ({ destroy: vi.fn() })) },
}));

import { register } from 'services/api/api-client/UserClient';

const mockedRegister = vi.mocked(register);

function renderRegisterForm() {
  return render(
    <MemoryRouter>
      <RegisterForm />
    </MemoryRouter>,
  );
}

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  test('renders email, legal name, group number fields and register button', () => {
    renderRegisterForm();

    expect(screen.getByTestId('Email')).toBeInTheDocument();
    expect(screen.getByTestId('LegalName')).toBeInTheDocument();
    expect(screen.getByTestId('GroupNumber')).toBeInTheDocument();
    expect(screen.getByTestId('Password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /register/i }),
    ).toBeInTheDocument();
  });

  // --- Validation ---

  test('shows required error under email field when submitted empty', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(
      within(screen.getByTestId('Email')).getByText('Required'),
    ).toBeInTheDocument();
  });

  test('shows required error under legal name field when submitted empty', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(
      within(screen.getByTestId('LegalName')).getByText('Required'),
    ).toBeInTheDocument();
  });

  test('does not show required error under group number field when submitted empty', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(
      within(screen.getByTestId('GroupNumber')).queryByText('Required'),
    ).not.toBeInTheDocument();
  });

  test('shows required error under password field when submitted empty', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(
      within(screen.getByTestId('Password')).getByText('Required'),
    ).toBeInTheDocument();
  });

  // --- Happy path ---

  test('calls register with entered credentials on submit', async () => {
    const user = userEvent.setup();
    mockedRegister.mockResolvedValueOnce(undefined);
    renderRegisterForm();

    const emailInput = within(screen.getByTestId('Email')).getByRole('textbox');
    const legalNameInput = within(screen.getByTestId('LegalName')).getByRole(
      'textbox',
    );
    const groupNumberInput = within(
      screen.getByTestId('GroupNumber'),
    ).getByRole('textbox');

    const password = within(screen.getByTestId('Password')).getByRole(
      'textbox',
    );

    await user.type(emailInput, 'john@example.com');
    await user.type(legalNameInput, 'John Doe');
    await user.type(groupNumberInput, '871021');
    await user.type(password, 'i1mc91mzc');
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockedRegister).toHaveBeenCalledWith({
        email: 'john@example.com',
        legalName: 'John Doe',
        groupNumber: '871021',
        password: 'i1mc91mzc',
      });
    });
  });

  test('passes null for group number when left empty', async () => {
    const user = userEvent.setup();
    mockedRegister.mockResolvedValueOnce(undefined);
    renderRegisterForm();

    const emailInput = within(screen.getByTestId('Email')).getByRole('textbox');
    const legalNameInput = within(screen.getByTestId('LegalName')).getByRole(
      'textbox',
    );
    const password = within(screen.getByTestId('Password')).getByRole(
      'textbox',
    );

    await user.type(emailInput, 'john@example.com');
    await user.type(legalNameInput, 'John Doe');
    await user.type(password, 'i1mc91mzc');
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockedRegister).toHaveBeenCalledWith({
        email: 'john@example.com',
        legalName: 'John Doe',
        groupNumber: null,
        password: 'i1mc91mzc',
      });
    });
  });

  test('shows success message after successful registration', async () => {
    const user = userEvent.setup();
    mockedRegister.mockResolvedValueOnce(undefined);
    renderRegisterForm();

    const emailInput = within(screen.getByTestId('Email')).getByRole('textbox');
    const legalNameInput = within(screen.getByTestId('LegalName')).getByRole(
      'textbox',
    );
    const password = within(screen.getByTestId('Password')).getByRole(
      'textbox',
    );

    await user.type(emailInput, 'john@example.com');
    await user.type(legalNameInput, 'John Doe');
    await user.type(password, 'i1mc91mzc');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByTestId('register-success')).toBeInTheDocument();
  });

  test('shows loading indicator while request is in flight', async () => {
    const user = userEvent.setup();
    let resolveRegister!: (value: void) => void;
    mockedRegister.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRegister = resolve;
      }),
    );
    renderRegisterForm();

    const emailInput = within(screen.getByTestId('Email')).getByRole('textbox');
    const legalNameInput = within(screen.getByTestId('LegalName')).getByRole(
      'textbox',
    );
    const password = within(screen.getByTestId('Password')).getByRole(
      'textbox',
    );

    await user.type(emailInput, 'john@example.com');
    await user.type(legalNameInput, 'John Doe');
    await user.type(password, 'i1mc91mzc');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByTestId('loading')).toBeInTheDocument();

    resolveRegister();
    await waitFor(() =>
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument(),
    );
  });

  // --- Error scenarios ---

  test('shows error message when registration fails', async () => {
    const user = userEvent.setup();
    mockedRegister.mockRejectedValueOnce(new Error('Registration_Failed'));
    renderRegisterForm();

    const emailInput = within(screen.getByTestId('Email')).getByRole('textbox');
    const legalNameInput = within(screen.getByTestId('LegalName')).getByRole(
      'textbox',
    );
    const password = within(screen.getByTestId('Password')).getByRole(
      'textbox',
    );

    await user.type(emailInput, 'john@example.com');
    await user.type(legalNameInput, 'John Doe');
    await user.type(password, 'i1mc91mzc');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText('Registration_Failed')).toBeInTheDocument();
  });
});
