import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import type { Attachment } from 'services/api/api-client.types';
import { QueryFactory } from 'services/api/index.ts';
import { EditAnnouncementModal } from './EditAnnouncementModal';

const mockMutateAsync = vi.fn();
vi.mock('services/api/api-client/AnnouncementQuery', () => ({
  useUpdateAnnouncementMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

const mockInvalidateQueries = vi.fn();
vi.mock('@tanstack/react-query', async (importActual) => {
  const actual = await importActual<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  };
});

const mockShowError = vi.fn();
vi.mock('components/uikit/modal/useModal', async (importActual) => {
  const actual =
    await importActual<typeof import('components/uikit/modal/useModal')>();
  return {
    ...actual,
    useModal: () => ({ showError: mockShowError }),
  };
});

const mockUploadFileAsync = vi.fn();
vi.mock('services/api/api-client/FilesQuery', () => ({
  useUploadFileMutation: () => ({
    mutateAsync: mockUploadFileAsync,
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

const mockAttachment: Attachment = {
  uuid: 'att-uuid-1',
  fileName: 'document.pdf',
  size: 1024,
  createdAt: new Date('2025-01-01'),
};

function renderModal(
  overrides: {
    isOpen?: boolean;
    onClose?: () => void;
    onSuccess?: () => void;
    publicationId?: number;
    initialContent?: string;
    initialAttachments?: Attachment[];
  } = {},
) {
  const {
    isOpen = true,
    onClose = vi.fn(),
    onSuccess = vi.fn(),
    publicationId = 10,
    initialContent = '',
    initialAttachments = [],
  } = overrides;

  return render(
    <MemoryRouter>
      <EditAnnouncementModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={onSuccess}
        publicationId={publicationId}
        initialContent={initialContent}
        initialAttachments={initialAttachments}
      />
    </MemoryRouter>,
  );
}

describe('EditAnnouncementModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders modal title when open', () => {
    renderModal();

    expect(screen.getByText('Редактировать объявление')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    renderModal({ isOpen: false });

    expect(
      screen.queryByText('Редактировать объявление'),
    ).not.toBeInTheDocument();
  });

  test('renders content field', () => {
    renderModal();

    expect(
      screen.getByTestId('EditAnnouncement-content-input'),
    ).toBeInTheDocument();
  });

  test('renders attachments section', () => {
    renderModal();

    expect(
      screen.getByTestId('EditAnnouncement-attachments'),
    ).toBeInTheDocument();
  });

  test('renders submit button with Сохранить title', () => {
    renderModal();

    expect(
      screen.getByRole('button', { name: /сохранить/i }),
    ).toBeInTheDocument();
  });

  test('pre-fills content field with initialContent', () => {
    renderModal({ initialContent: 'Исходное содержание' });

    expect(screen.getByTestId('EditAnnouncement-content-input')).toHaveValue(
      'Исходное содержание',
    );
  });

  test('shows initial attachment names in the file table', () => {
    renderModal({ initialAttachments: [mockAttachment] });

    expect(screen.getByText('document.pdf')).toBeInTheDocument();
  });

  test('calls mutation with updated content on submit', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    renderModal({ initialContent: 'Старое содержание' });

    const textarea = screen.getByTestId('EditAnnouncement-content-input');
    await user.clear(textarea);
    await user.type(textarea, 'Новое содержание');
    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Новое содержание',
        }),
      );
    });
  });

  test('calls onClose after successful update', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockMutateAsync.mockResolvedValue({});
    renderModal({ initialContent: 'Содержание', onClose });

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('calls onSuccess callback after successful update', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockMutateAsync.mockResolvedValue({});
    renderModal({ initialContent: 'Содержание', onSuccess });

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  test('invalidates publications queries after successful update', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    renderModal({ initialContent: 'Содержание' });

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: QueryFactory.PublicationsQuery.getPublicationsQueryKey({
          courseId: 1,
        }).slice(0, 1),
      });
    });
  });

  test('shows required error under content field when submit is pressed with empty content', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(
        within(screen.getByTestId('EditAnnouncement-content')).getByText(
          'Обязательное поле',
        ),
      ).toBeInTheDocument();
    });
  });

  test('does not call mutation when content is empty', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  test('shows error popup when update fails', async () => {
    // TODO: specify the error reason in the popup text (e.g. network error, server error message)
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Server error'));
    renderModal({ initialContent: 'Содержание' });

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalled();
    });
  });

  test('does not call onClose when update fails', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockMutateAsync.mockRejectedValue(new Error('Server error'));
    renderModal({ initialContent: 'Содержание', onClose });

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalled();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
