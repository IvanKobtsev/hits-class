import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { TargetStudents } from './TargetStudents';

const mockCourseData = {
  id: 42,
  title: 'Курс',
  description: '',
  inviteCode: 'abc',
  createdAt: new Date(),
  owner: {
    id: 'owner-1',
    email: 'owner@test.com',
    legalName: 'Директор',
    groupNumber: null,
  },
  teachers: [],
  students: [
    {
      id: 'student-1',
      email: 's1@test.com',
      legalName: 'Студент Альфа',
      groupNumber: 'А-101',
      roles: [],
    },
    {
      id: 'student-2',
      email: 's2@test.com',
      legalName: 'Студент Бета',
      groupNumber: 'Б-202',
      roles: [],
    },
    {
      id: 'student-3',
      email: 's3@test.com',
      legalName: 'Студент Гамма',
      groupNumber: 'А-101',
      roles: [],
    },
  ],
};

vi.mock('services/api/api-client/CourseQuery', () => ({
  useGetCourseQuery: () => ({
    data: mockCourseData,
    isLoading: false,
  }),
}));

vi.mock('components/uikit/suspense/Loading', () => ({
  Loading: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./StudentToBeTargeted/StudentToBeTargeted', () => ({
  StudentToBeTargeted: ({
    user,
    checked,
    onChange,
  }: {
    user: { id: string; legalName: string };
    checked: boolean;
    onChange: () => void;
  }) => (
    <div
      data-test-id={`student-row-${user.id}`}
      data-checked={checked}
      onClick={onChange}
    >
      {user.legalName}
    </div>
  ),
}));

describe('TargetStudents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders students grouped by group', () => {
    const onSelectionChange = vi.fn();
    render(
      <TargetStudents
        courseId={42}
        selectedIds={new Set(['student-1', 'student-2', 'student-3'])}
        onSelectionChange={onSelectionChange}
      />,
    );

    expect(screen.getByText('Студент Альфа')).toBeInTheDocument();
    expect(screen.getByText('Студент Бета')).toBeInTheDocument();
    expect(screen.getByText('Студент Гамма')).toBeInTheDocument();
  });

  test('renders select-all checkbox', () => {
    const onSelectionChange = vi.fn();
    render(
      <TargetStudents
        courseId={42}
        selectedIds={new Set()}
        onSelectionChange={onSelectionChange}
      />,
    );

    expect(
      screen.getByTestId('target-students-select-all'),
    ).toBeInTheDocument();
    expect(screen.getByText('Выбрать всех')).toBeInTheDocument();
  });

  test('select-all selects all when clicked and none selected', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <TargetStudents
        courseId={42}
        selectedIds={new Set()}
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getByTestId('target-students-select-all'));

    expect(onSelectionChange).toHaveBeenCalledWith(
      new Set(['student-1', 'student-2', 'student-3']),
    );
  });

  test('select-all deselects all when clicked and all selected', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <TargetStudents
        courseId={42}
        selectedIds={new Set(['student-1', 'student-2', 'student-3'])}
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getByTestId('target-students-select-all'));

    expect(onSelectionChange).toHaveBeenCalledWith(new Set());
  });

  test('group checkbox toggles group selection', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <TargetStudents
        courseId={42}
        selectedIds={new Set(['student-2'])}
        onSelectionChange={onSelectionChange}
      />,
    );

    const groupCheckbox = screen.getByTestId('target-students-group-checkbox-А-101');
    await user.click(groupCheckbox);

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalled();
      const callArg = onSelectionChange.mock.calls[0][0] as Set<string>;
      expect(callArg.has('student-1')).toBe(true);
      expect(callArg.has('student-3')).toBe(true);
    });
  });

  test('renders group headers', () => {
    const onSelectionChange = vi.fn();
    render(
      <TargetStudents
        courseId={42}
        selectedIds={new Set()}
        onSelectionChange={onSelectionChange}
      />,
    );

    expect(screen.getByText('А-101')).toBeInTheDocument();
    expect(screen.getByText('Б-202')).toBeInTheDocument();
  });
});
