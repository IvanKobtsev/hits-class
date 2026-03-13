import { render, screen } from '@testing-library/react';
import { vi, test, expect, describe } from 'vitest';
import { MemoryRouter } from 'react-router';
import { CourseListItem } from './CourseListItem.tsx';

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual };
});

vi.mock('components/functionality-parts/DelAndEditCourseButtons/DelAndEditCourseButtons', () => ({
  DelAndEditCourseButtons: vi.fn(({ courseId }) => (
    <div data-test-id={`mock-edit-buttons-${courseId}`}>
      Mock Edit Buttons
    </div>
  )),
}));

const mockCourse = {
  id: 1,
  title: 'Введение в программирование',
  description: 'Базовый курс по основам программирования',
};

function renderCourseListItem(props = mockCourse) {
  return render(
    <MemoryRouter>
      <CourseListItem {...props} />
    </MemoryRouter>,
  );
}

describe('CourseListItem', () => {
  // --- Rendering ---

  test('renders course title', () => {
    renderCourseListItem();

    expect(screen.getByTestId('CourseListItem-title-1')).toHaveTextContent(
      'Введение в программирование',
    );
  });

  test('renders course description', () => {
    renderCourseListItem();

    expect(
      screen.getByTestId('CourseListItem-description-1'),
    ).toHaveTextContent('Базовый курс по основам программирования');
  });

  test('renders a link to the course page', () => {
    renderCourseListItem();

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/courses/${mockCourse.id}`);
  });

  // --- Edge cases ---

  test('renders without crashing when description is empty string', () => {
    renderCourseListItem({ ...mockCourse, description: '' });

    expect(
      screen.getByTestId('CourseListItem-description-1'),
    ).toBeInTheDocument();
  });

  test('adds ellipsis to long title', () => {
    renderCourseListItem({ ...mockCourse, title: 'A'.repeat(200) });

    const el = screen.getByTestId('CourseListItem-title-1');
    expect(el.className).toMatch(/shortened_title/);
  });

  test('adds ellipsis to long description', () => {
    renderCourseListItem({ ...mockCourse, description: 'A'.repeat(200) });

    const el = screen.getByTestId('CourseListItem-description-1');
    expect(el.className).toMatch(/shortened_description/);
  });


  test('renders a link to the course page', () => {
    renderCourseListItem();

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/courses/${mockCourse.id}`);
  });

  test('link href changes when different id is passed', () => {
    renderCourseListItem({ ...mockCourse, id: 42 });

    expect(screen.getByRole('link')).toHaveAttribute('href', '/courses/42');
  });
});
