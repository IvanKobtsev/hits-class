import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import {
  initAnnouncementPayload,
  initAssignmentPayload,
  PublicationDto,
  PublicationType,
} from 'services/api/api-client.types';
import { PublicationListItem } from './PublicationListItem';

// Мокаем только то, что нужно для рендера
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual };
});

const mockEditAnnouncementModal = vi.fn();
vi.mock(
  './EditAnnouncementModal/EditAnnouncementModal',
  () => ({
    EditAnnouncementModal: (props: { isOpen: boolean }) => {
      mockEditAnnouncementModal(props);
      return props.isOpen ? <div data-test-id="EditAnnouncementModal" /> : null;
    },
  }),
);

const mockEditAssignmentModal = vi.fn();
vi.mock(
  './EditAssignmentModal/EditAssignmentModal',
  () => ({
    EditAssignmentModal: (props: { isOpen: boolean }) => {
      mockEditAssignmentModal(props);
      return props.isOpen ? <div data-test-id="EditAssignmentModal" /> : null;
    },
  }),
);

const mockDeleteAnnouncementMutateAsync = vi.fn();
vi.mock('services/api/api-client/AnnouncementQuery', () => ({
  useDeleteAnnouncementMutation: () => ({
    mutateAsync: mockDeleteAnnouncementMutateAsync,
    isPending: false,
  }),
}));

const mockDeleteAssignmentMutateAsync = vi.fn();
vi.mock('services/api/api-client/AssignmentQuery', () => ({
  useDeleteAssignmentMutation: () => ({
    mutateAsync: mockDeleteAssignmentMutateAsync,
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

const mockShowConfirm = vi.fn();
vi.mock('components/uikit/modal/useModal', () => ({
  useModal: () => ({ showConfirm: mockShowConfirm }),
}));

const mockAuthor = {
  id: 'teacher-1',
  email: 'teacher@test.com',
  legalName: 'Иванов Иван Иванович',
  groupNumber: null,
};

const mockDate = new Date('2024-03-15T10:00:00Z');
const mockUpdatedDate = new Date('2024-03-16T10:00:00Z');

const mockAnnouncement: PublicationDto = {
  id: 1,
  type: PublicationType.Announcement,
  createdAtUTC: mockDate,
  lastUpdatedAtUTC: null,
  content: 'Тестовое объявление',
  author: mockAuthor,
  attachments: [],
  publicationPayload: initAnnouncementPayload({} as any),
};

const mockAssignment: PublicationDto = {
  id: 2,
  type: PublicationType.Assignment,
  createdAtUTC: mockDate,
  lastUpdatedAtUTC: null,
  content: 'Тестовое задание',
  author: mockAuthor,
  attachments: [],
  publicationPayload: initAssignmentPayload({
    title: 'Важное задание',
    deadlineUtc: '2024-04-01T13:59:00Z',
  } as any),
};

function renderPublicationListItem(props = mockAnnouncement) {
  return render(
    <MemoryRouter>
      <PublicationListItem {...props} />
    </MemoryRouter>,
  );
}

describe('PublicationListItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  test('renders author name', () => {
    renderPublicationListItem();
    expect(screen.getByTestId(`PublicationItem-author-${mockAnnouncement.id}`)).toHaveTextContent('Иванов Иван Иванович');
  });

  test('renders formatted date', () => {
    renderPublicationListItem();
    expect(screen.getByTestId(`PublicationItem-date-${mockAnnouncement.id}`)).toHaveTextContent('15.03.2024');
  });

  test('renders content', () => {
    renderPublicationListItem();
    expect(screen.getByTestId(`PublicationItem-content-${mockAnnouncement.id}`)).toHaveTextContent('Тестовое объявление');
  });

  test('renders a link to the publication page', () => {
    renderPublicationListItem();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/announcements/1');
  });

  test('renders attachments list', () => {
    renderPublicationListItem({
      ...mockAnnouncement,
      attachments: [
        {
          uuid: 'abc-123-def-456',
          fileName: 'Лекция_10_презентация.pptx',
          size: 2_500_000,
          createdAt: new Date('2025-01-01'),
        },
      ],
    });

    expect(
      screen.getByTestId(`AttachmentsList-${mockAnnouncement.id}`),
    ).toBeInTheDocument();
  });

  test('attachments list is rendered outside the navigation link', () => {
    renderPublicationListItem({
      ...mockAnnouncement,
      attachments: [
        { uuid: 'f1', fileName: 'file.pdf', size: 100, createdAt: new Date('2025-01-01') },
      ],
    });

    const link = screen.getByRole('link');
    const attachmentsList = screen.getByTestId(`AttachmentsList-${mockAnnouncement.id}`);
    expect(link).not.toContainElement(attachmentsList);
  });

  // --- Assignment specific test ---
  test('renders assignment title when type is Assignment', () => {
    renderPublicationListItem(mockAssignment);
    expect(screen.getByTestId(`PublicationItem-title-${mockAssignment.id}`)).toHaveTextContent('Важное задание');
  });

  test('renders deadline when type is Assignment', () => {
    renderPublicationListItem(mockAssignment);
    expect(screen.getByText('Срок сдачи: 01.04.2024')).toBeInTheDocument();
  });

  test('renders correct link for assignment', () => {
    renderPublicationListItem(mockAssignment);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/assignments/2');
  });

  test('does not render deadline for announcement', () => {
    renderPublicationListItem();
    expect(screen.queryByText(/Срок сдачи/)).not.toBeInTheDocument();
  });

  // --- Update date ---

  test('shows updated date when lastUpdatedAtUTC is different', () => {
    renderPublicationListItem({
      ...mockAnnouncement,
      lastUpdatedAtUTC: mockUpdatedDate,
    });
    expect(screen.getByTestId(`PublicationItem-updated-date-${mockAnnouncement.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`PublicationItem-updated-date-${mockAnnouncement.id}`)).toHaveTextContent('(ред. 16.03.2024)');
  });

  test('does not show updated date when lastUpdatedAtUTC is same as createdAt', () => {
    renderPublicationListItem({
      ...mockAnnouncement,
      lastUpdatedAtUTC: mockDate, // та же дата
    });
    expect(screen.queryByTestId(`PublicationItem-updated-date-${mockAnnouncement.id}`)).not.toBeInTheDocument();
  });

  test('does not show updated date when lastUpdatedAtUTC is null', () => {
    renderPublicationListItem();
    expect(screen.queryByTestId(`PublicationItem-updated-date-${mockAnnouncement.id}`)).not.toBeInTheDocument();
  });

  // --- Edge cases ---
  test('renders without crashing when content is empty', () => {
    renderPublicationListItem({ ...mockAnnouncement, content: '' });
    expect(screen.getByTestId(`PublicationItem-author-${mockAnnouncement.id}`)).toBeInTheDocument();
  });

  test('renders without crashing when attachments are empty', () => {
    renderPublicationListItem();

    expect(
      screen.queryByTestId(`AttachmentsList-${mockAnnouncement.id}`),
    ).not.toBeInTheDocument();
  });

  test('renders without crashing when assignment has no deadline', () => {
    renderPublicationListItem({
      ...mockAssignment,
      publicationPayload: initAssignmentPayload({
        title: 'Задание без дедлайна',
        deadlineUtc: null,
      } as any),
    });
    expect(screen.getByTestId(`PublicationItem-title-${mockAssignment.id}`)).toHaveTextContent('Задание без дедлайна');
    expect(screen.queryByText(/Срок сдачи/)).not.toBeInTheDocument();
  });

  test('link href changes when different id is passed', () => {
    renderPublicationListItem({ ...mockAnnouncement, id: 42 });
    expect(screen.getByRole('link')).toHaveAttribute('href', '/announcements/42');
  });

  // --- Publication type check ---
  test('applies correct icon class for announcement', () => {
    renderPublicationListItem();
    const avatar = screen.getByTestId(`PublicationItem-type-icon-${mockAnnouncement.id}`);
    expect(avatar.className).toMatch(/typeIconAnnouncement/);
  });

  test('applies correct icon class for assignment', () => {
    renderPublicationListItem(mockAssignment);
    const avatar = screen.getByTestId(`PublicationItem-type-icon-${mockAssignment.id}`);
    expect(avatar.className).toMatch(/typeIconAssignment/);
  });

  // --- Menu button ---

  test('renders menu button', () => {
    renderPublicationListItem();

    expect(
      screen.getByTestId(`PublicationItem-menu-button-${mockAnnouncement.id}`),
    ).toBeInTheDocument();
  });

  test('menu button is outside the navigation link', () => {
    renderPublicationListItem();

    const link = screen.getByRole('link');
    const menuButton = screen.getByTestId(
      `PublicationItem-menu-button-${mockAnnouncement.id}`,
    );
    expect(link).not.toContainElement(menuButton);
  });

  test('clicking menu button opens menu with Редактировать option', async () => {
    const user = userEvent.setup();
    renderPublicationListItem();

    await user.click(
      screen.getByTestId(`PublicationItem-menu-button-${mockAnnouncement.id}`),
    );

    await waitFor(() => {
      expect(
        screen.getByRole('menuitem', { name: /редактировать/i }),
      ).toBeInTheDocument();
    });
  });

  test('clicking Редактировать on announcement opens EditAnnouncementModal', async () => {
    const user = userEvent.setup();
    renderPublicationListItem(mockAnnouncement);

    await user.click(
      screen.getByTestId(`PublicationItem-menu-button-${mockAnnouncement.id}`),
    );
    await user.click(screen.getByRole('menuitem', { name: /редактировать/i }));

    await waitFor(() => {
      expect(screen.getByTestId('EditAnnouncementModal')).toBeInTheDocument();
    });
  });

  test('clicking Редактировать on assignment opens EditAssignmentModal', async () => {
    const user = userEvent.setup();
    renderPublicationListItem(mockAssignment);

    await user.click(
      screen.getByTestId(`PublicationItem-menu-button-${mockAssignment.id}`),
    );
    await user.click(screen.getByRole('menuitem', { name: /редактировать/i }));

    await waitFor(() => {
      expect(screen.getByTestId('EditAssignmentModal')).toBeInTheDocument();
    });
  });

  test('EditAnnouncementModal receives pre-filled props from publication', async () => {
    const user = userEvent.setup();
    renderPublicationListItem(mockAnnouncement);

    await user.click(
      screen.getByTestId(`PublicationItem-menu-button-${mockAnnouncement.id}`),
    );
    await user.click(screen.getByRole('menuitem', { name: /редактировать/i }));

    await waitFor(() => {
      expect(mockEditAnnouncementModal).toHaveBeenCalledWith(
        expect.objectContaining({
          publicationId: mockAnnouncement.id,
          initialContent: mockAnnouncement.content,
        }),
      );
    });
  });

  test('EditAssignmentModal receives pre-filled props from publication', async () => {
    const user = userEvent.setup();
    renderPublicationListItem(mockAssignment);

    await user.click(
      screen.getByTestId(`PublicationItem-menu-button-${mockAssignment.id}`),
    );
    await user.click(screen.getByRole('menuitem', { name: /редактировать/i }));

    await waitFor(() => {
      expect(mockEditAssignmentModal).toHaveBeenCalledWith(
        expect.objectContaining({
          publicationId: mockAssignment.id,
          initialContent: mockAssignment.content,
        }),
      );
    });
  });

  // --- Delete button ---

  test('menu contains Удалить option', async () => {
    const user = userEvent.setup();
    renderPublicationListItem();

    await user.click(
      screen.getByTestId(`PublicationItem-menu-button-${mockAnnouncement.id}`),
    );

    await waitFor(() => {
      expect(
        screen.getByRole('menuitem', { name: /удалить/i }),
      ).toBeInTheDocument();
    });
  });

  test('clicking Удалить opens confirmation dialog', async () => {
    const user = userEvent.setup();
    mockShowConfirm.mockResolvedValue(false);
    renderPublicationListItem();

    await user.click(
      screen.getByTestId(`PublicationItem-menu-button-${mockAnnouncement.id}`),
    );
    await user.click(screen.getByRole('menuitem', { name: /удалить/i }));

    await waitFor(() => {
      expect(mockShowConfirm).toHaveBeenCalled();
    });
  });

  test('cancelling confirmation does not call delete mutation', async () => {
    const user = userEvent.setup();
    mockShowConfirm.mockResolvedValue(false);
    renderPublicationListItem();

    await user.click(
      screen.getByTestId(`PublicationItem-menu-button-${mockAnnouncement.id}`),
    );
    await user.click(screen.getByRole('menuitem', { name: /удалить/i }));

    await waitFor(() => {
      expect(mockShowConfirm).toHaveBeenCalled();
    });
    expect(mockDeleteAnnouncementMutateAsync).not.toHaveBeenCalled();
  });

  test('confirming deletion calls useDeleteAnnouncementMutation for announcement', async () => {
    const user = userEvent.setup();
    mockShowConfirm.mockResolvedValue(true);
    mockDeleteAnnouncementMutateAsync.mockResolvedValue(undefined);
    renderPublicationListItem(mockAnnouncement);

    await user.click(
      screen.getByTestId(`PublicationItem-menu-button-${mockAnnouncement.id}`),
    );
    await user.click(screen.getByRole('menuitem', { name: /удалить/i }));

    await waitFor(() => {
      expect(mockDeleteAnnouncementMutateAsync).toHaveBeenCalled();
    });
  });

  test('confirming deletion calls useDeleteAssignmentMutation for assignment', async () => {
    const user = userEvent.setup();
    mockShowConfirm.mockResolvedValue(true);
    mockDeleteAssignmentMutateAsync.mockResolvedValue(undefined);
    renderPublicationListItem(mockAssignment);

    await user.click(
      screen.getByTestId(`PublicationItem-menu-button-${mockAssignment.id}`),
    );
    await user.click(screen.getByRole('menuitem', { name: /удалить/i }));

    await waitFor(() => {
      expect(mockDeleteAssignmentMutateAsync).toHaveBeenCalled();
    });
  });

  test('successful deletion shows success snackbar', async () => {
    const user = userEvent.setup();
    mockShowConfirm.mockResolvedValue(true);
    mockDeleteAnnouncementMutateAsync.mockResolvedValue(undefined);
    renderPublicationListItem(mockAnnouncement);

    await user.click(
      screen.getByTestId(`PublicationItem-menu-button-${mockAnnouncement.id}`),
    );
    await user.click(screen.getByRole('menuitem', { name: /удалить/i }));

    await waitFor(() => {
      expect(screen.getByText('Успешно удалено')).toBeInTheDocument();
    });
  });

  test('successful deletion invalidates publications query', async () => {
    const user = userEvent.setup();
    mockShowConfirm.mockResolvedValue(true);
    mockDeleteAnnouncementMutateAsync.mockResolvedValue(undefined);
    renderPublicationListItem(mockAnnouncement);

    await user.click(
      screen.getByTestId(`PublicationItem-menu-button-${mockAnnouncement.id}`),
    );
    await user.click(screen.getByRole('menuitem', { name: /удалить/i }));

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalled();
    });
  });

  test('failed deletion shows error snackbar', async () => {
    const user = userEvent.setup();
    mockShowConfirm.mockResolvedValue(true);
    mockDeleteAnnouncementMutateAsync.mockRejectedValue(new Error('Server error'));
    renderPublicationListItem(mockAnnouncement);

    await user.click(
      screen.getByTestId(`PublicationItem-menu-button-${mockAnnouncement.id}`),
    );
    await user.click(screen.getByRole('menuitem', { name: /удалить/i }));

    await waitFor(() => {
      expect(screen.getByText('Возникла ошибка при удалении')).toBeInTheDocument();
    });
  });
});