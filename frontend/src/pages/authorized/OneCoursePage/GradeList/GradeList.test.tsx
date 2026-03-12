import { render, screen } from '@testing-library/react';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { GradeList } from './GradeList';
import { AssignmentPayload, PublicationDto, PublicationType } from 'services/api/api-client.types';

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual };
});

vi.mock('services/api/api-client/SubmissionQuery', () => ({
  useGetMySubmissionQuery: vi.fn().mockReturnValue({ data: undefined }),
}));

vi.mock('./GradeListItem.module.scss', () => ({
  default: { content: 'content', info: 'info', chips: 'chips' },
}));

// --- фабрики ---

function makeAssignment(id: number, createdAtUTC = new Date('2024-01-01T00:00:00Z')): PublicationDto {
  return {
    id,
    type: PublicationType.Assignment,
    createdAtUTC,
    lastUpdatedAtUTC: null,
    content: null,
    author: { id: 'u1', email: 'teacher@test.com', legalName: 'Преподаватель', groupNumber: null },
    attachments: [],
    targetUserIds: [],
    publicationPayload: {
      publicationType: 'Assignment',
      title: `Задание ${id}`,
      deadlineUtc: null,
    } as AssignmentPayload,
  };
}

function makeAnnouncement(id: number): PublicationDto {
  return {
    id,
    type: PublicationType.Announcement,
    createdAtUTC: new Date('2024-01-01T00:00:00Z'),
    lastUpdatedAtUTC: null,
    content: 'Объявление',
    author: { id: 'u1', email: 'teacher@test.com', legalName: 'Преподаватель', groupNumber: null },
    attachments: [],
    targetUserIds: [],
    publicationPayload: { publicationType: 'Announcement' },
  };
}

function renderList(publications: PublicationDto[]) {
  return render(
    <MemoryRouter>
      <GradeList publications={publications} />
    </MemoryRouter>,
  );
}

// ============================================================
// Пустое состояние
// ============================================================
describe('GradeList — empty state', () => {
  test('shows empty message when publications array is empty', () => {
    renderList([]);
    expect(screen.getByText('В этом курсе пока нет заданий')).toBeInTheDocument();
  });

  test('shows empty message when there are only announcements', () => {
    renderList([makeAnnouncement(1), makeAnnouncement(2)]);
    expect(screen.getByText('В этом курсе пока нет заданий')).toBeInTheDocument();
  });

  test('does not render any GradeItem when empty', () => {
    renderList([]);
    expect(screen.queryAllByTestId(/^GradeItem-\d+$/)).toHaveLength(0);
  });
});

// ============================================================
// Рендер элементов
// ============================================================
describe('GradeList — rendering', () => {
  test('renders a single assignment', () => {
    renderList([makeAssignment(1)]);
    expect(screen.getByTestId('GradeItem-1')).toBeInTheDocument();
  });

  test('renders all assignments', () => {
    renderList([makeAssignment(1), makeAssignment(2), makeAssignment(3)]);
    expect(screen.getAllByTestId(/^GradeItem-\d+$/)).toHaveLength(3);
  });

  test('does not render announcements', () => {
    renderList([makeAssignment(1), makeAnnouncement(99)]);
    expect(screen.queryByTestId('GradeItem-99')).not.toBeInTheDocument();
  });

  test('renders assignments but ignores announcements in mixed list', () => {
    renderList([makeAssignment(1), makeAnnouncement(2), makeAssignment(3)]);
    expect(screen.getAllByTestId(/^GradeItem-\d+$/)).toHaveLength(2);
  });
});

// ============================================================
// Порядок — новые сверху
// ============================================================
describe('GradeList — order', () => {
  test('renders newest assignment first', () => {
    renderList([
      makeAssignment(1, new Date('2024-01-01T00:00:00Z')),
      makeAssignment(2, new Date('2024-03-01T00:00:00Z')),
      makeAssignment(3, new Date('2024-06-01T00:00:00Z')),
    ]);
    const items = screen.getAllByTestId(/^GradeItem-\d+$/);
    expect(items[0]).toHaveAttribute('data-test-id', 'GradeItem-3');
    expect(items[1]).toHaveAttribute('data-test-id', 'GradeItem-2');
    expect(items[2]).toHaveAttribute('data-test-id', 'GradeItem-1');
  });

  test('renders single item without error', () => {
    renderList([makeAssignment(5, new Date('2024-06-01T00:00:00Z'))]);
    expect(screen.getByTestId('GradeItem-5')).toBeInTheDocument();
  });
});