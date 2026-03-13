import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { PublicCommentView } from './PublicCommentView';
import type { CommentDto } from 'services/api/api-client.types';
import { wrapInLexical } from '../StudentSubmissionsTab/StudentSubmissionsTab.tsx';

const mockMutate = vi.fn();
const mockInvalidate = vi.fn();

vi.mock('services/api/api-client/CommentQuery', () => ({
  useGetPublicationCommentsQuery: (_publicationId: number) => ({
    data: mockCommentsData,
    isLoading: false,
  }),
  useAddCommentToPublicationMutation: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
  getPublicationCommentsQueryKey: (id: number) => [
    'CommentClient',
    'getPublicationComments',
    id,
  ],
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
  };
});

vi.mock('components/lexical/LexicalViewer', () => ({
  LexicalViewer: ({ lexicalState }: { lexicalState: string }) => (
    <div data-test-id="lexical-viewer">{lexicalState}</div>
  ),
}));

let mockCommentsData: CommentDto[] | undefined = undefined;

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
    roles: null,
  },
});

describe('PublicCommentView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCommentsData = undefined;
  });

  test('renders with PublicCommentView test id', () => {
    render(<PublicCommentView publicationId={1} />);

    expect(screen.getByTestId('PublicCommentView')).toBeInTheDocument();
  });

  test('renders empty state when no comments', () => {
    mockCommentsData = [];
    render(<PublicCommentView publicationId={1} />);

    expect(screen.queryAllByTestId('lexical-viewer')).toHaveLength(0);
  });

  test('renders comment list when query returns data', () => {
    mockCommentsData = [
      makeComment(1, 'First comment', 'Alice'),
      makeComment(2, 'Second comment', 'Bob'),
    ];
    render(<PublicCommentView publicationId={1} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getAllByTestId('lexical-viewer')).toHaveLength(2);
  });

  test('shows comment input textarea', () => {
    render(<PublicCommentView publicationId={1} />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('submit button is disabled when input is empty', () => {
    render(<PublicCommentView publicationId={1} />);

    expect(screen.getByRole('button', { name: /отправить/i })).toBeDisabled();
  });

  test('clicking submit calls mutation with correct payload', async () => {
    const user = userEvent.setup();
    render(<PublicCommentView publicationId={7} />);

    await user.type(screen.getByRole('textbox'), 'Public comment');
    await user.click(screen.getByRole('button', { name: /отправить/i }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        textLexical: expect.stringContaining('Public comment'),
      }),
      expect.any(Object),
    );
  });
});
