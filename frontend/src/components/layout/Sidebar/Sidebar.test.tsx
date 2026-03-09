import { render, screen } from '@testing-library/react';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { Sidebar } from './Sidebar';

vi.mock('./SidebarContext', () => ({
  useSidebar: vi.fn(),
}));

vi.mock('services/api/api-client/CourseQuery', () => ({
  useGetMyCoursesQuery: vi.fn(),
}));

vi.mock('./SidebarExpandableDropdown/SidebarExpandableDropdown', () => ({
  SidebarExpandableDropdown: ({
    title,
    isExpandedHorizontally,
    children,
  }: {
    title: string;
    isExpandedHorizontally: boolean;
    children?: ReactNode;
    [key: string]: unknown;
  }) =>
    isExpandedHorizontally ? (
      <>
        <span>{title}</span>
        {children}
      </>
    ) : null,
}));

vi.mock('./CourseListItemInSidebar/CourseListItemInSidebar', () => ({
  CourseListItemInSidebar: ({ course }: { course: CourseListItemDto }) => (
    <span>{course.title}</span>
  ),
}));

vi.mock('./SidebarExpandableButton/SidebarExpandableButton', () => ({
  SidebarExpandableButton: ({
    title,
    isExpanded,
  }: {
    title: string;
    isExpanded: boolean;
    [key: string]: unknown;
  }) => (isExpanded ? <span>{title}</span> : null),
}));

import { useSidebar } from './SidebarContext';
import { useGetMyCoursesQuery } from 'services/api/api-client/CourseQuery';
import { CourseListItemDto } from 'services/api/api-client.types';

const mockedUseSidebar = vi.mocked(useSidebar);
const mockedUseGetMyCoursesQuery = vi.mocked(useGetMyCoursesQuery);

const emptyCoursesResult = {
  data: { data: [], totalCount: 0 },
  isLoading: false,
  isError: false,
} as any;

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseGetMyCoursesQuery.mockReturnValue(emptyCoursesResult);
  });

  // --- Expanded ---

  test('shows both dropdown titles when expanded', () => {
    mockedUseSidebar.mockReturnValue({ isExpanded: true, toggle: vi.fn() });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(
      screen.getByText('Курсы, на которых я обучаюсь'),
    ).toBeInTheDocument();
    expect(screen.getByText('Курсы, которые я преподаю')).toBeInTheDocument();
  });

  test('shows the button title when expanded', () => {
    mockedUseSidebar.mockReturnValue({ isExpanded: true, toggle: vi.fn() });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('Главная страница')).toBeInTheDocument();
  });

  // --- Collapsed ---

  test('hides both dropdown titles when collapsed', () => {
    mockedUseSidebar.mockReturnValue({ isExpanded: false, toggle: vi.fn() });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(
      screen.queryByText('Курсы, на которых я обучаюсь'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Курсы, которые я преподаю'),
    ).not.toBeInTheDocument();
  });

  test('hides the button title when collapsed', () => {
    mockedUseSidebar.mockReturnValue({ isExpanded: false, toggle: vi.fn() });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Главная страница')).not.toBeInTheDocument();
  });

  // --- Course items ---

  test('shows studying course items when expanded', () => {
    mockedUseSidebar.mockReturnValue({ isExpanded: true, toggle: vi.fn() });
    mockedUseGetMyCoursesQuery.mockReturnValueOnce({
      data: {
        data: [
          {
            id: 1,
            title: 'Математика',
            description: '',
            createdAt: new Date(),
          },
          { id: 2, title: 'Физика', description: '', createdAt: new Date() },
        ],
        totalCount: 2,
      },
      isLoading: false,
      isError: false,
    } as any);

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('Математика')).toBeInTheDocument();
    expect(screen.getByText('Физика')).toBeInTheDocument();
  });

  test('shows teaching course items when expanded', () => {
    mockedUseSidebar.mockReturnValue({ isExpanded: true, toggle: vi.fn() });
    mockedUseGetMyCoursesQuery
      .mockReturnValueOnce(emptyCoursesResult)
      .mockReturnValueOnce({
        data: {
          data: [
            { id: 3, title: 'Химия', description: '', createdAt: new Date() },
          ],
          totalCount: 1,
        },
        isLoading: false,
        isError: false,
      } as any);

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('Химия')).toBeInTheDocument();
  });

  test('hides course items when collapsed', () => {
    mockedUseSidebar.mockReturnValue({ isExpanded: false, toggle: vi.fn() });
    mockedUseGetMyCoursesQuery.mockReturnValue({
      data: {
        data: [
          {
            id: 1,
            title: 'Математика',
            description: '',
            createdAt: new Date(),
          },
        ],
        totalCount: 1,
      },
      isLoading: false,
      isError: false,
    } as any);

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Математика')).not.toBeInTheDocument();
  });
});
