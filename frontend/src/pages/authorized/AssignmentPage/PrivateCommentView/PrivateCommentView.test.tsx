import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { PrivateCommentView } from './PrivateCommentView';
import type { CommentDto } from 'services/api/api-client.types';
import { wrapInLexical } from '../StudentSubmissionsTab/StudentSubmissionsTab.tsx';

const mockMutate = vi.fn();

vi.mock('services/api/api-client/CommentQuery', () => ({
  useAddCommentToAssignmentMutation: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

vi.mock('services/api/api-client/SubmissionQuery', () => ({
  getMySubmissionQueryKey: (id: number) => [
    'SubmissionClient',
    'getMySubmission',
    id,
  ],
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

vi.mock('components/lexical/LexicalViewer', () => ({
  LexicalViewer: ({ lexicalState }: { lexicalState: string }) => (
    <div data-test-id="lexical-viewer">{lexicalState}</div>
  ),
}));

const makeComment = (
  id: number,
  text: string,
  authorName: string,
): CommentDto => ({
  id,
  content: wrapInLexical(text),
  createdAt: new Date('2025-03-01T10:00:00Z'),
  lastEditedAt: null,
  author: {
    id: `author-${id}`,
    legalName: authorName,
    email: `user${id}@test.com`,
    groupNumber: null,
  },
});

describe('PrivateCommentView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders with PrivateCommentView test id', () => {
    render(<PrivateCommentView assignmentId={1} comments={[]} />);

    expect(screen.getByTestId('PrivateCommentView')).toBeInTheDocument();
  });

  test('renders empty state when no comments', () => {
    render(<PrivateCommentView assignmentId={1} comments={[]} />);

    expect(screen.queryAllByTestId('lexical-viewer')).toHaveLength(0);
  });

  test('renders comment author name and text for each comment', () => {
    const comments = [
      makeComment(1, 'Hello world', 'Alice'),
      makeComment(2, 'How are you', 'Bob'),
    ];
    render(<PrivateCommentView assignmentId={1} comments={comments} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getAllByTestId('lexical-viewer')).toHaveLength(2);
  });

  test('shows comment input textarea', () => {
    render(<PrivateCommentView assignmentId={1} comments={[]} />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('submit button is disabled when input is empty', () => {
    render(<PrivateCommentView assignmentId={1} comments={[]} />);

    expect(screen.getByRole('button', { name: /отправить/i })).toBeDisabled();
  });

  test('clicking submit calls mutation with correct payload', async () => {
    const user = userEvent.setup();
    render(<PrivateCommentView assignmentId={42} comments={[]} />);

    await user.type(screen.getByRole('textbox'), 'My comment');
    await user.click(screen.getByRole('button', { name: /отправить/i }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        textLexical: expect.stringContaining('My comment'),
      }),
      expect.any(Object),
    );
  });
});
