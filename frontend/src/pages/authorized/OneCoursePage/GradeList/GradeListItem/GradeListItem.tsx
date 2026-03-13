import React from 'react';
import { Box, Card, CardActionArea, CardContent, Chip, Typography } from '@mui/material';
import { AssignmentPayload, PublicationDto, SubmissionState } from 'services/api/api-client.types';
import { useGetMySubmissionQuery } from 'services/api/api-client/SubmissionQuery';
import { Link } from 'react-router';
import styles from './GradeListItem.module.scss';

const formatDate = (date: Date | string) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};

const formatDateTime = (date: Date | string) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
};

const stateLabel: Record<SubmissionState, string> = {
  [SubmissionState.Draft]: 'Черновик',
  [SubmissionState.Submitted]: 'Сдано',
  [SubmissionState.Accepted]: 'Принято',
};

const stateColor: Record<SubmissionState, 'default' | 'warning' | 'success'> = {
  [SubmissionState.Draft]: 'default',
  [SubmissionState.Submitted]: 'warning',
  [SubmissionState.Accepted]: 'success',
};

export function getOverdueStatus(
  deadlineUtc: Date | null | undefined,
  lastSubmittedAtUTC: Date | null | undefined,
): 'on_time' | 'overdue' | 'no_deadline' {
  if (!deadlineUtc) return 'no_deadline';

  const deadline = new Date(deadlineUtc);

  if (!lastSubmittedAtUTC) {
    return new Date() > deadline ? 'overdue' : 'on_time';
  }

  return new Date(lastSubmittedAtUTC) > deadline ? 'overdue' : 'on_time';
}

interface GradeListItemProps {
  publication: PublicationDto;
}

export const GradeListItem: React.FC<GradeListItemProps> = ({ publication }) => {
  const { id, publicationPayload, createdAtUTC } = publication;
  const assignmentData = publicationPayload as AssignmentPayload;

  const { data: submission } = useGetMySubmissionQuery(id, {
    retry: false,
  });

  const overdueStatus = getOverdueStatus(
    assignmentData?.deadlineUtc,
    submission?.lastSubmittedAtUTC,
  );
  const isOverdue = overdueStatus === 'overdue';

  const link = `assignments/${id}`;

  return (
    <Card variant="outlined" className={styles.card} data-test-id={`GradeItem-${id}`}>
      <CardActionArea component={Link} to={link} data-test-id={`GradeItem-action-area-${id}`}>
        <CardContent>
          <Box className={styles.content}>
            <Box className={styles.info}>
              <Typography
                variant="subtitle1"
                fontWeight={500}
                noWrap
                data-test-id={`GradeItem-title-${id}`}
              >
                {assignmentData?.title || 'Без названия'}
              </Typography>

              <Typography variant="caption" color="text.secondary" data-test-id={`GradeItem-date-${id}`}>
                {formatDate(createdAtUTC)}
              </Typography>

              {assignmentData?.deadlineUtc && (
                <Typography
                  variant="caption"
                  component="div"
                  color={isOverdue ? 'error' : 'text.secondary'}
                  data-test-id={`GradeItem-deadline-${id}`}
                >
                  {'Срок: '}{formatDateTime(assignmentData.deadlineUtc)}
                </Typography>
              )}

              {submission?.lastSubmittedAtUTC && (
                <Typography
                  variant="caption"
                  component="div"
                  color={isOverdue ? 'error' : 'text.secondary'}
                  data-test-id={`GradeItem-submitted-at-${id}`}
                >
                  {'Сдано: '}{formatDateTime(submission.lastSubmittedAtUTC)}
                </Typography>
              )}
            </Box>

            <Box className={styles.chips}>
              {isOverdue && (
                <Chip
                  label="Просрочено"
                  color="error"
                  size="small"
                  data-test-id={`GradeItem-overdue-${id}`}
                />
              )}

              {submission ? (
                <>
                  <Chip
                    label={stateLabel[submission.state]}
                    color={stateColor[submission.state]}
                    size="small"
                    data-test-id={`GradeItem-state-${id}`}
                  />
                  {submission.mark !== null && (
                    <Chip
                      label={`Оценка: ${submission.mark}`}
                      color="primary"
                      size="small"
                      variant="outlined"
                      data-test-id={`GradeItem-mark-${id}`}
                    />
                  )}
                </>
              ) : (
                <Chip
                  label="Не сдано"
                  color="default"
                  size="small"
                  data-test-id={`GradeItem-not-submitted-${id}`}
                />
              )}
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};