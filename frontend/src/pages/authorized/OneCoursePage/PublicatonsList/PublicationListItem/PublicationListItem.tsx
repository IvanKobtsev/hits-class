import React from 'react';
import styles from './PublicationListItem.module.scss';
import AnnouncementIcon from 'assets/icons/announcement.svg?react';
import AssignmentIcon from 'assets/icons/assignment.svg?react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  CardActionArea,
} from '@mui/material';
import {
  PublicationDto,
  PublicationType,
  AssignmentPayload,
} from 'services/api/api-client.types';
import { clsx } from 'clsx';
import { AttachmentsList } from './AttachmentsList/AttachmentsList';
import { Link } from 'react-router';

const formatDate = (date: Date | string) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};

export const PublicationListItem: React.FC<PublicationDto> = ({
  id,
  type,
  createdAtUTC,
  lastUpdatedAtUTC,
  content,
  author,
  attachments = [],
  publicationPayload,
}) => {
  const isAssignment = type === PublicationType.Assignment;

  const assignmentData = isAssignment
    ? (publicationPayload as AssignmentPayload)
    : null;

  const hasUpdates =
    lastUpdatedAtUTC &&
    formatDate(createdAtUTC) !== formatDate(lastUpdatedAtUTC);

  const link = `/${isAssignment ? 'assignment' : 'announcement'}/${id}`;

  return (
    <>
      <Card variant="outlined" className={styles.card} data-test-id={`PublicationItem-${id}`} >
        <CardActionArea
          component={Link}
          to={link}
          className={styles.actionArea}
          data-test-id={`PublicationItem-action-area-${id}`}
        >
          <CardContent className={styles.content} data-test-id={`PublicationItem-content-container-${id}`}>
            <Box className={styles.header} data-test-id={`PublicationItem-header-${id}`}>
              <Avatar
                data-test-id={`PublicationItem-type-icon-${id}`}
                className={clsx(
                  styles.typeIcon,
                  isAssignment
                    ? styles.typeIconAssignment
                    : styles.typeIconAnnouncement,
                )}
              >
                {isAssignment ? <AssignmentIcon /> : <AnnouncementIcon />}
              </Avatar>

              <Box data-test-id={`PublicationItem-author-container-${id}`}>
                <Typography 
                  className={styles.authorName}
                  data-test-id={`PublicationItem-author-${id}`}
                >
                  {author.legalName}
                </Typography>
                <Typography 
                  variant="caption" 
                  className={styles.date}
                  data-test-id={`PublicationItem-date-${id}`}
                >
                  {formatDate(createdAtUTC)}
                  {hasUpdates && (
                    <Typography 
                      variant="caption" 
                      component="span"
                      data-test-id={`PublicationItem-updated-date-${id}`}
                    >
                      &nbsp;(ред. {formatDate(lastUpdatedAtUTC!)})
                    </Typography>
                  )}
                </Typography>
              </Box>
            </Box>

            {assignmentData?.title && (
              <Typography 
                className={styles.assignmentTitle}
                data-test-id={`PublicationItem-title-${id}`}
              >
                {assignmentData.title}
              </Typography>
            )}

            {content && (
              <Typography 
                className={styles.contentText}
                data-test-id={`PublicationItem-content-${id}`}
              >
                {content}
              </Typography>
            )}

            <AttachmentsList
              attachments={attachments}
              onError={(error) => console.error('File download error:', error)}
              data-test-id={`AttachmentsList-${id}`}
            />

            {assignmentData?.deadlineUtc && (
              <Box 
                className={styles.deadlineSection}
                data-test-id={`PublicationItem-deadline-section-${id}`}
              >
                <Chip
                  label={`Срок сдачи: ${formatDate(assignmentData.deadlineUtc)}`}
                  className={styles.deadlineChip}
                  data-test-id={`PublicationItem-deadline-chip-${id}`}
                />
              </Box>
            )}
          </CardContent>
        </CardActionArea>
      </Card>
    </>
  );
};