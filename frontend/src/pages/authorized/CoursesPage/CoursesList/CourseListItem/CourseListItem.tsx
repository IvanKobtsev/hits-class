import React from 'react';
import { Link } from 'react-router';
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
  const formattedDate = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(createdAt));

  return (
    <Link to={`/courses/${id}`} className={styles.card}>
      <div className={styles.content}>
        <h3 data-testid="CourseListItem-title" className={styles.title}>
          {title}
        </h3>
        <p
          data-testid="CourseListItem-description"
          className={styles.description}
        >
          {description}
        </p>
      </div>
      <span data-testid="CourseListItem-date" className={styles.date}>
        {formattedDate}
      </span>
    </Link>
  );
};
