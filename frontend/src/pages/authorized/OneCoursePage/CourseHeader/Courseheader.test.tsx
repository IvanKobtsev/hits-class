import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe } from 'vitest';
import { CourseDto } from 'services/api/api-client';
import { CourseHeader } from './Courseheader';

vi.mock('../../../../components/lexical/icons/copy.svg?react', () => ({
  default: () => <svg data-test-id="copy-icon" />,
}));

vi.mock('components/functionality-parts/DelAndEditCourseButtons/DelAndEditCourseButtons', () => ({
  DelAndEditCourseButtons: vi.fn(({ courseId }) => (
    <div data-test-id={`mock-edit-buttons-${courseId}`}>
      Mock Edit Buttons
    </div>
  )),
}));

const mockCourse: CourseDto = {
  id: 1,
  createdAt: new Date('2024-01-01'),
  title: 'Web-разработка',
  description: 'React и современный фронтенд',
  inviteCode: 'WEB-DEV-2026',
  owner: {
    id: 'owner-1',
    email: 'owner@test.com',
    legalName: 'Козлов Д.А.',
    groupNumber: null,
    roles: null,
  },
  teachers: [
    {
      id: 'teacher-1',
      email: 'teacher@test.com',
      legalName: 'Сидоров В.В.',
      groupNumber: null,
      roles: null,
    },
  ],
  students: [],
  bannedStudents: [],
};

function renderHeader(
  role: 'teacher' | 'student' = 'student',
  course = mockCourse,
) {
  return render(<CourseHeader course={course} role={role} />);
}

describe('CourseHeader', () => {
  // --- Rendering ---

  test('renders course title', () => {
    renderHeader();
    expect(screen.getByTestId('CourseHeader-title')).toHaveTextContent(
      'Web-разработка',
    );
  });

  test('renders course description', () => {
    renderHeader();
    expect(screen.getByTestId('CourseHeader-description')).toHaveTextContent(
      'React и современный фронтенд',
    );
  });

  test('renders teacher name', () => {
    renderHeader();
    expect(screen.getByTestId('CourseHeader-teacher')).toHaveTextContent(
      'Козлов Д.А.',
    );
  });

  test('does not render description when it is empty', () => {
    renderHeader('student', { ...mockCourse, description: '' });
    expect(
      screen.queryByTestId('CourseHeader-description'),
    ).not.toBeInTheDocument();
  });

  // --- Role: student ---

  test('does not show invite code for student', () => {
    renderHeader('student');
    expect(screen.queryByTestId('CourseHeader-invite')).not.toBeInTheDocument();
  });

  test('does not show copy button for student', () => {
    renderHeader('student');
    expect(
      screen.queryByTestId('CourseHeader-copy-btn'),
    ).not.toBeInTheDocument();
  });

  // --- Role: teacher ---

  test('shows invite block for teacher', () => {
    renderHeader('teacher');
    expect(screen.getByTestId('CourseHeader-invite')).toBeInTheDocument();
  });

  test('shows invite code value for teacher', () => {
    renderHeader('teacher');
    expect(screen.getByTestId('CourseHeader-invite-code')).toHaveTextContent(
      'WEB-DEV-2026',
    );
  });

  test('shows copy button for teacher', () => {
    renderHeader('teacher');
    expect(screen.getByTestId('CourseHeader-copy-btn')).toBeInTheDocument();
  });

  // --- Copy ---

  test('calls clipboard.writeText with invite code on copy click', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderHeader('teacher');
    await user.click(screen.getByTestId('CourseHeader-copy-btn'));

    expect(writeText).toHaveBeenCalledWith('WEB-DEV-2026');
  });
});
