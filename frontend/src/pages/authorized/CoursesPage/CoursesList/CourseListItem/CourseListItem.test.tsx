import { render, screen } from '@testing-library/react';
import { CourseListItem } from './CourseListItem.tsx';
import { vi, test, expect, describe } from 'vitest';
import { MemoryRouter } from 'react-router';

// Если карточка кликабельна и ведёт на страницу курса
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

    // Дата должна быть отформатирована в читаемый вид, не ISO-строка
    const dateEl = screen.getByTestId('CourseListItem-date');
    expect(dateEl).toBeInTheDocument();
    expect(dateEl.textContent).not.toBe('2024-03-15T10:00:00Z');
  });

  test('renders a link to the course page', () => {
    renderCourseListItem();

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/courses/${mockCourse.id}`);
  });

  // --- Props variations ---

  test('renders different title when different prop is passed', () => {
    renderCourseListItem({ ...mockCourse, title: 'Алгоритмы и структуры данных' });

    expect(screen.getByTestId('CourseListItem-title')).toHaveTextContent(
      'Алгоритмы и структуры данных',
    );
  });

  test('renders different description when different prop is passed', () => {
    renderCourseListItem({
      ...mockCourse,
      description: 'Продвинутый курс по алгоритмам',
    });

    expect(screen.getByTestId('CourseListItem-description')).toHaveTextContent(
      'Продвинутый курс по алгоритмам',
    );
  });

  // --- Edge cases ---

  test('renders without crashing when description is empty string', () => {
    renderCourseListItem({ ...mockCourse, description: '' });

    expect(screen.getByTestId('CourseListItem-description')).toBeInTheDocument();
  });

  test('truncates long description visually (has css class for truncation)', () => {
    const longDescription = 'A'.repeat(300);
    renderCourseListItem({ ...mockCourse, description: longDescription });

    const descEl = screen.getByTestId('CourseListItem-description');
    // Компонент должен применять класс/атрибут для визуального ограничения текста
    expect(descEl.className).toMatch(/truncate|clamp|ellipsis/i);
  });
});
