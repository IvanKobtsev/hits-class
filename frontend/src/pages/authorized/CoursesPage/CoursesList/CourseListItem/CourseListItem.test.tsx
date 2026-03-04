import { render, screen } from '@testing-library/react';
import { vi, test, expect, describe } from 'vitest';
import { MemoryRouter } from 'react-router';
import { CourseListItem } from './CourseListItem.tsx';

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual };
});

const mockCourse = {
  id: 1,
  createdAt: '2024-03-15T10:00:00Z',
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

    expect(screen.getByTestId('CourseListItem-title')).toHaveTextContent(
      'Введение в программирование',
    );
  });

  test('renders course description', () => {
    renderCourseListItem();

    expect(screen.getByTestId('CourseListItem-description')).toHaveTextContent(
      'Базовый курс по основам программирования',
    );
  });

  test('renders formatted creation date', () => {
    renderCourseListItem();

    const dateEl = screen.getByTestId('CourseListItem-date');
    expect(dateEl).toBeInTheDocument();
    expect(dateEl.textContent).not.toBe('2024-03-15T10:00:00Z');
    expect(dateEl.textContent?.trim()).not.toBe('');
  });

  test('renders a link to the course page', () => {
    renderCourseListItem();

    expect(screen.getByRole('link')).toHaveAttribute('href', '/courses/1');
  });

  // --- Edge cases ---

  test('renders without crashing when description is empty string', () => {
    renderCourseListItem({ ...mockCourse, description: '' });

    expect(
      screen.getByTestId('CourseListItem-description'),
    ).toBeInTheDocument();
  });

  test('marks long description for line clamping', () => {
    renderCourseListItem({ ...mockCourse, description: 'A'.repeat(300) });

    expect(screen.getByTestId('CourseListItem-description')).toHaveAttribute(
      'data-clamp',
      'true',
    );
  });

  test('renders without crashing when createdAt is invalid', () => {
    renderCourseListItem({ ...mockCourse, createdAt: '' });

    expect(screen.getByTestId('CourseListItem-date')).toBeInTheDocument();
  });
});
