import React, { useState } from 'react';
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
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
} from '@mui/material';
import DotsIcon from 'assets/icons/dots.svg?react';
import { useQueryClient } from '@tanstack/react-query';
import {
  PublicationDto,
  PublicationType,
  AssignmentPayload,
} from 'services/api/api-client.types';
import { clsx } from 'clsx';
import { useModal } from 'components/uikit/modal/useModal';
import { useDeleteAnnouncementMutation } from 'services/api/api-client/AnnouncementQuery';
import { useDeleteAssignmentMutation } from 'services/api/api-client/AssignmentQuery';
import { useGetCurrentUserInfoQuery } from 'services/api/api-client/UserQuery';
import { AttachmentsList } from './AttachmentsList/AttachmentsList';
import { EditAnnouncementModal } from './EditAnnouncementModal/EditAnnouncementModal';
import { EditAssignmentModal } from './EditAssignmentModal/EditAssignmentModal';
import { EditTargetUsersModal } from './EditTargetUsersModal/EditTargetUsersModal';
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
  targetUserIds,
  publicationPayload,
}) => {
  const isAssignment = type === PublicationType.Assignment;

  const assignmentData = isAssignment
    ? (publicationPayload as AssignmentPayload)
    : null;

  const hasUpdates =
    lastUpdatedAtUTC &&
    formatDate(createdAtUTC) !== formatDate(lastUpdatedAtUTC);

  const link = `${isAssignment ? 'assignments' : 'announcements'}/${id}`;

  const modal = useModal();
  const queryClient = useQueryClient();
  const { mutateAsync: deleteAnnouncement } = useDeleteAnnouncementMutation(id);
  const { mutateAsync: deleteAssignment } = useDeleteAssignmentMutation(id);
  const { data: currentUser } = useGetCurrentUserInfoQuery();

  const canManagePublication =
    currentUser?.isTeacherSystemWide ||
    currentUser?.isAdmin ||
    currentUser?.id === author.id;

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTargetUsersModalOpen, setIsTargetUsersModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleEditClick = () => {
    handleMenuClose();
    setIsEditModalOpen(true);
  };

  const handleTargetUsersClick = () => {
    handleMenuClose();
    setIsTargetUsersModalOpen(true);
  };

  const handleDeleteClick = async () => {
    handleMenuClose();
    const confirmed = await modal.showConfirm({
      title: 'Удаление публикации',
      text: 'Вы уверены, что хотите удалить эту публикацию?',
      okButtonText: 'Удалить',
      cancelButtonText: 'Отмена',
    });
    if (!confirmed) return;
    try {
      if (isAssignment) {
        await deleteAssignment();
      } else {
        await deleteAnnouncement();
      }
      await queryClient.invalidateQueries({ queryKey: [] });
      showSnackbar('Успешно удалено');
    } catch {
      showSnackbar('Возникла ошибка при удалении');
    }
  };

  return (
    <>
      <Card variant="outlined" className={styles.card} data-test-id={`PublicationItem-${id}`} sx={{ position: 'relative' }}>
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

        {canManagePublication && (
          <>
            <IconButton
              data-test-id={`PublicationItem-menu-button-${id}`}
              onClick={handleMenuOpen}
              size="small"
              sx={{ position: 'absolute', top: 8, right: 8 }}
            >
              <DotsIcon width={16} height={16} />
            </IconButton>

            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleEditClick}>Редактировать</MenuItem>
              <MenuItem onClick={handleTargetUsersClick}>Изменить целевых пользователей</MenuItem>
              <MenuItem onClick={() => { void handleDeleteClick(); }}>Удалить</MenuItem>
            </Menu>
          </>
        )}

        {attachments && attachments.length > 0 && (
          <CardContent>
            <AttachmentsList
              attachments={attachments}
              onError={(error) => console.error('File download error:', error)}
              data-test-id={`AttachmentsList-${id}`}
            />
          </CardContent>
        )}
      </Card>

      {isEditModalOpen && !isAssignment && (
        <EditAnnouncementModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => showSnackbar('Объявление обновлено')}
          publicationId={id}
          initialContent={content ?? ''}
          initialAttachments={attachments ?? []}
        />
      )}
      {isEditModalOpen && isAssignment && (
        <EditAssignmentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => showSnackbar('Задание обновлено')}
          publicationId={id}
          initialTitle={assignmentData?.title ?? ''}
          initialContent={content ?? ''}
          initialDeadlineUtc={assignmentData?.deadlineUtc ? new Date(assignmentData.deadlineUtc) : null}
          initialAttachments={attachments ?? []}
        />
      )}
      {isTargetUsersModalOpen && (
        <EditTargetUsersModal
          isOpen={isTargetUsersModalOpen}
          onClose={() => setIsTargetUsersModalOpen(false)}
          onSuccess={() => showSnackbar('Успешно')}
          publicationId={id}
          publicationType={type}
          initialTargetUserIds={targetUserIds ?? []}
        />
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </>
  );
};
