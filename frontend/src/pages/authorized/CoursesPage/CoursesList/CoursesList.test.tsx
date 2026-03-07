import { render, screen, waitFor } from '@testing-library/react';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { CoursesList } from './CoursesList.tsx';

vi.mock('services/api/api-client/CourseQuery', () => ({
  useGetMyCoursesQuery: vi.fn(),
}));

vi.mock('lottie-web', () => ({
  default: { loadAnimation: vi.fn(() => ({ destroy: vi.fn() })) },
}));

import { useGetMyCoursesQuery } from 'services/api/api-client/CourseQuery.ts';

const mockedUseGetMyCoursesQuery = vi.mocked(useGetMyCoursesQuery);

const mockCourses = [
  {
    id: 1,
    createdAt: new Date('2024-03-15T10:00:00Z'),
    title: 'Введение в программирование',
    description: 'Базовый курс по основам программирования',
  },
  {
    id: 2,
    createdAt: new Date('2024-04-01T10:00:00Z'),
    title: 'Алгоритмы и структуры данных',
    description: 'Продвинутый курс',
  },
];

function renderCoursesList(params = {}) {
  return render(
    <MemoryRouter>
      <CoursesList {...params} />
    </MemoryRouter>,
  );
}

describe('CoursesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  test('shows loading indicator while fetching', () => {
    mockedUseGetMyCoursesQuery.mockReturnValueOnce({
      isLoading: true,
      data: undefined,
      isError: false,
    } as any);

    renderCoursesList();

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  test('renders list of courses after successful fetch', async () => {
    mockedUseGetMyCoursesQuery.mockReturnValueOnce({
      isLoading: false,
      data: { data: mockCourses, totalCount: 2 },
      isError: false,
    } as any);

    renderCoursesList();

    await waitFor(() => {
      expect(screen.getByTestId('CourseListItem-title-1')).toHaveTextContent(
        'Введение в программирование',
      );
      expect(screen.getByTestId('CourseListItem-title-2')).toHaveTextContent(
        'Алгоритмы и структуры данных',
      );
    });
  });

  test('renders correct number of course cards', () => {
    mockedUseGetMyCoursesQuery.mockReturnValueOnce({
      isLoading: false,
      data: { data: mockCourses, totalCount: 2 },
      isError: false,
    } as any);

    renderCoursesList();

    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  // --- Params ---

  test('passes search params to query hook', () => {
    mockedUseGetMyCoursesQuery.mockReturnValueOnce({
      isLoading: false,
      data: { data: [], totalCount: 0 },
      isError: false,
    } as any);

    renderCoursesList({ title: 'Алгоритмы', whereImStudent: true });

    expect(mockedUseGetMyCoursesQuery).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Алгоритмы', whereImStudent: true }),
    );
  });

  // --- Empty state ---

  test('shows empty state message when no courses', () => {
    mockedUseGetMyCoursesQuery.mockReturnValueOnce({
      isLoading: false,
      data: { data: [], totalCount: 0 },
      isError: false,
    } as any);

    renderCoursesList();

    expect(screen.getByTestId('CoursesList-empty')).toBeInTheDocument();
  });

  // --- Error state ---

  test('shows error message when fetch fails', () => {
    mockedUseGetMyCoursesQuery.mockReturnValueOnce({
      isLoading: false,
      data: undefined,
      isError: true,
    } as any);

    renderCoursesList();

    expect(screen.getByTestId('CoursesList-error')).toBeInTheDocument();
  });
});
