import { render, screen } from '@testing-library/react';
import { test, expect, describe } from 'vitest';
import { MemoryRouter } from 'react-router';
import { CourseListItemInSidebar } from './CourseListItemInSidebar';
import { CourseListItemDto } from 'services/api/api-client.types';

const mockCourse: CourseListItemDto = {
  id: 1,
  title: 'Introduction to Programming',
  description: 'Learn the basics of programming',
  createdAt: new Date('2024-01-01'),
};

function renderItem(course = mockCourse) {
  return render(
    <MemoryRouter>
      <CourseListItemInSidebar course={course} />
    </MemoryRouter>,
  );
}

describe('CourseListItemInSidebar', () => {
  // --- Rendering ---

  test('displays the course title', () => {
    renderItem();

    expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
  });

  // --- Navigation ---

  test('links to /courses/:id', () => {
    renderItem();

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      `/courses/${mockCourse.id}`,
    );
  });

  test('link href changes when a different id is passed', () => {
    renderItem({ ...mockCourse, id: 99 });

    expect(screen.getByRole('link')).toHaveAttribute('href', '/courses/99');
  });
});
