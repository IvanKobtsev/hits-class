import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAddCommentToAssignmentMutation } from 'services/api/api-client/CommentQuery';
import { getMySubmissionQueryKey } from 'services/api/api-client/SubmissionQuery';
import { LexicalViewer } from 'components/lexical/LexicalViewer';
import type { CommentDto } from 'services/api/api-client.types';
import styles from './PrivateCommentView.module.scss';
import { wrapInLexical } from '../StudentSubmissionsTab/StudentSubmissionsTab';

interface Props {
  assignmentId: number;
  comments: CommentDto[];
}

export const PrivateCommentView = ({ assignmentId, comments }: Props) => {
  const [text, setText] = useState('');
  const queryClient = useQueryClient();
  const { mutate } = useAddCommentToAssignmentMutation(assignmentId);

  const handleSubmit = () => {
    mutate(
      { content: wrapInLexical(text) },
      {
        onSuccess: () => {
          setText('');
          void queryClient.invalidateQueries({
            queryKey: getMySubmissionQueryKey(assignmentId),
          });
        },
      },
    );
  };

  return (
    <div data-test-id="PrivateCommentView" className={styles.panel}>
      <div className={styles.header}>Комментарии к работе</div>
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
        <textarea
          className={styles.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Комментарий"
          placeholder="Написать комментарий..."
          rows={1}
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
