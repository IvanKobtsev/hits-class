import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { OneCoursePage } from './OneCoursePage.tsx';
import { CourseDto, PublicationDto } from 'services/api/api-client';

vi.mock('lottie-web', () => ({
  default: { loadAnimation: vi.fn(() => ({ destroy: vi.fn() })) },
}));

vi.mock('./CourseHeader/Courseheader', () => ({
  CourseHeader: vi.fn(({ course, role }) => (
    <div
      data-test-id="CourseHeader"
      data-role={role}
      data-title={course.title}
    />
  )),
}));

vi.mock('./CourseFeedTab/CourseFeedTab', () => ({
  CourseFeedTab: vi.fn(({ publications, role }) => (
    <div
      data-test-id="CourseFeedTab"
      data-role={role}
      data-count={publications.length}
    />
  )),
}));

vi.mock('./CourseFeedTab/CreateAnnouncementModal/CreateAnnouncementModal', () => ({
  CreateAnnouncementModal: vi.fn(() => null),
}));

vi.mock('./CourseFeedTab/CreateAssignmentModal/CreateAssignmentModal', () => ({
  CreateAssignmentModal: vi.fn(() => null),
}));

vi.mock('./useCourseRole', () => ({
  useCourseRole: vi.fn(() => 'student'),
}));

vi.mock('services/api/api-client/CourseClient', () => ({
  exportMarks: vi.fn(),
}));

vi.mock('services/api', () => ({
  QueryFactory: {
    CourseQuery: {
      useGetCourseQuery: vi.fn(),
    },
    PublicationsQuery: {
      useGetPublicationsQuery: vi.fn(),
    },
    UserQuery: {
      useGetCurrentUserInfoQuery: vi.fn(() => ({ data: null })),
    },
  },
}));

import { QueryFactory } from 'services/api';
import { useCourseRole } from './useCourseRole';
import { exportMarks } from 'services/api/api-client/CourseClient';

const mockedGetCourse = vi.mocked(QueryFactory.CourseQuery.useGetCourseQuery);
const mockedGetPublications = vi.mocked(
  QueryFactory.PublicationsQuery.useGetPublicationsQuery,
);
const mockedUseCourseRole = vi.mocked(useCourseRole);
const mockedExportMarks = vi.mocked(exportMarks);

const mockCourse: CourseDto = {
  id: 1,
  createdAt: new Date(),
  title: 'Web-разработка',
  description: 'React и современный фронтенд',
  inviteCode: 'WEB-DEV-2026',
  owner: {
    id: 'u1',
    email: 'o@test.com',
    legalName: 'Козлов Д.А.',
    groupNumber: null,
  },
  teachers: [
    {
      id: 'u1',
      email: 'o@test.com',
      legalName: 'Козлов Д.А.',
      groupNumber: null,
    },
  ],
};

const mockPublication: PublicationDto = {
  id: 1,
  createdAtUTC: new Date(),
  lastUpdatedAtUTC: null,
  content: 'Текст',
  author: {
    id: 'u1',
    email: 'a@a.com',
    legalName: 'Иванов',
    groupNumber: null,
  },
  attachments: [],
  type: 'Announcement' as any,
  publicationPayload: { publicationType: 'Announcement' } as any,
};

function renderPage(courseId = '1') {
  return render(
    <MemoryRouter initialEntries={[`/courses/${courseId}`]}>
      <Routes>
        <Route path="/courses/:courseId" element={<OneCoursePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('OneCoursePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetCourse.mockReturnValue({
      data: mockCourse,
      isLoading: false,
    } as any);
    mockedGetPublications.mockReturnValue({
      data: { data: [mockPublication], totalCount: 1 },
      isLoading: false,
    } as any);
    mockedUseCourseRole.mockReturnValue('student');
  });

  // --- Rendering ---

  test('renders CourseHeader with course data', () => {
    renderPage();
    expect(screen.getByTestId('CourseHeader')).toHaveAttribute(
      'data-title',
      'Web-разработка',
    );
  });

  test('renders tabs', () => {
    renderPage();
    expect(screen.getByTestId('OneCoursePage-tabs')).toBeInTheDocument();
  });

  test('renders feed tab by default', () => {
    renderPage();
    expect(screen.getByTestId('CourseFeedTab')).toBeInTheDocument();
  });

  // --- Loading ---

  test('shows loading when course is loading', () => {
    mockedGetCourse.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);
    renderPage();
    expect(screen.queryByTestId('CourseHeader')).not.toBeInTheDocument();
  });

  test('passes empty array to CourseFeedTab when publications are loading', () => {
    mockedGetPublications.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);
    renderPage();
    expect(screen.getByTestId('CourseFeedTab')).toHaveAttribute(
      'data-count',
      '0',
    );
  });
  // --- Role ---

  test('passes teacher role to CourseHeader', () => {
    mockedUseCourseRole.mockReturnValue('teacher');
    renderPage();
    expect(screen.getByTestId('CourseHeader')).toHaveAttribute(
      'data-role',
      'teacher',
    );
  });

  test('passes student role to CourseFeedTab', () => {
    mockedUseCourseRole.mockReturnValue('student');
    renderPage();
    expect(screen.getByTestId('CourseFeedTab')).toHaveAttribute(
      'data-role',
      'student',
    );
  });

  // --- Publications ---

  test('passes publications to CourseFeedTab', () => {
    renderPage();
    expect(screen.getByTestId('CourseFeedTab')).toHaveAttribute(
      'data-count',
      '1',
    );
  });

  test('passes empty array to CourseFeedTab when no publications data', () => {
    mockedGetPublications.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);
    renderPage();
    expect(screen.getByTestId('CourseFeedTab')).toHaveAttribute(
      'data-count',
      '0',
    );
  });

  // --- Tabs ---

  test('renders grades tab content when grades tab is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('OneCoursePage-tab-grades'));
    expect(screen.getByTestId('OneCoursePage-grades')).toBeInTheDocument();
    expect(screen.queryByTestId('CourseFeedTab')).not.toBeInTheDocument();
  });

  test('renders members tab content when members tab is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('OneCoursePage-tab-members'));
    expect(screen.getByTestId('OneCoursePage-members')).toBeInTheDocument();
  });

  test('returns to feed tab when feed tab is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('OneCoursePage-tab-grades'));
    await user.click(screen.getByTestId('OneCoursePage-tab-feed'));
    expect(screen.getByTestId('CourseFeedTab')).toBeInTheDocument();
  });

  // --- Export marks button ---

  test('shows export button for teacher in grades tab', async () => {
    mockedUseCourseRole.mockReturnValue('teacher');
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('OneCoursePage-tab-grades'));
    expect(screen.getByRole('button', { name: 'Экспорт оценок' })).toBeInTheDocument();
  });

  test('does not show export button for student in grades tab', async () => {
    mockedUseCourseRole.mockReturnValue('student');
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('OneCoursePage-tab-grades'));
    expect(screen.queryByRole('button', { name: 'Экспорт оценок' })).not.toBeInTheDocument();
  });

  test('calls exportMarks and triggers download on button click', async () => {
    mockedUseCourseRole.mockReturnValue('teacher');
    const blob = new Blob(['csv'], { type: 'text/csv' });
    mockedExportMarks.mockResolvedValue({ data: blob, fileName: 'Оценки Test.csv', status: 200, headers: {} });

    const createObjectURL = vi.fn(() => 'blob:url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByTestId('OneCoursePage-tab-grades'));
    await user.click(screen.getByRole('button', { name: 'Экспорт оценок' }));

    expect(mockedExportMarks).toHaveBeenCalledWith(1);
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:url');

    clickSpy.mockRestore();
  });
});
