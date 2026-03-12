import { render, screen } from '@testing-library/react';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { GradeListItem, getOverdueStatus } from './GradeListItem';
import { AssignmentPayload, PublicationDto, PublicationType, SubmissionState } from 'services/api/api-client.types';

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual };
});

vi.mock('services/api/api-client/SubmissionQuery', () => ({
  useGetMySubmissionQuery: vi.fn(),
}));

vi.mock('./GradeListItem.module.scss', () => ({
  default: { content: 'content', info: 'info', chips: 'chips' },
}));

import { useGetMySubmissionQuery } from 'services/api/api-client/SubmissionQuery';

const mockUseGetMySubmissionQuery = useGetMySubmissionQuery as ReturnType<typeof vi.fn>;

const PAST_DATE = new Date('2020-01-01T10:00:00Z');
const FUTURE_DATE = new Date('2099-12-31T23:59:59Z');

function makePublication(overrides: Partial<PublicationDto> = {}): PublicationDto {
  return {
    id: 42,
    type: PublicationType.Assignment,
    createdAtUTC: new Date('2024-01-01T08:00:00Z'),
    lastUpdatedAtUTC: null,
    content: null,
    author: { id: 'u1', email: 'teacher@test.com', legalName: 'Преподаватель', groupNumber: null },
    attachments: [],
    targetUserIds: [],
    publicationPayload: {
      publicationType: 'Assignment',
      title: 'Тестовое задание',
      deadlineUtc: null,
    } as AssignmentPayload,
    ...overrides,
  };
}

function makeSubmission(overrides = {}) {
  return {
    id: 1,
    state: SubmissionState.Submitted,
    mark: null,
    lastSubmittedAtUTC: null,
    lastMarkedAtUTC: null,
    attachments: [],
    author: { id: 'u2', email: 'student@test.com', legalName: 'Студент', groupNumber: '101' },
    comments: [],
    ...overrides,
  };
}

function renderItem(publication: PublicationDto) {
  return render(
    <MemoryRouter>
      <GradeListItem publication={publication} />
    </MemoryRouter>,
  );
}

// ============================================================
// getOverdueStatus
// ============================================================
describe('getOverdueStatus', () => {
  test('returns no_deadline when deadline is null', () => {
    expect(getOverdueStatus(null, null)).toBe('no_deadline');
  });

  test('returns no_deadline when deadline is undefined', () => {
    expect(getOverdueStatus(undefined, null)).toBe('no_deadline');
  });

  test('returns on_time when submitted before deadline', () => {
    const deadline = new Date('2024-06-01T12:00:00Z');
    const submitted = new Date('2024-06-01T11:59:59Z');
    expect(getOverdueStatus(deadline, submitted)).toBe('on_time');
  });

  test('returns on_time when submitted exactly at deadline', () => {
    const exact = new Date('2024-06-01T12:00:00Z');
    expect(getOverdueStatus(exact, exact)).toBe('on_time');
  });

  test('returns overdue when submitted after deadline', () => {
    const deadline = new Date('2024-06-01T12:00:00Z');
    const submitted = new Date('2024-06-01T12:00:01Z');
    expect(getOverdueStatus(deadline, submitted)).toBe('overdue');
  });

  test('returns overdue when not submitted and deadline has passed', () => {
    expect(getOverdueStatus(PAST_DATE, null)).toBe('overdue');
  });

  test('returns on_time when not submitted but deadline is in the future', () => {
    expect(getOverdueStatus(FUTURE_DATE, null)).toBe('on_time');
  });
});

// ============================================================
// basic info
// ============================================================
describe('GradeListItem — basic info', () => {
  beforeEach(() => {
    mockUseGetMySubmissionQuery.mockReturnValue({ data: undefined });
  });

  test('renders assignment title', () => {
    renderItem(makePublication());
    expect(screen.getByTestId('GradeItem-title-42')).toHaveTextContent('Тестовое задание');
  });

  test('renders "Без названия" when title is empty', () => {
    renderItem(makePublication({
      publicationPayload: { publicationType: 'Assignment', title: '', deadlineUtc: null } as AssignmentPayload,
    }));
    expect(screen.getByTestId('GradeItem-title-42')).toHaveTextContent('Без названия');
  });

  test('renders creation date', () => {
    renderItem(makePublication());
    expect(screen.getByTestId('GradeItem-date-42')).toBeInTheDocument();
  });

  test('does not render deadline block when deadlineUtc is null', () => {
    renderItem(makePublication());
    expect(screen.queryByTestId('GradeItem-deadline-42')).not.toBeInTheDocument();
  });

  test('renders deadline with hours minutes seconds when set', () => {
    renderItem(makePublication({
      publicationPayload: {
        publicationType: 'Assignment',
        title: 'Задание',
        deadlineUtc: new Date('2024-06-15T18:30:45Z'),
      } as AssignmentPayload,
    }));
    expect(screen.getByTestId('GradeItem-deadline-42').textContent).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  test('link href points to assignment page', () => {
    renderItem(makePublication());
    expect(screen.getByTestId('GradeItem-action-area-42')).toHaveAttribute('href', '/assignments/42');
  });

  test('link href changes when different id is passed', () => {
    renderItem(makePublication({ id: 7 }));
    expect(screen.getByTestId('GradeItem-action-area-7')).toHaveAttribute('href', '/assignments/7');
  });
});

// ============================================================as
// no submission
// ============================================================
describe('GradeListItem — no submission', () => {
  beforeEach(() => {
    mockUseGetMySubmissionQuery.mockReturnValue({ data: undefined });
  });

  test('shows "Не сдано" chip', () => {
    renderItem(makePublication());
    expect(screen.getByTestId('GradeItem-not-submitted-42')).toBeInTheDocument();
  });

  test('does not show submission state chip', () => {
    renderItem(makePublication());
    expect(screen.queryByTestId('GradeItem-state-42')).not.toBeInTheDocument();
  });

  test('does not show mark chip', () => {
    renderItem(makePublication());
    expect(screen.queryByTestId('GradeItem-mark-42')).not.toBeInTheDocument();
  });

  test('does not show submitted-at time', () => {
    renderItem(makePublication());
    expect(screen.queryByTestId('GradeItem-submitted-at-42')).not.toBeInTheDocument();
  });
});

// ============================================================
// submission states
// ============================================================
describe('GradeListItem — submission states', () => {
  test('shows "Черновик" chip for Draft state', () => {
    mockUseGetMySubmissionQuery.mockReturnValue({
      data: makeSubmission({ state: SubmissionState.Draft }),
    });
    renderItem(makePublication());
    expect(screen.getByTestId('GradeItem-state-42')).toHaveTextContent('Черновик');
  });

  test('shows "Сдано" chip for Submitted state', () => {
    mockUseGetMySubmissionQuery.mockReturnValue({
      data: makeSubmission({ state: SubmissionState.Submitted }),
    });
    renderItem(makePublication());
    expect(screen.getByTestId('GradeItem-state-42')).toHaveTextContent('Сдано');
  });

  test('shows "Принято" chip for Accepted state', () => {
    mockUseGetMySubmissionQuery.mockReturnValue({
      data: makeSubmission({ state: SubmissionState.Accepted }),
    });
    renderItem(makePublication());
    expect(screen.getByTestId('GradeItem-state-42')).toHaveTextContent('Принято');
  });

  test('does not show mark chip when mark is null', () => {
    mockUseGetMySubmissionQuery.mockReturnValue({
      data: makeSubmission({ mark: null }),
    });
    renderItem(makePublication());
    expect(screen.queryByTestId('GradeItem-mark-42')).not.toBeInTheDocument();
  });

  test('shows mark chip when mark is set', () => {
    mockUseGetMySubmissionQuery.mockReturnValue({
      data: makeSubmission({ mark: '5' }),
    });
    renderItem(makePublication());
    expect(screen.getByTestId('GradeItem-mark-42')).toHaveTextContent('Оценка: 5');
  });
});

// ============================================================
// Время сдачи
// ============================================================
describe('GradeListItem — submitted-at time', () => {
  test('shows submitted-at with hours minutes seconds', () => {
    mockUseGetMySubmissionQuery.mockReturnValue({
      data: makeSubmission({ lastSubmittedAtUTC: new Date('2024-06-10T14:25:30Z') }),
    });
    renderItem(makePublication());
    expect(screen.getByTestId('GradeItem-submitted-at-42').textContent).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  test('does not show submitted-at when lastSubmittedAtUTC is null', () => {
    mockUseGetMySubmissionQuery.mockReturnValue({
      data: makeSubmission({ lastSubmittedAtUTC: null }),
    });
    renderItem(makePublication());
    expect(screen.queryByTestId('GradeItem-submitted-at-42')).not.toBeInTheDocument();
  });
});

// ============================================================
// Просрочка
// ============================================================
describe('GradeListItem — overdue', () => {
  test('shows "Просрочено" chip when submitted after deadline', () => {
    mockUseGetMySubmissionQuery.mockReturnValue({
      data: makeSubmission({ lastSubmittedAtUTC: new Date('2024-06-02T10:00:00Z') }),
    });
    renderItem(makePublication({
      publicationPayload: {
        publicationType: 'Assignment',
        title: 'Задание',
        deadlineUtc: new Date('2024-06-01T12:00:00Z'),
      } as AssignmentPayload,
    }));
    expect(screen.getByTestId('GradeItem-overdue-42')).toBeInTheDocument();
  });

  test('shows "Просрочено" chip when not submitted and deadline has passed', () => {
    mockUseGetMySubmissionQuery.mockReturnValue({ data: undefined });
    renderItem(makePublication({
      publicationPayload: { publicationType: 'Assignment', title: 'Задание', deadlineUtc: PAST_DATE } as AssignmentPayload,
    }));
    expect(screen.getByTestId('GradeItem-overdue-42')).toBeInTheDocument();
  });

  test('does not show "Просрочено" chip when submitted on time', () => {
    mockUseGetMySubmissionQuery.mockReturnValue({
      data: makeSubmission({ lastSubmittedAtUTC: new Date('2024-06-01T11:00:00Z') }),
    });
    renderItem(makePublication({
      publicationPayload: {
        publicationType: 'Assignment',
        title: 'Задание',
        deadlineUtc: new Date('2024-06-01T12:00:00Z'),
      } as AssignmentPayload,
    }));
    expect(screen.queryByTestId('GradeItem-overdue-42')).not.toBeInTheDocument();
  });

  test('does not show "Просрочено" chip when no deadline', () => {
    mockUseGetMySubmissionQuery.mockReturnValue({ data: undefined });
    renderItem(makePublication());
    expect(screen.queryByTestId('GradeItem-overdue-42')).not.toBeInTheDocument();
  });

  test('does not show "Просрочено" chip when not submitted but deadline is in the future', () => {
    mockUseGetMySubmissionQuery.mockReturnValue({ data: undefined });
    renderItem(makePublication({
      publicationPayload: { publicationType: 'Assignment', title: 'Задание', deadlineUtc: FUTURE_DATE } as AssignmentPayload,
    }));
    expect(screen.queryByTestId('GradeItem-overdue-42')).not.toBeInTheDocument();
  });
});