import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { CoursesPage } from './CoursesPage.tsx';

vi.mock('lottie-web', () => ({
  default: { loadAnimation: vi.fn(() => ({ destroy: vi.fn() })) },
}));

vi.mock('./CoursesList/CoursesList', () => ({
  CoursesList: vi.fn(({ title, whereImStudent, whereImTeacher, createdByMe }) => (
    <div
      data-test-id="CoursesList"
      data-title={title ?? ''}
      data-where-im-student={String(whereImStudent ?? '')}
      data-where-im-teacher={String(whereImTeacher ?? '')}
      data-created-by-me={String(createdByMe ?? '')}
    />
  )),
}));

import { CoursesList } from './CoursesList/CoursesList';

const mockedCoursesList = vi.mocked(CoursesList);

function renderCoursesPage() {
  return render(
    <MemoryRouter>
      <CoursesPage />
    </MemoryRouter>,
  );
}

describe('CoursesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  test('renders page title', () => {
    renderCoursesPage();

    expect(screen.getByTestId('CoursesPage-title')).toBeInTheDocument();
  });

  test('renders search input', () => {
    renderCoursesPage();

    expect(screen.getByTestId('CoursesPage-search')).toBeInTheDocument();
  });

  test('renders CoursesList', () => {
    renderCoursesPage();

    expect(screen.getByTestId('CoursesList')).toBeInTheDocument();
  });

  test('renders filter tabs', () => {
    renderCoursesPage();

    expect(screen.getByTestId('CoursesPage-tabs')).toBeInTheDocument();
  });

  // --- Search ---

  test('passes typed search value as title to CoursesList', async () => {
    const user = userEvent.setup();
    renderCoursesPage();

    await user.type(
      screen.getByTestId('CoursesPage-search').querySelector('input')!,
      'Алгоритмы',
    );

    await waitFor(() => {
      expect(mockedCoursesList).toHaveBeenLastCalledWith(
        expect.objectContaining({ title: 'Алгоритмы' }),
        expect.objectContaining({}),
      );
    });
  });

  test('clears title when search is cleared', async () => {
    const user = userEvent.setup();
    renderCoursesPage();

    const input = screen.getByTestId('CoursesPage-search').querySelector('input')!;
    await user.type(input, 'Алгоритмы');
    await user.clear(input);

    await waitFor(() => {
      expect(mockedCoursesList).toHaveBeenLastCalledWith(
        expect.objectContaining({ title: undefined }),
        expect.objectContaining({}),
      );
    });
  });

  // --- Tabs ---

  test('passes no filter params when "Все" tab is active by default', () => {
    renderCoursesPage();

    expect(mockedCoursesList).toHaveBeenCalledWith(
      expect.objectContaining({
        whereImStudent: undefined,
        whereImTeacher: undefined,
        createdByMe: undefined,
      }),
      expect.objectContaining({}),
    );
  });

  test('passes whereImStudent=true when "Я студент" tab is clicked', async () => {
    const user = userEvent.setup();
    renderCoursesPage();

    await user.click(screen.getByTestId('CoursesPage-tab-student'));

    await waitFor(() => {
      expect(mockedCoursesList).toHaveBeenLastCalledWith(
        expect.objectContaining({ whereImStudent: true }),
        expect.objectContaining({}),
      );
    });
  });

  test('passes whereImTeacher=true when "Я преподаватель" tab is clicked', async () => {
    const user = userEvent.setup();
    renderCoursesPage();

    await user.click(screen.getByTestId('CoursesPage-tab-teacher'));

    await waitFor(() => {
      expect(mockedCoursesList).toHaveBeenLastCalledWith(
        expect.objectContaining({ whereImTeacher: true }),
        expect.objectContaining({}),
      );
    });
  });

  test('passes createdByMe=true when "Созданные мной" tab is clicked', async () => {
    const user = userEvent.setup();
    renderCoursesPage();

    await user.click(screen.getByTestId('CoursesPage-tab-created'));

    await waitFor(() => {
      expect(mockedCoursesList).toHaveBeenLastCalledWith(
        expect.objectContaining({ createdByMe: true }),
        expect.objectContaining({}),
      );
    });
  });

  test('resets filter when "Все" tab is clicked after another tab', async () => {
    const user = userEvent.setup();
    renderCoursesPage();

    await user.click(screen.getByTestId('CoursesPage-tab-student'));
    await user.click(screen.getByTestId('CoursesPage-tab-all'));

    await waitFor(() => {
      expect(mockedCoursesList).toHaveBeenLastCalledWith(
        expect.objectContaining({
          whereImStudent: undefined,
          whereImTeacher: undefined,
          createdByMe: undefined,
        }),
        expect.objectContaining({}),
      );
    });
  });
});
