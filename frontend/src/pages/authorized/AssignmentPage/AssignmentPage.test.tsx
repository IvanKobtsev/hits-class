import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AssignmentPage } from './AssignmentPage';

vi.mock('services/api/api-client/PublicationsQuery', () => ({
  useGetPublicationByIdQuery: vi.fn(),
}));

vi.mock('services/api/api-client/SubmissionQuery', () => ({
  useGetMySubmissionQuery: vi.fn(),
}));

vi.mock('services/api/api-client/CourseQuery', () => ({
  useGetCourseQuery: vi.fn(),
}));

vi.mock('pages/authorized/OneCoursePage/useCourseRole', () => ({
  useCourseRole: vi.fn(),
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

import { useGetPublicationByIdQuery } from 'services/api/api-client/PublicationsQuery';
import { useGetMySubmissionQuery } from 'services/api/api-client/SubmissionQuery';
import { useGetCourseQuery } from 'services/api/api-client/CourseQuery';
import { useCourseRole } from 'pages/authorized/OneCoursePage/useCourseRole';

const mockedUseGetPublicationByIdQuery = vi.mocked(useGetPublicationByIdQuery);
const mockedUseGetMySubmissionQuery = vi.mocked(useGetMySubmissionQuery);
const mockedUseGetCourseQuery = vi.mocked(useGetCourseQuery);
const mockedUseCourseRole = vi.mocked(useCourseRole);

const mockPublication = {
  id: 1,
  type: 'Assignment',
  publicationPayload: { publicationType: 'Assignment', title: 'Домашнее задание', deadlineUtc: null },
  content: null,
  author: { id: 'u1', email: 'teacher@example.com', legalName: 'Иван Петров', groupNumber: null },
  createdAtUTC: new Date('2025-03-01T10:00:00Z'),
  lastUpdatedAtUTC: null,
  attachments: [],
};

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

describe('AssignmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseGetPublicationByIdQuery.mockReturnValue({
      isLoading: false,
      data: mockPublication,
      isError: false,
    } as any);
    mockedUseGetMySubmissionQuery.mockReturnValue({
      isLoading: false,
      data: mockSubmission,
      isError: false,
    } as any);
    mockedUseGetCourseQuery.mockReturnValue({ isLoading: false, data: undefined } as any);
    mockedUseCourseRole.mockReturnValue('student');
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

  test('hides SubmissionPanel and PrivateCommentView for teachers', () => {
    mockedUseCourseRole.mockReturnValue('teacher');
    renderAssignmentPage();

    expect(screen.queryByTestId('SubmissionPanel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('PrivateCommentView')).not.toBeInTheDocument();
  });

  test('shows SubmissionPanel and PrivateCommentView for students', () => {
    mockedUseCourseRole.mockReturnValue('student');
    renderAssignmentPage();

    expect(screen.getByTestId('SubmissionPanel')).toBeInTheDocument();
    expect(screen.getByTestId('PrivateCommentView')).toBeInTheDocument();
  });
});
