import React from 'react';
import { Link } from 'react-router';
import { Card, CardActionArea, CardContent, Typography } from '@mui/material';
import styles from './CourseListItem.module.scss';

type Props = {
  id: number;
  title: string;
  description: string;
};

export const CourseListItem: React.FC<Props> = ({
  id,
  title,
  description,
}) => {

  return (
    <Card variant="outlined" className={styles.card}>
      <CardActionArea component={Link} to={`/courses/${id}`}>
        <CardContent className={styles.content}>
          <Typography
            variant="h6"
            fontWeight={600}
            data-test-id={`CourseListItem-title-${id}`}
            className={clsx(styles.title, styles.shortened_title)}
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            data-test-id={`CourseListItem-description-${id}`}
            data-clamp="true"
            className={clsx(styles.description, styles.shortened_description)}
          >
            {description}
          </Typography>

        </CardContent>
      </CardActionArea>
    </Card>
  );
};
