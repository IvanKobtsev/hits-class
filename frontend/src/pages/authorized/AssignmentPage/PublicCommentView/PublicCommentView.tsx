import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetPublicationCommentsQuery,
  useAddCommentToPublicationMutation,
  getPublicationCommentsQueryKey,
} from 'services/api/api-client/CommentQuery';
import { LexicalViewer } from 'components/lexical/LexicalViewer';
import type { CommentDto } from 'services/api/api-client.types';
import styles from './PublicCommentView.module.scss';

interface Props {
  publicationId: number;
}

function wrapInLexical(text: string): string {
  return JSON.stringify({
    root: {
      children: [
        {
          children: [
            { detail: 0, format: 0, mode: 'normal', style: '', text, type: 'text', version: 1 },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  });
}

export const PublicCommentView = ({ publicationId }: Props) => {
  const [text, setText] = useState('');
  const queryClient = useQueryClient();
  // The generated types are stale (PagedResultOfCommentDto); the API returns CommentDto[]
  const { data } = useGetPublicationCommentsQuery(publicationId);
  const comments = (data as unknown as CommentDto[] | undefined) ?? [];
  const { mutate } = useAddCommentToPublicationMutation(publicationId);

  const handleSubmit = () => {
    mutate(
      { textLexical: wrapInLexical(text) },
      {
        onSuccess: () => {
          setText('');
          void queryClient.invalidateQueries({
            queryKey: getPublicationCommentsQueryKey(publicationId),
          });
        },
      },
    );
  };

  return (
    <div data-test-id="PublicCommentView" className={styles.panel}>
      <div className={styles.header}>Комментарии</div>
      <div className={styles.commentList}>
        {comments.map((comment) => (
          <div key={comment.id} className={styles.comment}>
            <div className={styles.commentMeta}>
              <span className={styles.commentAuthor}>{comment.author.legalName}</span>
              <span className={styles.commentDate}>{comment.createdAt.toLocaleDateString()}</span>
            </div>
            <div className={styles.commentText}>
              <LexicalViewer lexicalState={comment.textLexical} />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.inputArea}>
        <textarea
          className={styles.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Комментарий"
          placeholder="Написать комментарий..."
          rows={1}
        />
        <button className={styles.sendButton} onClick={handleSubmit} disabled={!text.trim()}>
          Отправить
        </button>
      </div>
    </div>
  );
};
