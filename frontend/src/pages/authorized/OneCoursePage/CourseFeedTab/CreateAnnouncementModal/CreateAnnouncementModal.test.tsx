import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { CreateAnnouncementModal } from './CreateAnnouncementModal.tsx';

const mockMutateAsync = vi.fn();
vi.mock('services/api/api-client/AnnouncementQuery', () => ({
  useCreateAnnouncementMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

const mockShowError = vi.fn();
vi.mock('components/uikit/modal/useModal', async (importActual) => {
  const actual =
    await importActual<typeof import('components/uikit/modal/useModal')>();
  return {
    ...actual,
    useModal: () => ({ showError: mockShowError }),
  };
});

vi.mock('services/api/api-client/FilesQuery', () => ({
  useUploadFileMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('components/uikit/suspense/Loading', () => ({
  Loading: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('components/uikit/modal/CustomModal', () => ({
  CustomModal: ({
    isOpen,
    title,
    children,
  }: {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) =>
    isOpen ? (
      <div>
        <span>{title}</span>
        {children}
      </div>
    ) : null,
}));

function renderModal(isOpen = true, onClose = vi.fn()) {
  return render(
    <MemoryRouter>
      <CreateAnnouncementModal isOpen={isOpen} onClose={onClose} />
    </MemoryRouter>,
  );
}

describe('CreateAnnouncementModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders modal title when open', () => {
    renderModal();

    expect(screen.getByText('Создать объявление')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    renderModal(false);

    expect(screen.queryByText('Создать объявление')).not.toBeInTheDocument();
  });

  test('renders title field', () => {
    renderModal();

    expect(screen.getByTestId('CreateAnnouncement-title-input')).toBeInTheDocument();
  });

  test('renders description field', () => {
    renderModal();

    expect(screen.getByTestId('CreateAnnouncement-description')).toBeInTheDocument();
  });

  test('renders attachments section', () => {
    renderModal();

    expect(screen.getByTestId('CreateAnnouncement-attachments')).toBeInTheDocument();
  });

  test('renders submit button with Создать title', () => {
    renderModal();

    expect(screen.getByRole('button', { name: /создать/i })).toBeInTheDocument();
  });

  test('calls mutation with title, description and attachments on submit', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    renderModal();

    await user.type(screen.getByTestId('CreateAnnouncement-title-input'), 'Новый курс начался');
    await user.type(screen.getByTestId('CreateAnnouncement-description'), 'Детали объявления');
    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        title: 'Новый курс начался',
        description: 'Детали объявления',
        attachments: [],
      });
    });
  });

  test('calls mutation with null description when description is empty', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    renderModal();

    await user.type(screen.getByTestId('CreateAnnouncement-title-input'), 'Заголовок');
    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        title: 'Заголовок',
        description: null,
        attachments: [],
      });
    });
  });

  test('calls onClose after successful creation', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockMutateAsync.mockResolvedValue({});
    renderModal(true, onClose);

    await user.type(screen.getByTestId('CreateAnnouncement-title-input'), 'Заголовок');
    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('shows Required error under title field when submit is pressed with empty title', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(
        within(screen.getByTestId('CreateAnnouncement-title')).getByText('Required'),
      ).toBeInTheDocument();
    });
  });

  test('does not call mutation when title is empty', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /создать/i }));

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  test('shows error popup when creation fails', async () => {
    // TODO: specify the error reason in the popup text (e.g. network error, server error message)
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Server error'));
    renderModal();

    await user.type(screen.getByTestId('CreateAnnouncement-title-input'), 'Заголовок');
    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalled();
    });
  });
});
