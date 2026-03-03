import React from 'react';
import { Link } from 'react-router';
import { Card, CardActionArea, CardContent, Typography } from '@mui/material';

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
  const date = new Date(createdAt);
  const formattedDate = isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(date);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        width: 300,
        height: 200,
      }}
    >
      <CardActionArea component={Link} to={`/courses/${id}`}>
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            width: 300,
            height: 200,
          }}
        >
          <Typography
            variant="h6"
            fontWeight={600}
            data-test-id="CourseListItem-title"
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            data-test-id="CourseListItem-description"
            data-clamp="true"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </Typography>
          <Typography
            variant="caption"
            color="text.disabled"
            data-test-id="CourseListItem-date"
          >
            {formattedDate}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
