import React from 'react';
import styles from './AttachmentsList.module.scss';
import { Box, Typography, List } from '@mui/material';
import { Attachment } from 'services/api/api-client.types';
import { AttachmentButton } from './AttachmentButton/AttachmentButton';

interface AttachmentsListProps {
  attachments: Attachment[];
  onError: (error: string) => void;
  'data-test-id'?: string;
}

export const AttachmentsList: React.FC<AttachmentsListProps> = ({
  attachments,
  onError,
  'data-test-id': dataTestId,
}) => {
  if (attachments == null || attachments.length === 0) return null;

  return (
    <Box className={styles.attachments} data-test-id={dataTestId}>
      <Typography 
        className={styles.attachmentsTitle}
        data-test-id={dataTestId ? `${dataTestId}-title` : undefined}
      >
        Прикрепленные файлы ({attachments.length}):
      </Typography>
      <List 
        disablePadding 
        className={styles.attachmentsList}
        data-test-id={dataTestId ? `${dataTestId}-list` : undefined}
      >
        {attachments.map((file, index) => (
          <AttachmentButton
            key={file.uuid}
            file={file}
            onError={onError}
            data-test-id={dataTestId ? `${dataTestId}-button-${index}` : undefined}
          />
        ))}
      </List>
    </Box>
  );
};