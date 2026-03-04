import React from 'react';
import { Link } from 'react-router';
import { Card, CardActionArea, CardContent, Typography } from '@mui/material';
import styles from './CourseListItem.module.scss';

type Props = {
  id: number;
  createdAt: string;
  title: string;
  description: string;
};

export const CourseListItem: React.FC<Props> = ({
  id,
  createdAt,
  title,
  description,
}) => {
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const formattedDate = isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(date);

  return (
    <Card variant="outlined" className={styles.card}>
      <CardActionArea component={Link} to={`/courses/${id}`}>
        <CardContent className={styles.content}>
          <Typography
            variant="h6"
            fontWeight={600}
            data-test-id={`CourseListItem-title-${id}`}
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            data-test-id={`CourseListItem-description-${id}`}
            data-clamp="true"
            className={styles.description}
          >
            {description}
          </Typography>
          <Typography
            variant="caption"
            color="text.disabled"
            data-test-id={`CourseListItem-date-${id}`}
          >
            {formattedDate}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
