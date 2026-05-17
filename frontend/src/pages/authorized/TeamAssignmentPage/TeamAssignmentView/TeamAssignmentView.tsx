import TeamAssignmentIcon from 'assets/icons/team-assignment.svg?react';
import { LexicalViewer } from 'components/lexical/LexicalViewer';
import {
  AssignmentPayload,
  BonusType,
  PublicationDto,
  SubmissionDto,
  MarkType,
} from 'services/api/api-client.types';
import { AttachmentsList } from 'pages/authorized/OneCoursePage/PublicatonsList/PublicationListItem/AttachmentsList/AttachmentsList';
import styles from './TeamAssignmentView.module.scss';

function formatDateUTC(date: Date): string {
  const d = String(date.getUTCDate()).padStart(2, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const y = date.getUTCFullYear();
  return `${d}.${m}.${y}`;
}

function formatDateTimeLocal(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export type AssignmentViewProps = {
  assignment: PublicationDto;
  submission?: SubmissionDto | null;
};

export const TeamAssignmentView = ({
  assignment,
  submission,
}: AssignmentViewProps) => {
  const { content, author, createdAtUTC: createdAtUTCRaw } = assignment;
  const createdAtUTC = new Date(createdAtUTCRaw);
  const { title, deadlineUtc: deadlineUtcRaw, markType, minMark, maxMark, deadlineCriteria } =
    assignment.publicationPayload as AssignmentPayload;
  const deadlineUtc = deadlineUtcRaw ? new Date(deadlineUtcRaw) : null;

  return (
    <div className={styles.container}>
      <div className={styles.banner}>
        <div className={styles.bannerTop}>
          <div className={styles.iconWrapper}>
            <TeamAssignmentIcon />
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
              {deadlineUtc ? formatDateTimeLocal(deadlineUtc) : 'Не указан'}
            </span>
          </span>

          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>Тип оценки:</span>
            <span
              className={styles.metaValue}
              data-test-id="AssignmentView-markType"
            >
              {markType == MarkType.Score ? 'Числовая' : 'Зачет'}
            </span>
          </span>

          {markType === MarkType.Score && (
            <span className={styles.metaItem}>
              <span className={styles.metaLabel}>Минимальная оценка:</span>
              <span
                className={styles.metaValue}
                data-test-id="AssignmentView-minMark"
              >
                {minMark ? minMark : 'Не указана'}
              </span>
            </span>
          )}

          {markType === MarkType.Score && (
            <span className={styles.metaItem}>
              <span className={styles.metaLabel}>Максимальная оценка:</span>
              <span
                className={styles.metaValue}
                data-test-id="AssignmentView-maxMark"
              >
                {maxMark ? maxMark : 'Не указана'}
              </span>
            </span>
          )}

          {deadlineCriteria?.earlyBonus && (
            <span className={styles.metaItem}>
              <span className={styles.metaLabel}>Бонус за раннюю сдачу:</span>
              <span className={styles.metaValue}>
                до {formatDateTimeLocal(new Date(deadlineCriteria.earlyBonus.earliestDate))},{' '}
                +{deadlineCriteria.earlyBonus.bonusValue}{' '}
                {deadlineCriteria.earlyBonus.bonusType === BonusType.Score ? 'балл(ов)' : '×'}
              </span>
            </span>
          )}

          {deadlineCriteria?.latePenalty && (
            <span className={styles.metaItem}>
              <span className={styles.metaLabel}>Штраф за опоздание:</span>
              <span className={styles.metaValue}>
                последний срок {formatDateTimeLocal(new Date(deadlineCriteria.latePenalty.latestDate))}
              </span>
            </span>
          )}
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

        {assignment.attachments != null &&
          assignment.attachments.length > 0 && (
            <AttachmentsList
              attachments={assignment.attachments}
              onError={(error) => console.error('File download error:', error)}
              data-test-id="AssignmentView-attachments"
            />
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
