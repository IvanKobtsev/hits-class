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

const mockAuthor: UserDto = {
  id: 'author-1',
  email: 'teacher@example.com',
  legalName: 'Иван Петров',
  groupNumber: null,
};

const mockAssignment: PublicationDto = {
  id: 1,
  content: 'Реализуйте сортировку пузырьком',
  author: mockAuthor,
  createdAtUTC: new Date('2025-03-01T10:30:00Z'),
  lastUpdatedAtUTC: null,
  attachments: [],
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

  test('displays deadline with date and time', () => {
    renderAssignmentView({ assignment: mockAssignment });

    const el = screen.getByTestId('AssignmentView-deadline');
    // deadlineUTC — 15 марта 2025, в тексте должны быть и дата, и время
    expect(el.textContent).toMatch(/\b15\b/);
    expect(el.textContent).toMatch(/2025/);
    expect(el.textContent).toMatch(/\d{1,2}:\d{2}/);
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
