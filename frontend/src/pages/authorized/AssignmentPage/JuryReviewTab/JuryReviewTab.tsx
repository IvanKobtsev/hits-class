import React, { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetPeerReviewAssignmentsQuery,
  useCreatePeerReviewMutation,
  useDeletePeerReviewMutation,
  useGetReviewQuery,
  useUpdatePeerReviewMutation,
  getPeerReviewAssignmentsQueryKey,
  getReviewQueryKey,
} from 'services/api/api-client/PeerReviewQuery';
import { useGetSubmissionsQuery, useGetSubmissionQuery } from 'services/api/api-client/SubmissionQuery';
import {
  type CriteriaDto,
  type CriteriaEvaluationDto,
  CriteriaType,
  type CreatePeerReviewDto,
  type UpdatePeerReviewDto,
  type PeerReviewAssignmentDto,
  PeerReviewState,
  type Attachment,
  type FileInfoDto,
  type SubmissionListItem,
} from 'services/api/api-client.types';
import {
  AttachmentsList,
} from 'pages/authorized/OneCoursePage/PublicatonsList/PublicationListItem/AttachmentsList/AttachmentsList';
import { Loading } from 'components/uikit/suspense/Loading';
import styles from './JuryReviewTab.module.scss';

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

function statusLabel(state: PeerReviewState): string {
  switch (state) {
    case PeerReviewState.NotReviewed: return 'Не проверено';
    case PeerReviewState.Reviewed: return 'Проверено';
    case PeerReviewState.Checked: return 'Оценено преподавателем';
    default: return state;
  }
}

function statusClass(state: PeerReviewState): string {
  switch (state) {
    case PeerReviewState.NotReviewed: return styles.statusNotReviewed;
    case PeerReviewState.Reviewed: return styles.statusReviewed;
    case PeerReviewState.Checked: return styles.statusChecked;
    default: return '';
  }
}

function fileInfoToAttachment(f: FileInfoDto): Attachment {
  return { uuid: f.id, fileName: f.fileName, size: f.size, createdAt: f.createdAt };
}

type Props = {
  assignmentId: number;
  criteria: CriteriaDto[];
  minMark: number | null;
  maxMark: number | null;
};

export const JuryReviewTab: React.FC<Props> = ({ assignmentId, criteria, minMark, maxMark }) => {
  const { data: assignments, isLoading } = useGetPeerReviewAssignmentsQuery(assignmentId, String(assignmentId));
  const [selectedAssignment, setSelectedAssignment] = useState<PeerReviewAssignmentDto | null>(null);

  const handleBack = useCallback(() => setSelectedAssignment(null), []);

  if (isLoading) return <Loading loading />;
  if (!assignments || assignments.length === 0) {
    return <div className={styles.empty}>У вас нет назначенных проверок</div>;
  }

  if (selectedAssignment) {
    return (
      <JuryReviewForm
        key={selectedAssignment.id}
        assignment={selectedAssignment}
        assignmentId={assignmentId}
        criteria={criteria}
        minMark={minMark}
        maxMark={maxMark}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        <div className={styles.listHeader}>
          <span>Назначенные проверки ({assignments.length})</span>
        </div>
        {assignments.map((a) => (
          <div key={a.id} className={styles.defendantRow} onClick={() => setSelectedAssignment(a)}>
            <div className={styles.defendantInfo}>
              <div className={styles.avatar} style={{ background: getAvatarColor(a.defendantUser.name) }}>
                {getInitials(a.defendantUser.name)}
              </div>
              <div>
                <div className={styles.defendantName}>{a.defendantUser.name}</div>
              </div>
            </div>
            {a.mark && <span className={styles.markBadge}>{a.mark}</span>}
            <span className={`${styles.statusBadge} ${statusClass(a.state)}`}>
              {statusLabel(a.state)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

type ReviewFormProps = {
  assignment: PeerReviewAssignmentDto;
  assignmentId: number;
  criteria: CriteriaDto[];
  minMark: number | null;
  maxMark: number | null;
  onBack: () => void;
};

const JuryReviewForm: React.FC<ReviewFormProps> = ({
  assignment,
  assignmentId,
  criteria,
  minMark,
  maxMark,
  onBack,
}) => {
  const queryClient = useQueryClient();
  const isReviewed = assignment.state === PeerReviewState.Reviewed;
  const isChecked = assignment.state === PeerReviewState.Checked;
  const hasExistingReview = isReviewed || isChecked;

  const { data: existingReview, isLoading: reviewLoading } = useGetReviewQuery(
    assignment.id,
    { enabled: hasExistingReview },
  );

  const { data: submissionsData } = useGetSubmissionsQuery(assignmentId, 0, 100);
  const defendantSubmissionListItem = submissionsData?.data?.find(
    (s: SubmissionListItem) => s.author.id === assignment.defendantUser.userId,
  );
  const { data: defendantSubmission } = useGetSubmissionQuery(
    defendantSubmissionListItem?.id ?? 0,
    { enabled: !!defendantSubmissionListItem },
  );

  const [criteriaScores, setCriteriaScores] = useState<Record<number, string>>({});
  const [criteriaNotes, setCriteriaNotes] = useState<Record<number, string>>({});
  const [finalMarkValue, setFinalMarkValue] = useState('');
  const [hintedMarkValue, setHintedMarkValue] = useState('');
  const [clampMessage, setClampMessage] = useState('');
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (existingReview && hasExistingReview) {
      const scores: Record<number, string> = {};
      const notes: Record<number, string> = {};
      for (const ev of existingReview.evaluations) {
        const matched = criteria.find((c) => c.description === ev.criteriaDescription);
        if (matched) {
          scores[matched.id] = ev.value;
          if (ev.note) notes[matched.id] = ev.note;
        }
      }
      setCriteriaScores(scores);
      setCriteriaNotes(notes);
      setFinalMarkValue(existingReview.mark ?? '');
      setComment(existingReview.comment ?? '');
    }
  }, [existingReview, hasExistingReview, criteria]);

  const invalidateAll = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: getPeerReviewAssignmentsQueryKey(assignmentId, String(assignmentId)) });
    void queryClient.invalidateQueries({ queryKey: getReviewQueryKey(assignment.id) });
  }, [queryClient, assignmentId, assignment.id]);

  const createMutation = useCreatePeerReviewMutation(assignment.id, {
    onSuccess: () => { invalidateAll(); onBack(); },
  });

  const updateMutation = useUpdatePeerReviewMutation(existingReview?.id ?? 0, {
    onSuccess: () => { invalidateAll(); setIsEditing(false); },
  });

  const deleteMutation = useDeletePeerReviewMutation(existingReview?.id ?? 0, {
    onSuccess: () => { invalidateAll(); onBack(); },
  });

  const scoreCriteria = criteria.filter((c) => c.type === CriteriaType.Score);
  const bonusScoreCriteria = criteria.filter((c) => c.type === CriteriaType.BonusScore);
  const multiplierCriteria = criteria.filter((c) => c.type === CriteriaType.Multiplier);
  const bonusMultiplierCriteria = criteria.filter((c) => c.type === CriteriaType.BonusMultiplier);
  const requirementCriteria = criteria.filter((c) => c.type === CriteriaType.Requirement);

  const baseScore = scoreCriteria.length > 0
    ? scoreCriteria.reduce((sum, c) => sum + (Number(criteriaScores[c.id]) || 0), 0) : null;
  const bonusScore = bonusScoreCriteria.length > 0
    ? bonusScoreCriteria.reduce((sum, c) => sum + (Number(criteriaScores[c.id]) || 0), 0) : null;
  const baseMultiplier = multiplierCriteria.length > 0
    ? multiplierCriteria.reduce((sum, c) => sum + (Number(criteriaScores[c.id]) || (c.minValue ?? 0)), 0) : null;
  const bonusMultiplier = bonusMultiplierCriteria.length > 0
    ? bonusMultiplierCriteria.reduce((sum, c) => sum + (Number(criteriaScores[c.id]) || (c.minValue ?? 0)), 0) : null;
  const hasUnmetRequirements = requirementCriteria.some((c) => criteriaScores[c.id] !== 'true');
  const everyMinimumIsPassed = criteria.every(
    (c) => c.minValue === null || c.minValue === 0 || c.type !== CriteriaType.Score || Number(c.minValue) <= Number(criteriaScores[c.id]),
  );
  const computedFinalScore =
    criteria.length > 0 && !hasUnmetRequirements && everyMinimumIsPassed
      ? parseFloat(((baseScore ?? 0) * (baseMultiplier ?? 1) + ((bonusScore ?? 0) * (bonusMultiplier ?? 1))).toFixed(10))
      : 0;

  const handleApplyCriteria = useCallback(() => {
    let clamped = computedFinalScore;
    let message = '';
    if (maxMark !== null && clamped > maxMark) { clamped = maxMark; message = '* Итоговая оценка округлена до максимума'; }
    else if (minMark !== null && clamped < minMark) { clamped = minMark; message = '* Итоговая оценка округлена до минимума'; }
    setHintedMarkValue(String(computedFinalScore));
    setFinalMarkValue(String(clamped));
    setClampMessage(message);
  }, [computedFinalScore, minMark, maxMark]);

  const buildEvaluations = () => criteria.map((c) => ({
    criteriaId: c.id,
    value: criteriaScores[c.id] ?? '',
    note: criteriaNotes[c.id] || null,
  }));

  const handleSubmitReview = useCallback(() => {
    const dto: CreatePeerReviewDto = {
      mark: criteria.length > 0 ? finalMarkValue || null : null,
      comment: comment || null,
      evaluations: buildEvaluations(),
    };
    createMutation.mutate(dto);
  }, [criteria, finalMarkValue, comment, criteriaScores, criteriaNotes, createMutation]);

  const handleUpdateReview = useCallback(() => {
    const dto: UpdatePeerReviewDto = {
      mark: criteria.length > 0 ? finalMarkValue || undefined : undefined,
      comment: comment || undefined,
      evaluations: buildEvaluations(),
    };
    updateMutation.mutate(dto);
  }, [criteria, finalMarkValue, comment, criteriaScores, criteriaNotes, updateMutation]);

  const showForm = (!hasExistingReview) || (isReviewed && isEditing);
  const showReadonly = hasExistingReview && !isEditing;

  if (reviewLoading && hasExistingReview) return <Loading loading />;

  return (
    <div className={styles.reviewContainer}>
      <div className={styles.reviewHeader}>
        <div className={styles.reviewStudentInfo}>
          <div className={styles.avatar} style={{ background: getAvatarColor(assignment.defendantUser.name) }}>
            {getInitials(assignment.defendantUser.name)}
          </div>
          <div className={styles.reviewStudentName}>{assignment.defendantUser.name}</div>
        </div>
        <button className={styles.backButton} onClick={onBack}>Назад к списку</button>
      </div>

      {defendantSubmission && defendantSubmission.attachments?.length > 0 && (
        <div className={styles.submissionSection}>
          <div className={styles.sectionTitle}>Решение студента</div>
          <AttachmentsList
            attachments={defendantSubmission.attachments.map(fileInfoToAttachment)}
            onError={(err) => console.error('Download error:', err)}
          />
        </div>
      )}
      {defendantSubmission && !defendantSubmission.attachments?.length && (
        <div className={styles.submissionSection}>
          <div className={styles.sectionTitle}>Решение студента</div>
          <div className={styles.noSubmission}>Нет прикреплённых файлов</div>
        </div>
      )}
      {!defendantSubmission && (
        <div className={styles.submissionSection}>
          <div className={styles.sectionTitle}>Решение студента</div>
          <div className={styles.noSubmission}>Студент ещё не сдал работу</div>
        </div>
      )}

      {showReadonly && existingReview && (
        <div className={styles.existingReview}>
          <div className={styles.existingReviewHeader}>
            {isChecked ? 'Проверка принята преподавателем' : 'Ваша проверка'}
          </div>
          <div className={styles.existingReviewMark}>Оценка: <strong>{existingReview.mark}</strong></div>
          {existingReview.comment && (
            <div className={styles.existingReviewMark}>Комментарий: {existingReview.comment}</div>
          )}
          {existingReview.evaluations.map((ev: CriteriaEvaluationDto) => (
            <div key={ev.id} className={styles.existingEvaluation}>
              <strong>{ev.criteriaDescription}:</strong> {ev.value}
              {ev.note && <div className={styles.evaluationNote}>{ev.note}</div>}
            </div>
          ))}
          {isReviewed && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className={styles.markSaveButton} onClick={() => setIsEditing(true)}>
                Редактировать
              </button>
              <button
                className={styles.markDeleteButton}
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                Удалить
              </button>
            </div>
          )}
        </div>
      )}

      {showForm && criteria.length > 0 && (
        <div className={styles.criteriaSection}>
          <div className={styles.sectionTitle}>Критерии оценивания</div>
          {criteria.map((c) => (
            <div key={c.id} className={styles.criteriaItem}>
              <div style={{ flex: 1 }}>
                <div className={styles.criteriaDescription}>
                  {c.description}{' '}
                  {(c.type === CriteriaType.BonusScore || c.type === CriteriaType.BonusMultiplier) && '(бонус)'}
                </div>
                <input
                  className={styles.criteriaNoteInput}
                  value={criteriaNotes[c.id] ?? ''}
                  onChange={(e) => setCriteriaNotes((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  placeholder="Комментарий к критерию..."
                />
              </div>
              <div className={styles.criteriaControl}>
                {c.type === CriteriaType.Requirement ? (
                  <label className={styles.criteriaCheckboxLabel}>
                    <input
                      type="checkbox"
                      className={styles.criteriaCheckbox}
                      checked={criteriaScores[c.id] === 'true'}
                      onChange={(e) =>
                        setCriteriaScores((prev) => ({ ...prev, [c.id]: e.target.checked ? 'true' : 'false' }))
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
                      onChange={(e) => setCriteriaScores((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      placeholder="—"
                      min={c.minValue ?? undefined}
                      max={c.maxValue ?? undefined}
                    />
                    {(c.type === CriteriaType.Score || c.type === CriteriaType.BonusScore) && c.maxValue != null && (
                      <span className={styles.criteriaRange}>
                        / {c.maxValue}
                        {c.minValue != null && c.minValue !== 0 && ` (мин. ${c.minValue})`}
                      </span>
                    )}
                    {(c.type === CriteriaType.Multiplier || c.type === CriteriaType.BonusMultiplier) && (
                      <span className={styles.criteriaRange}>x</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {(baseScore !== null || baseMultiplier !== null) && (
            <div className={styles.criteriaSummary}>
              <div className={styles.criteriaSummaryRow}>
                {baseScore !== null && (
                  <span className={styles.criteriaSummaryItem}>
                    <span className={styles.criteriaSummaryLabel}>Сырые баллы:</span> <strong>{baseScore}</strong>
                  </span>
                )}
                {baseMultiplier !== null && (
                  <span className={styles.criteriaSummaryItem}>
                    <span className={styles.criteriaSummaryLabel}>Множитель:</span> <strong>{baseMultiplier}</strong>
                  </span>
                )}
                {bonusScore !== null && (
                  <span className={styles.criteriaSummaryItem}>
                    <span className={styles.criteriaSummaryLabel}>Бонусные баллы:</span> <strong>{bonusScore}</strong>
                  </span>
                )}
                {bonusMultiplier !== null && (
                  <span className={styles.criteriaSummaryItem}>
                    <span className={styles.criteriaSummaryLabel}>Множитель бонуса:</span> <strong>{bonusMultiplier}</strong>
                  </span>
                )}
                <button className={styles.criteriaApplyButton} type="button" onClick={handleApplyCriteria}>
                  Применить
                </button>
                {requirementCriteria.length > 0 && hasUnmetRequirements && (
                  <span className={styles.requirementWarning}>* Не все требования выполнены</span>
                )}
                {!everyMinimumIsPassed && (
                  <span className={styles.requirementWarning}>* Не все минимумы пройдены</span>
                )}
                {clampMessage && <span className={styles.clampMessage}>{clampMessage}</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className={styles.markSection}>
          <span className={styles.markLabel}>
            Предварительный балл:{' '}
            <strong className={styles.strong}>{hintedMarkValue || '0'}</strong>
          </span>
          {criteria.length > 0 && (
            <>
              <span className={styles.markLabel}>Итог:</span>
              <input
                className={styles.markInput}
                value={finalMarkValue}
                onChange={(e) => { setFinalMarkValue(e.target.value); setClampMessage(''); }}
                placeholder="—"
              />
            </>
          )}
        </div>
      )}

      {showForm && (
        <div className={styles.markSection}>
          <span className={styles.markLabel}>Комментарий:</span>
          <input
            className={styles.commentInput}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Общий комментарий к проверке..."
          />
          {isEditing ? (
            <button
              className={styles.markSaveButton}
              onClick={handleUpdateReview}
              disabled={updateMutation.isPending || (!finalMarkValue && criteria.length > 0)}
            >
              Сохранить изменения
            </button>
          ) : (
            <button
              className={styles.markSaveButton}
              onClick={handleSubmitReview}
              disabled={createMutation.isPending || (!finalMarkValue && criteria.length > 0)}
            >
              Отправить проверку
            </button>
          )}
        </div>
      )}
    </div>
  );
};
