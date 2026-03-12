import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetSubmissionsQuery,
  useGetSubmissionQuery,
  useMarkSubmissionMutation,
  getSubmissionsQueryKey,
  getSubmissionQueryKey,
} from 'services/api/api-client/SubmissionQuery';
import { useAddCommentToSubmissionMutation } from 'services/api/api-client/CommentQuery';
import type { SubmissionListItem, SubmissionState, FileInfoDto, Attachment } from 'services/api/api-client.types';
import { AttachmentsList } from 'pages/authorized/OneCoursePage/PublicatonsList/PublicationListItem/AttachmentsList/AttachmentsList';
import { LexicalViewer } from 'components/lexical/LexicalViewer';
import styles from './StudentSubmissionsTab.module.scss';

const AVATAR_COLORS = [
  '#1a73e8', '#e8710a', '#1e8e3e', '#d93025',
  '#9334e6', '#e52592', '#00897b', '#f9ab00',
];

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function statusLabel(state: SubmissionState): string {
  switch (state) {
    case 'Submitted': return 'Сдано';
    case 'Accepted': return 'Принято';
    case 'Draft': return 'Черновик';
    default: return state;
  }
}

function statusClass(state: SubmissionState): string {
  switch (state) {
    case 'Submitted': return styles.statusSubmitted;
    case 'Accepted': return styles.statusAccepted;
    case 'Draft': return styles.statusDraft;
    default: return '';
  }
}

function wrapInLexical(text: string): string {
  return JSON.stringify({
    root: {
      children: [
        {
          children: [
            { detail: 0, format: 0, mode: 'normal', style: '', text, type: 'text', version: 1 },
          ],
          direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1,
        },
      ],
      direction: 'ltr', format: '', indent: 0, type: 'root', version: 1,
    },
  });
}

function fileInfoToAttachment(f: FileInfoDto): Attachment {
  return { uuid: f.id, fileName: f.fileName, size: f.size, createdAt: f.createdAt };
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${d.getFullYear()} ${hours}:${minutes}`;
}

type StudentSubmissionsTabProps = {
  assignmentId: number;
};

export const StudentSubmissionsTab: React.FC<StudentSubmissionsTabProps> = ({
  assignmentId,
}) => {
  const queryClient = useQueryClient();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [markValue, setMarkValue] = useState('');
  const [markComment, setMarkComment] = useState('');
  const [commentText, setCommentText] = useState('');

  const { data: submissionsData } = useGetSubmissionsQuery(assignmentId, 0, 100);
  const submissions = submissionsData?.data ?? [];

  const { data: selectedSubmission } = useGetSubmissionQuery(
    selectedSubmissionId ?? 0,
    { enabled: selectedSubmissionId != null },
  );

  const { mutate: markSubmission, isPending: isMarking } = useMarkSubmissionMutation(
    selectedSubmissionId ?? 0,
  );

  const { mutate: addComment } = useAddCommentToSubmissionMutation(selectedSubmissionId ?? 0);

  const handleAddComment = useCallback(() => {
    if (!commentText.trim() || selectedSubmissionId == null) return;
    addComment(
      { textLexical: wrapInLexical(commentText) },
      {
        onSuccess: () => {
          setCommentText('');
          void queryClient.invalidateQueries({ queryKey: getSubmissionQueryKey(selectedSubmissionId) });
        },
      },
    );
  }, [commentText, selectedSubmissionId, addComment, queryClient]);

  const submittedCount = submissions.filter(
    (s) => s.state === 'Submitted' || s.state === 'Accepted',
  ).length;
  const gradedCount = submissions.filter((s) => s.mark != null).length;

  const handleSelectSubmission = useCallback(
    (sub: SubmissionListItem) => {
      setSelectedSubmissionId(sub.id);
      setMarkValue(sub.mark ?? '');
      setMarkComment('');
    },
    [],
  );

  const handleBack = useCallback(() => {
    setSelectedSubmissionId(null);
    setMarkValue('');
    setMarkComment('');
    setCommentText('');
  }, []);

  const handleSaveMark = useCallback(() => {
    if (selectedSubmissionId == null) return;
    markSubmission(
      { mark: markValue || null, markComment: markComment || null },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: getSubmissionsQueryKey(assignmentId),
          });
          void queryClient.invalidateQueries({
            queryKey: getSubmissionQueryKey(selectedSubmissionId),
          });
        },
      },
    );
  }, [selectedSubmissionId, markValue, markComment, markSubmission, queryClient, assignmentId]);

  if (selectedSubmissionId != null && selectedSubmission) {
    return (
      <div className={styles.container} data-test-id="student-submissions-tab">
        <div className={styles.selectedSubmission}>
          <div className={styles.selectedHeader}>
            <div className={styles.selectedStudentInfo}>
              <div
                className={styles.avatar}
                style={{ background: getAvatarColor(selectedSubmission.author.legalName) }}
              >
                {getInitials(selectedSubmission.author.legalName)}
              </div>
              <div>
                <div className={styles.selectedStudentName}>
                  {selectedSubmission.author.legalName}
                </div>
                {selectedSubmission.lastSubmittedAtUTC && (
                  <div className={styles.submittedAt}>
                    Сдано: {formatDate(selectedSubmission.lastSubmittedAtUTC)}
                  </div>
                )}
              </div>
            </div>
            <button className={styles.backButton} onClick={handleBack}>
              Назад к списку
            </button>
          </div>
          <div className={styles.selectedBody}>
            <div>
              <span className={`${styles.statusBadge} ${statusClass(selectedSubmission.state)}`}>
                {statusLabel(selectedSubmission.state)}
              </span>
            </div>

            {selectedSubmission.attachments.length > 0 && (
              <AttachmentsList
                attachments={selectedSubmission.attachments.map(fileInfoToAttachment)}
                onError={(err) => console.error('Download error:', err)}
              />
            )}

            <div className={styles.markSection}>
              <span className={styles.markLabel}>Оценка:</span>
              <input
                className={styles.markInput}
                value={markValue}
                onChange={(e) => setMarkValue(e.target.value)}
                placeholder="—"
              />
              <button
                className={styles.markSaveButton}
                onClick={handleSaveMark}
                disabled={isMarking}
              >
                Сохранить
              </button>
            </div>

            <div className={styles.commentsSection}>
              <div className={styles.commentsHeader}>Комментарии к работе</div>
              {selectedSubmission.comments.map((comment) => (
                <div key={comment.id} className={styles.commentItem}>
                  <div className={styles.commentMeta}>
                    <span className={styles.commentAuthor}>{comment.author.legalName}</span>
                    <span className={styles.commentDate}>{comment.createdAt.toLocaleDateString()}</span>
                  </div>
                  <div className={styles.commentBody}>
                    <LexicalViewer lexicalState={comment.textLexical} />
                  </div>
                </div>
              ))}
              <div className={styles.commentInputArea}>
                <textarea
                  className={styles.commentTextarea}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  aria-label="Комментарий"
                  placeholder="Написать комментарий..."
                  rows={1}
                />
                <button
                  className={styles.commentSendButton}
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                >
                  Отправить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} data-test-id="student-submissions-tab">
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryCount}>{submittedCount}</span>
          <span className={styles.summaryLabel}>Сдано</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryCount}>{submissions.length - submittedCount}</span>
          <span className={styles.summaryLabel}>Не сдано</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryCount}>{gradedCount}</span>
          <span className={styles.summaryLabel}>Оценено</span>
        </div>
      </div>

      <div className={styles.list}>
        <div className={styles.listHeader}>
          <span>Все учащиеся ({submissions.length})</span>
        </div>
        {submissions.length === 0 ? (
          <div className={styles.empty}>Нет работ</div>
        ) : (
          submissions.map((sub) => (
            <div
              key={sub.id}
              className={styles.studentRow}
              onClick={() => handleSelectSubmission(sub)}
              data-test-id={`submission-row-${sub.id}`}
            >
              <div className={styles.studentInfo}>
                <div
                  className={styles.avatar}
                  style={{ background: getAvatarColor(sub.author.legalName) }}
                >
                  {getInitials(sub.author.legalName)}
                </div>
                <div>
                  <div className={styles.studentName}>{sub.author.legalName}</div>
                  {sub.author.groupNumber && (
                    <div className={styles.studentGroup}>{sub.author.groupNumber}</div>
                  )}
                </div>
              </div>
              <span className={`${styles.statusBadge} ${statusClass(sub.state)}`}>
                {statusLabel(sub.state)}
              </span>
              <div className={`${styles.mark} ${sub.mark == null ? styles.markEmpty : ''}`}>
                {sub.mark ?? '—'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
