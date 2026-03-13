import { render, screen } from '@testing-library/react';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { StudentSubmissionsTab } from './StudentSubmissionsTab';

const mockMutate = vi.fn();
vi.mock('services/api/api-client/SubmissionQuery', () => ({
  useGetSubmissionsQuery: vi.fn(),
  useGetSubmissionQuery: vi.fn(),
  useMarkSubmissionMutation: () => ({ mutate: mockMutate, isPending: false }),
  getSubmissionsQueryKey: vi.fn(() => ['submissions']),
  getSubmissionQueryKey: vi.fn(() => ['submission']),
}));

vi.mock('@tanstack/react-query', async (importActual) => {
  const actual = await importActual<typeof import('@tanstack/react-query')>();
  return { ...actual, useQueryClient: () => ({ invalidateQueries: vi.fn() }) };
});

vi.mock(
  'pages/authorized/OneCoursePage/PublicatonsList/PublicationListItem/AttachmentsList/AttachmentsList',
  () => ({ AttachmentsList: () => null }),
);

import {
  useGetSubmissionsQuery,
  useGetSubmissionQuery,
} from 'services/api/api-client/SubmissionQuery';

const mockedUseGetSubmissionsQuery = vi.mocked(useGetSubmissionsQuery);
const mockedUseGetSubmissionQuery = vi.mocked(useGetSubmissionQuery);

const DEADLINE = new Date('2024-04-01T12:00:00Z');
const BEFORE_DEADLINE = new Date('2024-04-01T10:00:00Z');
const AFTER_DEADLINE = new Date('2024-04-01T14:00:00Z');

const makeListItem = (overrides = {}) => ({
  id: 1,
  state: 'Submitted' as const,
  mark: null,
  lastSubmittedAtUTC: BEFORE_DEADLINE,
  author: { id: 'u1', email: 'a@a.com', legalName: 'Иванов Иван', groupNumber: null },
  ...overrides,
});

function renderTab(deadlineUtc: Date | null = DEADLINE) {
  mockedUseGetSubmissionQuery.mockReturnValue({ data: undefined } as any);
  return render(
    <MemoryRouter>
      <StudentSubmissionsTab assignmentId={10} deadlineUtc={deadlineUtc} />
    </MemoryRouter>,
  );
}

describe('StudentSubmissionsTab — late submission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows "Сдано с опозданием" badge when submitted after deadline', () => {
    mockedUseGetSubmissionsQuery.mockReturnValue({
      data: { data: [makeListItem({ lastSubmittedAtUTC: AFTER_DEADLINE })], totalCount: 1 },
    } as any);

    renderTab(DEADLINE);

    expect(screen.getByText('Сдано с опозданием')).toBeInTheDocument();
  });

  test('shows only "Сдано с опозданием" (not "Сдано") in the row badge when submitted after deadline', () => {
    mockedUseGetSubmissionsQuery.mockReturnValue({
      data: { data: [makeListItem({ lastSubmittedAtUTC: AFTER_DEADLINE })], totalCount: 1 },
    } as any);

    renderTab(DEADLINE);

    const row = screen.getByTestId('submission-row-1');
    // The row badge must say "Сдано с опозданием", not just "Сдано"
    const badge = row.querySelector('[class*="statusBadge"]');
    expect(badge?.textContent).toBe('Сдано с опозданием');
    expect(badge?.textContent).not.toBe('Сдано');
  });

  test('does not show "Сдано с опозданием" when submitted before deadline', () => {
    mockedUseGetSubmissionsQuery.mockReturnValue({
      data: { data: [makeListItem({ lastSubmittedAtUTC: BEFORE_DEADLINE })], totalCount: 1 },
    } as any);

    renderTab(DEADLINE);

    expect(screen.queryByText('Сдано с опозданием')).not.toBeInTheDocument();
  });

  test('does not show "Сдано с опозданием" when deadline is null', () => {
    mockedUseGetSubmissionsQuery.mockReturnValue({
      data: { data: [makeListItem({ lastSubmittedAtUTC: AFTER_DEADLINE })], totalCount: 1 },
    } as any);

    renderTab(null);

    expect(screen.queryByText('Сдано с опозданием')).not.toBeInTheDocument();
  });

  test('does not show "Сдано с опозданием" for draft', () => {
    mockedUseGetSubmissionsQuery.mockReturnValue({
      data: {
        data: [makeListItem({ state: 'Draft', lastSubmittedAtUTC: null })],
        totalCount: 1,
      },
    } as any);

    renderTab(DEADLINE);

    expect(screen.queryByText('Сдано с опозданием')).not.toBeInTheDocument();
  });

  test('"Сдано с опозданием" badge has statusLate CSS class', () => {
    mockedUseGetSubmissionsQuery.mockReturnValue({
      data: { data: [makeListItem({ lastSubmittedAtUTC: AFTER_DEADLINE })], totalCount: 1 },
    } as any);

    renderTab(DEADLINE);

    const badge = screen.getByText('Сдано с опозданием');
    expect(badge.className).toMatch(/statusLate/);
  });
});
