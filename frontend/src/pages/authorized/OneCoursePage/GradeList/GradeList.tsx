import React from 'react';
import { Box, Typography } from '@mui/material';
import { PublicationDto, PublicationType } from 'services/api/api-client.types';
import { GradeListItem } from './GradeListItem/GradeListItem';

interface GradeListProps {
  publications: PublicationDto[];
}

export const GradeList: React.FC<GradeListProps> = ({ publications }) => {
  const assignments = publications
    .filter((p) => p.type === PublicationType.Assignment)
    .slice()
    .sort((a, b) => new Date(b.createdAtUTC).getTime() - new Date(a.createdAtUTC).getTime());

  if (assignments.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          В этом курсе пока нет заданий
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {assignments.map((publication) => (
        <GradeListItem key={publication.id} publication={publication} />
      ))}
    </Box>
  );
};