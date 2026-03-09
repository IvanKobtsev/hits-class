import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AssignmentPage } from './AssignmentPage';

vi.mock('services/api/api-client/SubmissionQuery', () => ({
  useGetMySubmissionQuery: vi.fn(),
}));

vi.mock('./AssignmentView/AssignmentView', () => ({
  AssignmentView: () => <div data-test-id="AssignmentView" />,
}));

vi.mock('./CreateSubmissionPanel/SubmissionPanel', () => ({
  SubmissionPanel: () => <div data-test-id="SubmissionPanel" />,
}));

vi.mock('./PrivateCommentView/PrivateCommentView', () => ({
  PrivateCommentView: () => <div data-test-id="PrivateCommentView" />,
}));

vi.mock('./PublicCommentView/PublicCommentView', () => ({
  PublicCommentView: () => <div data-test-id="PublicCommentView" />,
}));

import { useGetMySubmissionQuery } from 'services/api/api-client/SubmissionQuery';

const mockedUseGetMySubmissionQuery = vi.mocked(useGetMySubmissionQuery);

const mockSubmission = {
  id: 1,
  state: 'Draft',
  mark: null,
  lastSubmittedAtUTC: null,
  lastMarkedAtUTC: null,
  attachments: [],
  author: {
    id: 'u1',
    email: 'teacher@example.com',
    legalName: 'Иван Петров',
    groupNumber: null,
  },
  comments: [],
};

function renderAssignmentPage(courseId = 10, assignmentId = 1) {
  return render(
    <MemoryRouter
      initialEntries={[`/course/${courseId}/assignment/${assignmentId}`]}
    >
      <Routes>
        <Route
          path="/course/:courseId/assignment/:assignmentId"
          element={<AssignmentPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

// TODO: use useGetAssignmentQuery once implemented on backend

describe('AssignmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
