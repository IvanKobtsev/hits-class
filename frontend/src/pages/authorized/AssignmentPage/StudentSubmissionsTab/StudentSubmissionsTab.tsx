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
import type {
  SubmissionListItem,
  SubmissionState,
  FileInfoDto,
  Attachment,
  LexicalState,
  CriteriaDto,
} from 'services/api/api-client.types';
import { CriteriaType } from 'services/api/api-client.types';
import { AttachmentsList } from 'pages/authorized/OneCoursePage/PublicatonsList/PublicationListItem/AttachmentsList/AttachmentsList';
import { LexicalViewer } from 'components/lexical/LexicalViewer';
import styles from './StudentSubmissionsTab.module.scss';

const AVATAR_COLORS = [
  '#1a73e8',
  '#e8710a',
  '#1e8e3e',
  '#d93025',
  '#9334e6',
  '#e52592',
  '#00897b',
  '#f9ab00',
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
    case 'Submitted':
      return 'Сдано';
    case 'Accepted':
      return 'Принято';
    case 'Draft':
      return 'Черновик';
    default:
      return state;
  }
}

function statusClass(state: SubmissionState): string {
  switch (state) {
    case 'Submitted':
      return styles.statusSubmitted;
    case 'Accepted':
      return styles.statusAccepted;
    case 'Draft':
      return styles.statusDraft;
    default:
      return '';
  }
}

export function wrapInLexical(text: string): LexicalState {
  return {
    json: JSON.stringify({
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text,
                type: 'text',
                version: 1,
              },
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
    }),
  };
}

function fileInfoToAttachment(f: FileInfoDto): Attachment {
  return {
    uuid: f.id,
    fileName: f.fileName,
    size: f.size,
    createdAt: f.createdAt,
  };
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

function isSubmittedLate(
  submittedAt: Date | null,
  deadline: Date | null,
): boolean {
  if (!submittedAt || !deadline) return false;
  return new Date(submittedAt) > new Date(deadline);
}

type StudentSubmissionsTabProps = {
  assignmentId: number;
  deadlineUtc: Date | null;
  minMark: number | null;
  maxMark: number | null;
  criteria: CriteriaDto[];
};

export const StudentSubmissionsTab: React.FC<StudentSubmissionsTabProps> = ({
  assignmentId,
  deadlineUtc,
  minMark,
  maxMark,
  criteria,
}) => {
  const queryClient = useQueryClient();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    number | null
  >(null);
  const [markValue, setMarkValue] = useState('');
  const [finalMarkValue, setFinalMarkValue] = useState('');
  const [clampMessage, setClampMessage] = useState<string>('');
  const [markComment, setMarkComment] = useState('');
  const [commentText, setCommentText] = useState('');
  const [criteriaScores, setCriteriaScores] = useState<Record<number, string>>(
    {},
  );

  const { data: submissionsData } = useGetSubmissionsQuery(
    assignmentId,
    0,
    100,
  );
  const submissions = submissionsData?.data ?? [];

  const { data: selectedSubmission } = useGetSubmissionQuery(
    selectedSubmissionId ?? 0,
    { enabled: selectedSubmissionId != null },
  );

  const { mutate: markSubmission, isPending: isMarking } =
    useMarkSubmissionMutation(selectedSubmissionId ?? 0);

  const { mutate: addComment } = useAddCommentToSubmissionMutation(
    selectedSubmissionId ?? 0,
  );

  const handleAddComment = useCallback(() => {
    if (!commentText.trim() || selectedSubmissionId == null) return;
    addComment(
      { content: wrapInLexical(commentText) },
      {
        onSuccess: () => {
          setCommentText('');
          void queryClient.invalidateQueries({
            queryKey: getSubmissionQueryKey(selectedSubmissionId),
          });
        },
      },
    );
  }, [commentText, selectedSubmissionId, addComment, queryClient]);

  const submittedCount = submissions.filter(
    (s) => s.state === 'Submitted' || s.state === 'Accepted',
  ).length;
  const gradedCount = submissions.filter((s) => s.mark != null).length;

  const handleSelectSubmission = useCallback((sub: SubmissionListItem) => {
    setSelectedSubmissionId(sub.id);
    setMarkValue(sub.mark ?? '');
    setFinalMarkValue('');
    setClampMessage('');
    setMarkComment('');
    setCriteriaScores({});
  }, []);

  const handleBack = useCallback(() => {
    setSelectedSubmissionId(null);
    setMarkValue('');
    setFinalMarkValue('');
    setClampMessage('');
    setMarkComment('');
    setCommentText('');
    setCriteriaScores({});
  }, []);

  const scoreCriteria = criteria.filter((c) => c.type === CriteriaType.Score);
  const multiplierCriteria = criteria.filter(
    (c) => c.type === CriteriaType.Multiplier,
  );
  const requirementCriteria = criteria.filter(
    (c) => c.type === CriteriaType.Requirement,
  );

  const additionalScore =
    scoreCriteria.length > 0
      ? scoreCriteria.reduce(
          (sum, c) => sum + (Number(criteriaScores[c.id]) || 0),
          0,
        )
      : null;
  const totalMultiplier =
    multiplierCriteria.length > 0
      ? multiplierCriteria.reduce(
          (sum, c) => sum + (Number(criteriaScores[c.id]) || 0),
          0,
        )
      : null;
  const hasUnmetRequirements = requirementCriteria.some(
    (c) => criteriaScores[c.id] !== 'true',
  );
  const rawMarkNum = Number(markValue) || 0;
  const computedFinalScore =
    criteria.length > 0
      ? parseFloat((rawMarkNum * (totalMultiplier ?? 1) + (additionalScore ?? 0)).toFixed(10))
      : null;

  const handleApplyCriteria = useCallback(() => {
    if (computedFinalScore === null) return;
    let clamped = computedFinalScore;
    let message = '';
    if (maxMark !== null && clamped > maxMark) {
      clamped = maxMark;
      message = '* Итоговая оценка округлена до максимума';
    } else if (minMark !== null && clamped < minMark) {
      clamped = minMark;
      message = '* Итоговая оценка округлена до минимума';
    }
    setFinalMarkValue(String(clamped));
    setClampMessage(message);
  }, [computedFinalScore, minMark, maxMark]);

  const handleSaveMark = useCallback(() => {
    if (selectedSubmissionId == null) return;
    const submittedMark =
      criteria.length > 0 ? finalMarkValue || null : markValue || null;
    markSubmission(
      {
        mark: submittedMark,
        markComment: !!markComment ? { json: markComment } : null,
      },
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
  }, [
    selectedSubmissionId,
    criteria.length,
    finalMarkValue,
    markValue,
    markComment,
    markSubmission,
    queryClient,
    assignmentId,
  ]);

  if (selectedSubmissionId != null && selectedSubmission) {
    return (
      <div className={styles.container} data-test-id="student-submissions-tab">
        <div className={styles.selectedSubmission}>
          <div className={styles.selectedHeader}>
            <div className={styles.selectedStudentInfo}>
              <div
                className={styles.avatar}
                style={{
                  background: getAvatarColor(
                    selectedSubmission.author.legalName,
                  ),
                }}
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
              <span
                className={`${styles.statusBadge} ${isSubmittedLate(selectedSubmission.lastSubmittedAtUTC, deadlineUtc) ? styles.statusLate : statusClass(selectedSubmission.state)}`}
              >
                {isSubmittedLate(
                  selectedSubmission.lastSubmittedAtUTC,
                  deadlineUtc,
                )
                  ? 'Сдано с опозданием'
                  : statusLabel(selectedSubmission.state)}
              </span>
            </div>

            {selectedSubmission.attachments.length > 0 && (
              <AttachmentsList
                attachments={selectedSubmission.attachments.map(
                  fileInfoToAttachment,
                )}
                onError={(err) => console.error('Download error:', err)}
              />
            )}

            {criteria.length > 0 && (
              <div className={styles.criteriaSection}>
                <div className={styles.criteriaHeader}>Критерии оценивания</div>
                {criteria.map((c) => (
                  <div key={c.id} className={styles.criteriaItem}>
                    <div className={styles.criteriaDescription}>
                      {c.description}
                    </div>
                    <div className={styles.criteriaControl}>
                      {c.type === CriteriaType.Requirement ? (
                        <label className={styles.criteriaCheckboxLabel}>
                          <input
                            type="checkbox"
                            className={styles.criteriaCheckbox}
                            checked={criteriaScores[c.id] === 'true'}
                            onChange={(e) =>
                              setCriteriaScores((prev) => ({
                                ...prev,
                                [c.id]: e.target.checked ? 'true' : 'false',
                              }))
                            }
                          />
                          Выполнено
                        </label>
                      ) : (
                        <div className={styles.criteriaScoreInput}>
                          <input
                            type="number"
                            className={styles.markInput}
                            value={criteriaScores[c.id] ?? ''}
                            onChange={(e) =>
                              setCriteriaScores((prev) => ({
                                ...prev,
                                [c.id]: e.target.value,
                              }))
                            }
                            placeholder="—"
                            min={c.minValue ?? undefined}
                            max={c.maxValue ?? undefined}
                          />
                          {c.type === CriteriaType.Score &&
                            c.maxValue != null && (
                              <span className={styles.criteriaRange}>
                                / {c.maxValue}
                                {c.minValue != null &&
                                  c.minValue !== 0 &&
                                  ` (мин. ${c.minValue})`}
                              </span>
                            )}
                          {c.type === CriteriaType.Multiplier && (
                            <span className={styles.criteriaRange}>×</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {(additionalScore !== null || totalMultiplier !== null) && (
                  <div className={styles.criteriaSummary}>
                    <div className={styles.criteriaSummaryRow}>
                      {additionalScore !== null && (
                        <span className={styles.criteriaSummaryItem}>
                          <span className={styles.criteriaSummaryLabel}>
                            Дополнительный балл:
                          </span>
                          <strong>{additionalScore}</strong>
                        </span>
                      )}
                      {totalMultiplier !== null && (
                        <span className={styles.criteriaSummaryItem}>
                          <span className={styles.criteriaSummaryLabel}>
                            Итоговый множитель:
                          </span>
                          <strong>{totalMultiplier}</strong>
                        </span>
                      )}
                      <button
                        className={styles.criteriaApplyButton}
                        type="button"
                        onClick={handleApplyCriteria}
                      >
                        Применить
                      </button>
                      {requirementCriteria.length > 0 &&
                        hasUnmetRequirements && (
                          <span className={styles.requirementWarning}>
                            * Не все требования выполнены
                          </span>
                        )}
                      {clampMessage && (
                        <span className={styles.clampMessage}>
                          {clampMessage}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={styles.markSection}>
              <span className={styles.markLabel}>Сырой балл:</span>
              <input
                className={styles.markInput}
                value={markValue}
                onChange={(e) => setMarkValue(e.target.value)}
                placeholder="—"
              />
              {criteria.length > 0 && (
                <>
                  <span className={styles.markLabel}>Итог:</span>
                  <input
                    className={styles.markInput}
                    value={finalMarkValue}
                    onChange={(e) => {
                      setFinalMarkValue(e.target.value);
                      setClampMessage('');
                    }}
                    placeholder="—"
                  />
                </>
              )}
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
                    <span className={styles.commentAuthor}>
                      {comment.author.legalName}
                    </span>
                    <span className={styles.commentDate}>
                      {comment.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.commentBody}>
                    <LexicalViewer lexicalState={comment.content} />
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
          <span className={styles.summaryCount}>
            {submissions.length - submittedCount}
          </span>
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
                  <div className={styles.studentName}>
                    {sub.author.legalName}
                  </div>
                  {sub.author.groupNumber && (
                    <div className={styles.studentGroup}>
                      {sub.author.groupNumber}
                    </div>
                  )}
                </div>
              </div>
              <span
                className={`${styles.statusBadge} ${isSubmittedLate(sub.lastSubmittedAtUTC, deadlineUtc) ? styles.statusLate : statusClass(sub.state)}`}
              >
                {isSubmittedLate(sub.lastSubmittedAtUTC, deadlineUtc)
                  ? 'Сдано с опозданием'
                  : statusLabel(sub.state)}
              </span>
              <div
                className={`${styles.mark} ${sub.mark == null ? styles.markEmpty : ''}`}
              >
                {sub.mark ?? '—'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
