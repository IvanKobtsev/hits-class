import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AssignmentPage } from './AssignmentPage';

vi.mock('services/api/api-client/AssignmentQuery', () => ({
  useGetAssignmentQuery: vi.fn(),
}));

vi.mock('services/api/api-client/SubmissionQuery', () => ({
  useGetMySubmissionQuery: vi.fn(),
}));

vi.mock('./AssignmentView/AssignmentView', () => ({
  AssignmentView: () => <div data-testid="AssignmentView" />,
}));

vi.mock('./SubmissionPanel/SubmissionPanel', () => ({
  SubmissionPanel: () => <div data-testid="SubmissionPanel" />,
}));

vi.mock('./PrivateCommentView/PrivateCommentView', () => ({
  PrivateCommentView: () => <div data-testid="PrivateCommentView" />,
}));

vi.mock('./PublicCommentView/PublicCommentView', () => ({
  PublicCommentView: () => <div data-testid="PublicCommentView" />,
}));

import { useGetAssignmentQuery } from 'services/api/api-client/AssignmentQuery';
import { useGetMySubmissionQuery } from 'services/api/api-client/SubmissionQuery';

const mockedUseGetAssignmentQuery = vi.mocked(useGetAssignmentQuery);
const mockedUseGetMySubmissionQuery = vi.mocked(useGetMySubmissionQuery);

const mockAssignment = {
  id: 1,
  title: 'Домашнее задание',
  description: null,
  author: { id: 'u1', email: 'teacher@example.com', legalName: 'Иван Петров', groupNumber: null },
  deadlineUTC: null,
  createdAtUTC: new Date('2025-03-01T10:00:00Z'),
  lastUpdatedAtUTC: null,
  attachments: [],
  comments: [],
};

const mockSubmission = {
  id: 1,
  state: 'Draft',
  mark: null,
  lastSubmittedAtUTC: null,
  lastMarkedAtUTC: null,
  attachments: [],
  author: mockAssignment.author,
  comments: [],
};

function renderAssignmentPage(courseId = 10, assignmentId = 1) {
  return render(
    <MemoryRouter initialEntries={[`/course/${courseId}/assignment/${assignmentId}`]}>
      <Routes>
        <Route path="/course/:courseId/assignment/:assignmentId" element={<AssignmentPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AssignmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseGetAssignmentQuery.mockReturnValue({
      isLoading: false,
      data: mockAssignment,
      isError: false,
    } as any);
    mockedUseGetMySubmissionQuery.mockReturnValue({
      isLoading: false,
      data: mockSubmission,
      isError: false,
    } as any);
  });

  test('renders AssignmentView', () => {
    renderAssignmentPage();

    expect(screen.getByTestId('AssignmentView')).toBeInTheDocument();
  });

  test('renders SubmissionPanel', () => {
    renderAssignmentPage();

    expect(screen.getByTestId('SubmissionPanel')).toBeInTheDocument();
  });

  test('renders PrivateCommentView', () => {
    renderAssignmentPage();

    expect(screen.getByTestId('PrivateCommentView')).toBeInTheDocument();
  });

  test('renders PublicCommentView', () => {
    renderAssignmentPage();

    expect(screen.getByTestId('PublicCommentView')).toBeInTheDocument();
  });
});
