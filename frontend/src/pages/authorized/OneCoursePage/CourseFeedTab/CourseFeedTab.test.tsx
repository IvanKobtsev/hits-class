import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { CourseFeedTab } from './CourseFeedTab.tsx';
import { PublicationDto } from 'services/api/api-client';

vi.mock('assets/icons/announcement.svg?react', () => ({ default: () => <svg /> }));
vi.mock('assets/icons/assignment.svg?react', () => ({ default: () => <svg /> }));
vi.mock('lottie-web', () => ({
  default: { loadAnimation: vi.fn(() => ({ destroy: vi.fn() })) },
}));

vi.mock('../PublicatonsList/PublicationList', () => ({
  PublicationList: vi.fn(({ publications }) => (
    <div data-test-id="PublicationList" data-count={publications.length} />
  )),
}));

const mockPublication: PublicationDto = {
  id: 1,
  createdAtUTC: new Date(),
  lastUpdatedAtUTC: null,
  content: 'Текст',
  author: { id: 'u1', email: 'a@a.com', legalName: 'Иванов', groupNumber: null },
  attachments: [],
  type: 'Announcement' as any,
  publicationPayload: { publicationType: 'Announcement' } as any,
};

const baseProps = {
  courseId: 1,
  publications: [],
  onCreateAssignment: vi.fn(),
  onCreateAnnouncement: vi.fn(),
};

function renderTab(role: 'teacher' | 'student', publications: PublicationDto[] = []) {
  return render(
    <MemoryRouter>
      <CourseFeedTab {...baseProps} role={role} publications={publications} />
    </MemoryRouter>,
  );
}

describe('CourseFeedTab', () => {
  beforeEach(() => vi.clearAllMocks());

  // --- Rendering ---

  test('renders PublicationList', () => {
    renderTab('student');
    expect(screen.getByTestId('PublicationList')).toBeInTheDocument();
  });

  test('passes publications to PublicationList', () => {
    renderTab('student', [mockPublication]);
    expect(screen.getByTestId('PublicationList')).toHaveAttribute('data-count', '1');
  });

  // --- Role: student ---

  test('shows actions for student', () => {
    renderTab('student');
    expect(screen.queryByTestId('CourseFeedTab-actions')).toBeInTheDocument();
  });

  test('does not show create assignment button for student', () => {
    renderTab('student');
    expect(screen.queryByTestId('CourseFeedTab-create-assignment')).not.toBeInTheDocument();
  });

  test('shows create announcement button for student', () => {
    renderTab('student');
    expect(screen.queryByTestId('CourseFeedTab-create-announcement')).toBeInTheDocument();
  });

  // --- Role: teacher ---

  test('shows actions block for teacher', () => {
    renderTab('teacher');
    expect(screen.getByTestId('CourseFeedTab-actions')).toBeInTheDocument();
  });

  test('shows create assignment button for teacher', () => {
    renderTab('teacher');
    expect(screen.getByTestId('CourseFeedTab-create-assignment')).toBeInTheDocument();
  });

  test('shows create announcement button for teacher', () => {
    renderTab('teacher');
    expect(screen.getByTestId('CourseFeedTab-create-announcement')).toBeInTheDocument();
  });

  // --- Callbacks ---

  test('calls onCreateAssignment when button is clicked', async () => {
    const user = userEvent.setup();
    renderTab('teacher');
    await user.click(screen.getByTestId('CourseFeedTab-create-assignment'));
    expect(baseProps.onCreateAssignment).toHaveBeenCalledTimes(1);
  });

  test('calls onCreateAnnouncement when button is clicked', async () => {
    const user = userEvent.setup();
    renderTab('teacher');
    await user.click(screen.getByTestId('CourseFeedTab-create-announcement'));
    expect(baseProps.onCreateAnnouncement).toHaveBeenCalledTimes(1);
  });
});
