import AssignmentIcon from 'assets/icons/list-ul.svg?react';
import { LexicalViewer } from 'components/lexical/LexicalViewer';
import { AssignmentPayload, PublicationDto, SubmissionDto } from 'services/api/api-client.types';
import styles from './AssignmentView.module.scss';

function formatDateUTC(date: Date): string {
  const d = String(date.getUTCDate()).padStart(2, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const y = date.getUTCFullYear();
  return `${d}.${m}.${y}`;
}

function formatDateTimeUTC(date: Date): string {
  const h = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  return `${formatDateUTC(date)} ${h}:${min}`;
}

export type AssignmentViewProps = {
  assignment: PublicationDto;
  submission?: SubmissionDto | null;
};

export const AssignmentView = ({ assignment, submission }: AssignmentViewProps) => {
  const { content, author, createdAtUTC } = assignment;
  const { title, deadlineUtc } = assignment.publicationPayload as AssignmentPayload;

  return (
    <div className={styles.container}>
      <div className={styles.banner}>
        <div className={styles.bannerTop}>
          <div className={styles.iconWrapper}>
            <AssignmentIcon />
          </div>
          <h1 className={styles.title} data-test-id="AssignmentView-title">
            {title}
          </h1>
        </div>

        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>Автор:</span>
            <span
              className={styles.metaValue}
              data-test-id="AssignmentView-author"
            >
              {author.legalName}
            </span>
          </span>

          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>Опубликовано:</span>
            <span
              className={styles.metaValue}
              data-test-id="AssignmentView-publication-date"
            >
              {formatDateUTC(createdAtUTC)}
            </span>
          </span>

          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>Срок сдачи:</span>
            <span
              className={styles.metaValue}
              data-test-id="AssignmentView-deadline"
            >
              {deadlineUtc ? formatDateTimeUTC(deadlineUtc) : 'Не указан'}
            </span>
          </span>
        </div>
      </div>

      <div className={styles.body}>
        {content != null && (
          <div
            className={styles.description}
            data-test-id="AssignmentView-description"
          >
            <LexicalViewer lexicalState={content} />
          </div>
        )}

        {submission?.mark != null && (
          <div className={styles.markBadge} data-test-id="AssignmentView-mark">
            <span className={styles.markLabel}>Оценка:</span>
            {submission.mark}
          </div>
        )}
      </div>
    </div>
  );
};
