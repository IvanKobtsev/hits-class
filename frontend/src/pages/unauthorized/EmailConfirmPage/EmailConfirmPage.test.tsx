import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Links } from 'application/constants/links';
import { EmailConfirmPage } from './EmailConfirmPage.tsx';

type ConfirmEmailMutationOptions = {
  onError?: (error: unknown) => void;
  onSuccess?: () => void;
};

const mockNavigate = vi.fn();
const mockMutate = vi.fn();
const mockUseConfirmEmailMutation = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
	'react-router-dom',
  );

  return {
	...actual,
	useNavigate: () => mockNavigate,
  };
});

vi.mock('services/api/api-client/UserQuery.ts', () => ({
  useConfirmEmailMutation: (
	userId: string,
	options?: ConfirmEmailMutationOptions,
  ) => {
	mockUseConfirmEmailMutation(userId, options);

	return {
	  mutate: () => mockMutate(options),
	};
  },
}));

vi.mock('lottie-web', () => ({
  default: { loadAnimation: vi.fn(() => ({ destroy: vi.fn() })) },
}));

function renderEmailConfirmPage(userId = 'user-123') {
  return render(
	<MemoryRouter initialEntries={[`/confirm-email/${userId}`]}>
	  <Routes>
		<Route
		  path={Links.Unauthorized.ConfirmEmail.route}
		  element={<EmailConfirmPage />}
		/>
	  </Routes>
	</MemoryRouter>,
  );
}

describe('EmailConfirmPage', () => {
  beforeEach(() => {
	vi.clearAllMocks();
	mockMutate.mockImplementation(() => undefined);
  });

  test('shows loading indicator while email confirmation is pending', async () => {
	renderEmailConfirmPage();

	expect(screen.getByTestId('loading')).toBeInTheDocument();

	await waitFor(() => {
	  expect(mockUseConfirmEmailMutation).toHaveBeenCalledWith(
		'user-123',
		expect.objectContaining({
		  onError: expect.any(Function),
		  onSuccess: expect.any(Function),
		}),
	  );
	  expect(mockMutate).toHaveBeenCalledTimes(1);
	});
  });

  test('renders success message after successful confirmation', async () => {
	mockMutate.mockImplementation((options?: ConfirmEmailMutationOptions) => {
	  options?.onSuccess?.();
	});

	renderEmailConfirmPage();

	expect(
	  await screen.findByText('Вы успешно подтвердили свой аккаунт!'),
	).toBeInTheDocument();
	expect(
	  screen.getByText(
		/Теперь вы можете войти в систему и начать использовать все/i,
	  ),
	).toBeInTheDocument();
  });

  test('navigates to dashboard when success action button is clicked', async () => {
	const user = userEvent.setup();
	mockMutate.mockImplementation((options?: ConfirmEmailMutationOptions) => {
	  options?.onSuccess?.();
	});

	renderEmailConfirmPage();

	await user.click(
	  await screen.findByRole('button', { name: /На страницу логина/i }),
	);

	expect(mockNavigate).toHaveBeenCalledWith(
	  Links.Authorized.Dashboard.link(),
	);
  });

  test('shows already confirmed error message when account is already confirmed', async () => {
	mockMutate.mockImplementation((options?: ConfirmEmailMutationOptions) => {
	  options?.onError?.({ detail: 'Email is already confirmed' });
	});

	renderEmailConfirmPage();

	expect(
	  await screen.findByText('Не удалось подтвердить аккаунт'),
	).toBeInTheDocument();
	expect(screen.getByText('Аккаунт уже подтверждён')).toBeInTheDocument();
  });

  test('shows fallback error message when confirmation fails for another reason', async () => {
	mockMutate.mockImplementation((options?: ConfirmEmailMutationOptions) => {
	  options?.onError?.({ detail: 'Unexpected error' });
	});

	renderEmailConfirmPage();

	expect(
	  await screen.findByText(
		'Пожалуйста, убедитесь, что ссылка верная и попробуйте ещё раз.',
	  ),
	).toBeInTheDocument();
  });

  test('navigates to dashboard when error action button is clicked', async () => {
	const user = userEvent.setup();
	mockMutate.mockImplementation((options?: ConfirmEmailMutationOptions) => {
	  options?.onError?.({ detail: 'Unexpected error' });
	});

	renderEmailConfirmPage();

	await user.click(
	  await screen.findByRole('button', { name: /На страницу логина/i }),
	);

	expect(mockNavigate).toHaveBeenCalledWith(
	  Links.Authorized.Dashboard.link(),
	);
  });
});

