import { render, screen } from '@testing-library/react';
import { vi, test, expect, describe } from 'vitest';
import { MemoryRouter } from 'react-router';
import { PublicationList } from './PublicationList';

vi.mock(
  './PublicationListItem/EditAnnouncementModal/EditAnnouncementModal',
  () => ({ EditAnnouncementModal: () => null }),
);

vi.mock(
  './PublicationListItem/EditAssignmentModal/EditAssignmentModal',
  () => ({ EditAssignmentModal: () => null }),
);

vi.mock('components/uikit/modal/useModal', () => ({
  useModal: () => ({ showConfirm: vi.fn() }),
}));

vi.mock('@tanstack/react-query', async (importActual) => {
  const actual = await importActual<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

vi.mock('services/api/api-client/AnnouncementQuery', () => ({
  useDeleteAnnouncementMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('services/api/api-client/AssignmentQuery', () => ({
  useDeleteAssignmentMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
import {
  initAnnouncementPayload,
  initAssignmentPayload,
  PublicationDto,
  PublicationType,
} from 'services/api/api-client.types';

const mockAuthor = {
  id: 'teacher-1',
  email: 'teacher@test.com',
  legalName: 'Иванов Иван Иванович',
  groupNumber: null,
};

const mockDate = new Date('2024-03-15T10:00:00Z');

const mockPublications: PublicationDto[] = [
  {
    id: 1,
    type: PublicationType.Announcement,
    createdAtUTC: mockDate,
    lastUpdatedAtUTC: null,
    content: 'Тестовое объявление 1',
    author: mockAuthor,
    attachments: [],
    publicationPayload: initAnnouncementPayload({} as any),
  },
  {
    id: 2,
    type: PublicationType.Assignment,
    createdAtUTC: mockDate,
    lastUpdatedAtUTC: null,
    content: 'Тестовое задание 1',
    author: mockAuthor,
    attachments: [],
    publicationPayload: initAssignmentPayload({
      title: 'Задание 1',
      deadlineUtc: '2024-04-01T13:59:00Z',
    } as any),
  },
  {
    id: 3,
    type: PublicationType.Announcement,
    createdAtUTC: mockDate,
    lastUpdatedAtUTC: null,
    content: 'Тестовое объявление 2',
    author: mockAuthor,
    attachments: [],
    publicationPayload: initAnnouncementPayload({} as any),
  },
];

function renderPublicationList(
  publications: PublicationDto[] = mockPublications,
) {
  return render(
    <MemoryRouter>
      <PublicationList publications={publications} />
    </MemoryRouter>,
  );
}

describe('PublicationList', () => {
  test('renders empty state when no publications', () => {
    renderPublicationList([]);

    expect(screen.getByText('Здесь пока нет публикаций')).toBeInTheDocument();
  });

  test('renders all publications', () => {
    renderPublicationList();

    expect(screen.getByTestId('PublicationItem-1')).toBeInTheDocument();
    expect(screen.getByTestId('PublicationItem-2')).toBeInTheDocument();
    expect(screen.getByTestId('PublicationItem-3')).toBeInTheDocument();
  });

  test('renders publications in the order they are passed', () => {
    const reversed = [...mockPublications].reverse(); // [3, 2, 1]
    renderPublicationList(reversed);

    const items = screen.getAllByTestId(/^PublicationItem-\d+$/);

    expect(items[0]).toHaveAttribute('data-test-id', 'PublicationItem-3');
    expect(items[1]).toHaveAttribute('data-test-id', 'PublicationItem-2');
    expect(items[2]).toHaveAttribute('data-test-id', 'PublicationItem-1');
  });

  test('renders correct number of publications', () => {
    renderPublicationList();
    
    const items = screen.getAllByTestId(/^PublicationItem-\d+$/);
    expect(items).toHaveLength(3);
  });

  test('renders correct content in publications', () => {
    renderPublicationList();

    expect(screen.getByTestId('PublicationItem-1')).toBeInTheDocument();
    expect(screen.getByTestId('PublicationItem-2')).toBeInTheDocument();
    expect(screen.getByTestId('PublicationItem-3')).toBeInTheDocument();

    expect(screen.getByTestId('PublicationItem-content-1')).toHaveTextContent(
      'Тестовое объявление 1',
    );
    expect(screen.getByTestId('PublicationItem-content-2')).toHaveTextContent(
      'Тестовое задание 1',
    );
    expect(screen.getByTestId('PublicationItem-content-3')).toHaveTextContent(
      'Тестовое объявление 2',
    );
  });
});
