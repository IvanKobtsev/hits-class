import React, { useState } from 'react';
import {
  useGetPeerReviewsGeneralQuery,
  useGetReviewQuery,
} from 'services/api/api-client/PeerReviewQuery';
import {
  type PeerReviewAssignmentDto,
  type CriteriaEvaluationDto,
  PeerReviewState,
} from 'services/api/api-client.types';
import styles from './PeerReviewMarksPanel.module.scss';

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

type Props = {
  assignmentId: number;
  defendantUserId: string;
};

export const PeerReviewMarksPanel: React.FC<Props> = ({ assignmentId, defendantUserId }) => {
  const { data: reviews } = useGetPeerReviewsGeneralQuery(assignmentId, defendantUserId);
  const [selectedReviewAssignmentId, setSelectedReviewAssignmentId] = useState<number | null>(null);

  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>P2P оценки</div>
      <div className={styles.list}>
        {reviews.map((r: PeerReviewAssignmentDto) => (
          <div
            key={r.id}
            className={styles.reviewRow}
            onClick={() => {
              if (r.state !== PeerReviewState.NotReviewed) setSelectedReviewAssignmentId(r.id);
            }}
          >
            <div
              className={styles.avatar}
              style={{ background: getAvatarColor(r.defendantUser.name) }}
            >
              {getInitials(r.defendantUser.name)}
            </div>
            <span className={styles.juryName}>{r.defendantUser.name}</span>
            {r.mark ? (
              <span className={styles.mark}>{r.mark}</span>
            ) : (
              <span className={styles.noReview}>
                {r.state === PeerReviewState.NotReviewed ? 'Ожидание' : '—'}
              </span>
            )}
          </div>
        ))}
      </div>
      {(() => {
        const marks = reviews
          .map((r: PeerReviewAssignmentDto) => r.mark)
          .filter((m): m is string => m != null)
          .map(Number)
          .filter((n) => !isNaN(n));
        if (marks.length === 0) return null;
        const avg = marks.reduce((a, b) => a + b, 0) / marks.length;
        return (
          <div className={styles.average}>
            Средний балл: <strong>{parseFloat(avg.toFixed(2))}</strong>
          </div>
        );
      })()}

      {selectedReviewAssignmentId != null && (
        <ReviewDetailModal
          peerReviewAssignmentId={selectedReviewAssignmentId}
          onClose={() => setSelectedReviewAssignmentId(null)}
        />
      )}
    </div>
  );
};

type ModalProps = {
  peerReviewAssignmentId: number;
  onClose: () => void;
};

const ReviewDetailModal: React.FC<ModalProps> = ({ peerReviewAssignmentId, onClose }) => {
  const { data: review, isLoading, isError } = useGetReviewQuery(
    peerReviewAssignmentId,
    { throwOnError: false, retry: false },
  );

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Детали проверки</span>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>

        {isLoading && <div className={styles.loading}>Загрузка...</div>}

        {isError && (
          <div className={styles.loading}>Проверка не найдена или была удалена.</div>
        )}

        {review && (
          <>
            {review.jury && (
              <div className={styles.modalSection}>
                <div className={styles.modalLabel}>Жюри</div>
                <div className={styles.modalValue}>{review.jury.name}</div>
              </div>
            )}

            <div className={styles.modalSection}>
              <div className={styles.modalLabel}>Оценка</div>
              <div className={styles.modalMark}>{review.mark}</div>
            </div>

            {review.comment && (
              <div className={styles.modalSection}>
                <div className={styles.modalLabel}>Комментарий</div>
                <div className={styles.modalValue}>{review.comment}</div>
              </div>
            )}

            <div className={styles.modalSection}>
              <div className={styles.modalLabel}>Дата проверки</div>
              <div className={styles.modalValue}>
                {new Date(review.submittedAtUTC).toLocaleString('ru-RU')}
              </div>
            </div>

            {review.evaluations.length > 0 && (
              <div className={styles.modalSection}>
                <div className={styles.modalLabel}>Критерии</div>
                {review.evaluations.map((ev: CriteriaEvaluationDto) => (
                  <div key={ev.id} className={styles.evaluationItem}>
                    <div className={styles.evaluationRow}>
                      <span className={styles.evaluationCriteria}>{ev.criteriaDescription}</span>
                      <span className={styles.evaluationValue}>
                        {ev.value === 'true' ? '✅' : ev.value === 'false' ? '❌' : ev.value}
                      </span>
                    </div>
                    {ev.note && <div className={styles.evaluationNote}>{ev.note}</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
