import React from 'react';
import styles from './PublicationList.module.scss';
import { Box, Typography } from '@mui/material';
import { PublicationListItem } from './PublicationListItem/PublicationListItem';
import { PublicationDto } from 'services/api/api-client.types';

interface PublicationListProps {
  publications: PublicationDto[];
}

export const PublicationList: React.FC<PublicationListProps> = ({ publications }) => {
  if (publications.length === 0) {
    return (
      <Box className={styles.emptyState}>
        <Typography variant="body1" color="text.secondary">
          Здесь пока нет публикаций
        </Typography>
      </Box>
    );
  }

  publications = publications.sort((a, b) => new Date(b.createdAtUTC).getTime() - new Date(a.createdAtUTC).getTime());

  return (
    <Box className={styles.container}>
      <Box className={styles.list}>
        {publications.map((publication) => (
          <PublicationListItem key={publication.id} {...publication} />
        ))}
      </Box>
    </Box>
  );
};