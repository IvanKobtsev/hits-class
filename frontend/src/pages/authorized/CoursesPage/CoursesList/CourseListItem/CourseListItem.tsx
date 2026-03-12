import React from 'react';
import { Link } from 'react-router';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
} from '@mui/material';
import styles from './CourseListItem.module.scss';
import { clsx } from 'clsx';
import { Links } from 'application/constants/links';
import { DelAndEditCourseButtons } from 'components/functionality-parts/DelAndEditCourseButtons/DelAndEditCourseButtons';

type Props = {
  id: number;
  title: string;
  description: string;
};

const getColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const h = Math.abs(hash) % 360;

  return `hsl(${h}, 80%, 80%)`;
};

export const CourseListItem: React.FC<Props> = ({ id, title, description }) => {
  return (
    <Card variant="outlined" className={styles.card}>
      <Box sx={{ position: 'relative' }}>
        <CardActionArea
          component={Link}
          to={Links.Authorized.CourseRoutes.link({ courseId: id })}
        >
          <Box sx={{ height: 80, bgcolor: getColor(title) }} />
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
        
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <DelAndEditCourseButtons courseId={id} />
        </Box>

      </Box>
    </Card>
  );
};
