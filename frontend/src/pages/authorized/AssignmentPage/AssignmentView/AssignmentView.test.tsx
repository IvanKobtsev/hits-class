import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { AssignmentView } from './AssignmentView';
import {
  AssignmentPayload,
  PublicationDto,
  SubmissionDto,
  SubmissionState,
  UserDto,
} from 'services/api/api-client.types';

vi.mock('components/lexical/LexicalViewer', () => ({
  LexicalViewer: ({ lexicalState }: { lexicalState: string }) => (
    <div>{lexicalState}</div>
  ),
}));

vi.mock(
  'pages/authorized/OneCoursePage/PublicatonsList/PublicationListItem/AttachmentsList/AttachmentsList',
  () => ({
    AttachmentsList: ({ attachments }: { attachments: unknown[] }) => (
      <div data-test-id="AttachmentsList-mock">{attachments.length} files</div>
    ),
  }),
);

const mockAuthor: UserDto = {
  id: 'author-1',
  email: 'teacher@example.com',
  legalName: 'Иван Петров',
  groupNumber: null,
  roles: null,
};

const mockAssignment: PublicationDto = {
  id: 1,
  content: 'Реализуйте сортировку пузырьком',
  author: mockAuthor,
  createdAtUTC: new Date('2025-03-01T10:30:00Z'),
  lastUpdatedAtUTC: null,
  attachments: [],
  targetUserIds: [],
  type: 'Assignment' as any,
  publicationPayload: {
    publicationType: 'Assignment',
    title: 'Домашнее задание по алгоритмам',
    deadlineUtc: new Date('2025-03-15T18:00:00Z'),
  } as AssignmentPayload,
};

const mockSubmission: SubmissionDto = {
  id: 1,
  state: SubmissionState.Accepted,
  mark: '85',
  lastSubmittedAtUTC: new Date('2025-03-14T12:00:00Z'),
  lastMarkedAtUTC: new Date('2025-03-14T14:00:00Z'),
  attachments: [],
  author: mockAuthor,
  comments: [],
};

function renderAssignmentView(props: {
  assignment: PublicationDto;
  submission?: SubmissionDto | null;
}) {
  return render(<AssignmentView {...props} />);
}

describe('AssignmentView', () => {
  // --- Основные поля ---

  test('displays assignment title', () => {
    renderAssignmentView({ assignment: mockAssignment });

    expect(screen.getByTestId('AssignmentView-title')).toHaveTextContent(
      'Домашнее задание по алгоритмам',
    );
  });

  test('displays author legal name', () => {
    renderAssignmentView({ assignment: mockAssignment });

    expect(screen.getByTestId('AssignmentView-author')).toHaveTextContent(
      'Иван Петров',
    );
  });

  test('displays date of publication', () => {
    renderAssignmentView({ assignment: mockAssignment });

    const el = screen.getByTestId('AssignmentView-publication-date');
    // createdAtUTC — 1 марта 2025
    expect(el.textContent).toMatch(/\b1\b|\b01\b/);
    expect(el.textContent).toMatch(/2025/);
  });

  test('displays deadline in local time', () => {
    renderAssignmentView({ assignment: mockAssignment });

    const el = screen.getByTestId('AssignmentView-deadline');
    const deadline = new Date('2025-03-15T18:00:00Z');
    // Expected values from local time methods (not UTC)
    const localDay = String(deadline.getDate()).padStart(2, '0');
    const localMonth = String(deadline.getMonth() + 1).padStart(2, '0');
    const localYear = String(deadline.getFullYear());
    const localHours = String(deadline.getHours()).padStart(2, '0');
    const localMinutes = String(deadline.getMinutes()).padStart(2, '0');

    expect(el.textContent).toContain(localDay);
    expect(el.textContent).toContain(localYear);
    expect(el.textContent).toContain(`${localHours}:${localMinutes}`);
    // Verify date part uses local date, not UTC
    expect(el.textContent).toContain(localMonth);
  });

  test('displays assignment description', () => {
    renderAssignmentView({ assignment: mockAssignment });

    expect(screen.getByTestId('AssignmentView-description')).toHaveTextContent(
      'Реализуйте сортировку пузырьком',
    );
  });

  test('displays student mark when submission is provided', () => {
    renderAssignmentView({
      assignment: mockAssignment,
      submission: mockSubmission,
    });

    expect(screen.getByTestId('AssignmentView-mark')).toHaveTextContent('85');
  });

  // --- Граничные случаи ---

  test('does not display mark when submission is not provided', () => {
    renderAssignmentView({ assignment: mockAssignment });

    expect(screen.queryByTestId('AssignmentView-mark')).not.toBeInTheDocument();
  });

  test('does not display mark when submission mark is null', () => {
    renderAssignmentView({
      assignment: mockAssignment,
      submission: { ...mockSubmission, mark: null },
    });

    expect(screen.queryByTestId('AssignmentView-mark')).not.toBeInTheDocument();
  });

  test('renders attachments list below description when attachments present', () => {
    const withAttachments: PublicationDto = {
      ...mockAssignment,
      attachments: [
        { uuid: 'f1', fileName: 'hw.pdf', size: 1024, createdAt: new Date('2025-01-01') },
      ],
    };
    renderAssignmentView({ assignment: withAttachments });

    expect(screen.getByTestId('AttachmentsList-mock')).toBeInTheDocument();
  });

  test('does not render attachments list when assignment has no attachments', () => {
    renderAssignmentView({ assignment: { ...mockAssignment, attachments: [] } });

    expect(screen.queryByTestId('AttachmentsList-mock')).not.toBeInTheDocument();
  });

  test('shows placeholder when deadline is not set', () => {
    renderAssignmentView({
      assignment: {
        ...mockAssignment,
        publicationPayload: { ...mockAssignment.publicationPayload, deadlineUtc: null } as AssignmentPayload,
      },
    });

    expect(screen.getByTestId('AssignmentView-deadline')).toHaveTextContent(
      'Не указан',
    );
  });
});
