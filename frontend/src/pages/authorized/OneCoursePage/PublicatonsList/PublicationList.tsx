import React from 'react';
import styles from './PublicationList.module.scss';
import { Box, Typography } from '@mui/material';
import { PublicationListItem } from './PublicationListItem/PublicationListItem';
import { PublicationDto, PublicationType } from 'services/api/api-client.types';

export type PublicationTypeFilter = 'all' | PublicationType;

interface PublicationListProps {
  publications: PublicationDto[];
  filter: PublicationTypeFilter;
}

export const PublicationList: React.FC<PublicationListProps> = ({
  publications,
  filter,
}) => {
  if (publications.length === 0) {
    return (
      <Box className={styles.emptyState}>
        <Typography variant="body1" color="text.secondary">
          Здесь пока нет публикаций
        </Typography>
      </Box>
    );
  }

  publications = publications
    .filter((p) => filter === 'all' || p.type === filter)
    .sort(
      (a, b) =>
        new Date(b.createdAtUTC).getTime() - new Date(a.createdAtUTC).getTime(),
    );

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
