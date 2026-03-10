import React, { useState } from 'react';
import styles from './AttachmentButton.module.scss';
import AttachmentIcon from 'assets/icons/attachment.svg?react';
import { ListItem, ListItemIcon, CircularProgress } from '@mui/material';
import { Attachment } from 'services/api/api-client.types';
import { downloadFile } from 'services/api/api-client/FilesClient';

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
  return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
};

interface AttachmentButtonProps {
  file: Attachment;
  onError: (error: string) => void;
  'data-test-id'?: string;
}

export const AttachmentButton: React.FC<AttachmentButtonProps> = ({
  file,
  onError,
  'data-test-id': dataTestId,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      const response = await downloadFile(file.uuid);
      const url = window.URL.createObjectURL(response.data);

      const link = document.createElement('a');
      link.href = url;
      link.download = response.fileName || file.fileName;
      link.click();

      window.URL.revokeObjectURL(url);
      link.remove();
    } catch {
      onError('Не удалось скачать файл. Попробуйте позже.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <ListItem
      disablePadding
      className={styles.attachmentItem}
      component="button"
      onClick={(e) => {
        e.stopPropagation();
        void handleDownload();
      }}
      disabled={isDownloading}
      data-test-id={dataTestId}
    >
      <ListItemIcon
        className={styles.attachmentIcon}
        data-test-id={dataTestId ? `${dataTestId}-icon` : undefined}
      >
        {isDownloading ? (
          <CircularProgress
            size={16}
            data-test-id={dataTestId ? `${dataTestId}-progress` : undefined}
          />
        ) : (
          <AttachmentIcon
            data-test-id={dataTestId ? `${dataTestId}-svg` : undefined}
          />
        )}
      </ListItemIcon>

      <div className={styles.textContainer}>
        <span
          className={styles.fileName}
          data-test-id={dataTestId ? `${dataTestId}-name` : undefined}
        >
          {file.fileName}
        </span>
        <span
          className={styles.fileSize}
          data-test-id={dataTestId ? `${dataTestId}-size` : undefined}
        >
          {formatFileSize(file.size)}
        </span>
      </div>
    </ListItem>
  );
};
