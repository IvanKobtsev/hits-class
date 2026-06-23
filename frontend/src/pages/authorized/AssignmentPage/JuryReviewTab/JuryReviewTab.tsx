import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetPeerReviewAssignmentsQuery,
  useCreatePeerReviewMutation,
  useDeletePeerReviewMutation,
  getPeerReviewAssignmentsQueryKey,
} from 'services/api/api-client/PeerReviewQuery';
import {
  type CriteriaDto,
  CriteriaType,
  type CreatePeerReviewDto,
  type PeerReviewAssignmentDto,
  PeerReviewState,
  type Attachment,
  type FileInfoDto,
} from 'services/api/api-client.types';
import { AttachmentsList } from 'pages/authorized/OneCoursePage/PublicatonsList/PublicationListItem/AttachmentsList/AttachmentsList';
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
    case PeerReviewState.NotReviewed:
      return 'Не проверено';
    case PeerReviewState.Reviewed:
      return 'Проверено';
    case PeerReviewState.Checked:
      return 'Оценено преподавателем';
    default:
      return state;
  }
}

function statusClass(state: PeerReviewState): string {
  switch (state) {
    case PeerReviewState.NotReviewed:
      return styles.statusNotReviewed;
    case PeerReviewState.Reviewed:
      return styles.statusReviewed;
    case PeerReviewState.Checked:
      return styles.statusChecked;
    default:
      return '';
  }
}

function fileInfoToAttachment(f: FileInfoDto): Attachment {
  return {
    uuid: f.id,
    fileName: f.fileName,
    size: f.size,
    createdAt: f.createdAt,
  };
}

type Props = {
  assignmentId: number;
  criteria: CriteriaDto[];
  minMark: number | null;
  maxMark: number | null;
};

export const JuryReviewTab: React.FC<Props> = ({
  assignmentId,
  criteria,
  minMark,
  maxMark,
}) => {
  const queryClient = useQueryClient();
  const { data: assignments, isLoading } = useGetPeerReviewAssignmentsQuery(assignmentId);

  const [selectedAssignment, setSelectedAssignment] = useState<PeerReviewAssignmentDto | null>(null);
  const [criteriaScores, setCriteriaScores] = useState<Record<number, string>>({});
  const [criteriaNotes, setCriteriaNotes] = useState<Record<number, string>>({});
  const [finalMarkValue, setFinalMarkValue] = useState('');
  const [hintedMarkValue, setHintedMarkValue] = useState('');
  const [clampMessage, setClampMessage] = useState('');

  const createMutation = useCreatePeerReviewMutation(selectedAssignment?.id ?? 0, {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getPeerReviewAssignmentsQueryKey(assignmentId),
      });
      handleBack();
    },
  });

  const deleteMutation = useDeletePeerReviewMutation(selectedAssignment?.id ?? 0, {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getPeerReviewAssignmentsQueryKey(assignmentId),
      });
      handleBack();
    },
  });

  const handleSelect = useCallback((assignment: PeerReviewAssignmentDto) => {
    setSelectedAssignment(assignment);
    setCriteriaScores({});
    setCriteriaNotes({});
    setFinalMarkValue('');
    setHintedMarkValue('');
    setClampMessage('');
  }, []);

  const handleBack = useCallback(() => {
    setSelectedAssignment(null);
    setCriteriaScores({});
    setCriteriaNotes({});
    setFinalMarkValue('');
    setHintedMarkValue('');
    setClampMessage('');
  }, []);

  const scoreCriteria = criteria.filter((c) => c.type === CriteriaType.Score);
  const bonusScoreCriteria = criteria.filter((c) => c.type === CriteriaType.BonusScore);
  const multiplierCriteria = criteria.filter((c) => c.type === CriteriaType.Multiplier);
  const bonusMultiplierCriteria = criteria.filter((c) => c.type === CriteriaType.BonusMultiplier);
  const requirementCriteria = criteria.filter((c) => c.type === CriteriaType.Requirement);

  const baseScore = scoreCriteria.length > 0
    ? scoreCriteria.reduce((sum, c) => sum + (Number(criteriaScores[c.id]) || 0), 0)
    : null;
  const bonusScore = bonusScoreCriteria.length > 0
    ? bonusScoreCriteria.reduce((sum, c) => sum + (Number(criteriaScores[c.id]) || 0), 0)
    : null;
  const baseMultiplier = multiplierCriteria.length > 0
    ? multiplierCriteria.reduce((sum, c) => sum + (Number(criteriaScores[c.id]) || (c.minValue ?? 0)), 0)
    : null;
  const bonusMultiplier = bonusMultiplierCriteria.length > 0
    ? bonusMultiplierCriteria.reduce((sum, c) => sum + (Number(criteriaScores[c.id]) || (c.minValue ?? 0)), 0)
    : null;
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
    if (maxMark !== null && clamped > maxMark) {
      clamped = maxMark;
      message = '* Итоговая оценка округлена до максимума';
    } else if (minMark !== null && clamped < minMark) {
      clamped = minMark;
      message = '* Итоговая оценка округлена до минимума';
    }
    setHintedMarkValue(String(computedFinalScore));
    setFinalMarkValue(String(clamped));
    setClampMessage(message);
  }, [computedFinalScore, minMark, maxMark]);

  const handleSubmitReview = useCallback(() => {
    if (!selectedAssignment) return;
    const dto: CreatePeerReviewDto = {
      mark: criteria.length > 0 ? finalMarkValue || null : null,
      evaluations: criteria.map((c) => ({
        criteriaId: c.id,
        value: criteriaScores[c.id] ?? '',
        note: criteriaNotes[c.id] || null,
      })),
    };
    createMutation.mutate(dto);
  }, [selectedAssignment, criteria, finalMarkValue, criteriaScores, criteriaNotes, createMutation]);

  const handleDeleteReview = useCallback(() => {
    if (!selectedAssignment) return;
    deleteMutation.mutate();
  }, [selectedAssignment, deleteMutation]);

  if (isLoading) return <Loading loading />;

  if (!assignments || assignments.length === 0) {
    return <div className={styles.empty}>У вас нет назначенных проверок</div>;
  }

  // Review form for selected defendant
  if (selectedAssignment) {
    const isReviewed = selectedAssignment.state === PeerReviewState.Reviewed;
    const isChecked = selectedAssignment.state === PeerReviewState.Checked;

    return (
      <div className={styles.reviewContainer}>
        <div className={styles.reviewHeader}>
          <div className={styles.reviewStudentInfo}>
            <div
              className={styles.avatar}
              style={{ background: getAvatarColor(selectedAssignment.defendantUser.name) }}
            >
              {getInitials(selectedAssignment.defendantUser.name)}
            </div>
            <div className={styles.reviewStudentName}>
              {selectedAssignment.defendantUser.name}
            </div>
          </div>
          <button className={styles.backButton} onClick={handleBack}>
            Назад к списку
          </button>
        </div>

        {(isReviewed || isChecked) && (
          <div className={styles.existingReview}>
            <div className={styles.existingReviewHeader}>
              {isChecked ? 'Проверка принята преподавателем' : 'Вы уже оставили проверку'}
            </div>
            {!isChecked && (
              <button
                className={styles.markDeleteButton}
                onClick={handleDeleteReview}
                disabled={deleteMutation.isPending}
              >
                Удалить проверку
              </button>
            )}
          </div>
        )}

        {!isReviewed && !isChecked && criteria.length > 0 && (
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
                          setCriteriaScores((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
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
                      <span className={styles.criteriaSummaryLabel}>Сырые баллы:</span>
                      <strong>{baseScore}</strong>
                    </span>
                  )}
                  {baseMultiplier !== null && (
                    <span className={styles.criteriaSummaryItem}>
                      <span className={styles.criteriaSummaryLabel}>Множитель:</span>
                      <strong>{baseMultiplier}</strong>
                    </span>
                  )}
                  {bonusScore !== null && (
                    <span className={styles.criteriaSummaryItem}>
                      <span className={styles.criteriaSummaryLabel}>Бонусные баллы:</span>
                      <strong>{bonusScore}</strong>
                    </span>
                  )}
                  {bonusMultiplier !== null && (
                    <span className={styles.criteriaSummaryItem}>
                      <span className={styles.criteriaSummaryLabel}>Множитель бонуса:</span>
                      <strong>{bonusMultiplier}</strong>
                    </span>
                  )}
                  <button
                    className={styles.criteriaApplyButton}
                    type="button"
                    onClick={handleApplyCriteria}
                  >
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

        {!isReviewed && !isChecked && (
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
              onClick={handleSubmitReview}
              disabled={createMutation.isPending || (!finalMarkValue && criteria.length > 0)}
            >
              Отправить проверку
            </button>
          </div>
        )}
      </div>
    );
  }

  // List of assigned defendants
  return (
    <div className={styles.container}>
      <div className={styles.list}>
        <div className={styles.listHeader}>
          <span>Назначенные проверки ({assignments.length})</span>
        </div>
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className={styles.defendantRow}
            onClick={() => handleSelect(assignment)}
          >
            <div className={styles.defendantInfo}>
              <div
                className={styles.avatar}
                style={{ background: getAvatarColor(assignment.defendantUser.name) }}
              >
                {getInitials(assignment.defendantUser.name)}
              </div>
              <div className={styles.defendantName}>
                {assignment.defendantUser.name}
              </div>
            </div>
            <span className={`${styles.statusBadge} ${statusClass(assignment.state)}`}>
              {statusLabel(assignment.state)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
