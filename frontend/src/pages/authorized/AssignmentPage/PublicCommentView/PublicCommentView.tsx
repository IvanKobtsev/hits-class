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
import { wrapInLexical } from '../StudentSubmissionsTab/StudentSubmissionsTab';
import { LexicalTextArea } from '../../../../components/lexical/text-area/LexicalTextArea.tsx';

interface Props {
  publicationId: number;
}

export const PublicCommentView = ({ publicationId }: Props) => {
  const [text, setText] = useState('');
  const queryClient = useQueryClient();
  // The generated types are stale (PagedResultOfCommentDto); the API returns CommentDto[]
  const { data } = useGetPublicationCommentsQuery(publicationId);
  const comments = (data as unknown as CommentDto[] | undefined) ?? [];
  const { mutate } = useAddCommentToPublicationMutation(publicationId);
  // Pls don't ask.
  const [updater, setUpdater] = useState(0);

  const handleSubmit = () => {
    mutate(
      { content: { json: text } },
      {
        onSuccess: () => {
          setText('');
          setUpdater((p) => p + 1);
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
              <span className={styles.commentAuthor}>
                {comment.author.legalName}
              </span>
              <span className={styles.commentDate}>
                {comment.createdAt.toLocaleDateString()}
              </span>
            </div>
            <div className={styles.commentText}>
              <LexicalViewer lexicalState={comment.content} />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.inputArea}>
        <LexicalTextArea
          className={styles.textarea}
          editorClassName={styles.textareaEditor}
          onChange={(state) => setText(state)}
          placeholder={'Написать комментарий...'}
          defaultValue={wrapInLexical('').json}
          updater={updater}
        />
        <button
          className={styles.sendButton}
          onClick={handleSubmit}
          disabled={!text.trim()}
        >
          Отправить
        </button>
      </div>
    </div>
  );
};
