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

function getPasswordInput() {
  return screen.getByTestId('Password').querySelector('input')!;
}

function makeFieldValidationError(fieldName: string, message: string) {
  return { response: { data: { errors: { [fieldName]: [message] } } } };
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

    await user.type(
      within(screen.getByTestId('Email')).getByRole('textbox'),
      'john@example.com',
    );
    await user.type(
      within(screen.getByTestId('LegalName')).getByRole('textbox'),
      'John Doe',
    );
    await user.type(
      within(screen.getByTestId('GroupNumber')).getByRole('textbox'),
      '871021',
    );
    await user.type(getPasswordInput(), 'i1mc91mzc');
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

    await user.type(
      within(screen.getByTestId('Email')).getByRole('textbox'),
      'john@example.com',
    );
    await user.type(
      within(screen.getByTestId('LegalName')).getByRole('textbox'),
      'John Doe',
    );
    await user.type(getPasswordInput(), 'i1mc91mzc');
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

    await user.type(
      within(screen.getByTestId('Email')).getByRole('textbox'),
      'john@example.com',
    );
    await user.type(
      within(screen.getByTestId('LegalName')).getByRole('textbox'),
      'John Doe',
    );
    await user.type(getPasswordInput(), 'i1mc91mzc');
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

    await user.type(
      within(screen.getByTestId('Email')).getByRole('textbox'),
      'john@example.com',
    );
    await user.type(
      within(screen.getByTestId('LegalName')).getByRole('textbox'),
      'John Doe',
    );
    await user.type(getPasswordInput(), 'i1mc91mzc');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByTestId('loading')).toBeInTheDocument();

    resolveRegister();
    await waitFor(() =>
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument(),
    );
  });

  // --- Server-side field validation errors ---

  test('shows email format error when invalid email is submitted', async () => {
    const user = userEvent.setup();
    mockedRegister.mockRejectedValueOnce(
      makeFieldValidationError(
        'Email',
        'The Email field is not a valid e-mail address.',
      ),
    );
    renderRegisterForm();

    await user.type(
      within(screen.getByTestId('Email')).getByRole('textbox'),
      'invalidmail.com',
    );
    await user.type(
      within(screen.getByTestId('LegalName')).getByRole('textbox'),
      'John Doe',
    );
    await user.type(getPasswordInput(), 'validPass1');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(
      await within(screen.getByTestId('Email')).findByText(
        'The Email field is not a valid e-mail address.',
      ),
    ).toBeInTheDocument();
  });

  test('shows minimum length error when password is too short (2 characters)', async () => {
    const user = userEvent.setup();
    mockedRegister.mockRejectedValueOnce(
      makeFieldValidationError(
        'Password',
        'Field must have minimum of 5 character',
      ),
    );
    renderRegisterForm();

    await user.type(
      within(screen.getByTestId('Email')).getByRole('textbox'),
      'john@example.com',
    );
    await user.type(
      within(screen.getByTestId('LegalName')).getByRole('textbox'),
      'John Doe',
    );
    await user.type(getPasswordInput(), 'ab');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(
      await within(screen.getByTestId('Password')).findByText(
        'Field must have minimum of 5 character',
      ),
    ).toBeInTheDocument();
  });

  test('shows maximum length error when password is too long (65 characters)', async () => {
    const user = userEvent.setup();
    mockedRegister.mockRejectedValueOnce(
      makeFieldValidationError(
        'Password',
        'Field can have maximum of 64 characters',
      ),
    );
    renderRegisterForm();

    await user.type(
      within(screen.getByTestId('Email')).getByRole('textbox'),
      'john@example.com',
    );
    await user.type(
      within(screen.getByTestId('LegalName')).getByRole('textbox'),
      'John Doe',
    );
    await user.type(getPasswordInput(), 'a'.repeat(65));
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(
      await within(screen.getByTestId('Password')).findByText(
        'Field can have maximum of 64 characters',
      ),
    ).toBeInTheDocument();
  });

  test('shows invalid characters error when password contains "?"', async () => {
    const user = userEvent.setup();
    mockedRegister.mockRejectedValueOnce(
      makeFieldValidationError(
        'Password',
        'Allowed password characters are: A-Z, a-z, 0-9 and !@#$%^&*.()',
      ),
    );
    renderRegisterForm();

    await user.type(
      within(screen.getByTestId('Email')).getByRole('textbox'),
      'john@example.com',
    );
    await user.type(
      within(screen.getByTestId('LegalName')).getByRole('textbox'),
      'John Doe',
    );
    await user.type(getPasswordInput(), 'valid?Pass');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(
      await within(screen.getByTestId('Password')).findByText(
        'Allowed password characters are: A-Z, a-z, 0-9 and !@#$%^&*.()',
      ),
    ).toBeInTheDocument();
  });

  // --- Error scenarios ---

  test('shows error message when registration fails', async () => {
    const user = userEvent.setup();
    mockedRegister.mockRejectedValueOnce(new Error('Registration_Failed'));
    renderRegisterForm();

    await user.type(
      within(screen.getByTestId('Email')).getByRole('textbox'),
      'john@example.com',
    );
    await user.type(
      within(screen.getByTestId('LegalName')).getByRole('textbox'),
      'John Doe',
    );
    await user.type(getPasswordInput(), 'i1mc91mzc');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText('Registration_Failed')).toBeInTheDocument();
  });
});
