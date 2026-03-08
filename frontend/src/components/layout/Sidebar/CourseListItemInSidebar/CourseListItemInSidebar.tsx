import React from 'react';
import { Link } from 'react-router';
import { CourseListItemDto } from 'services/api/api-client.types';
import styles from './CourseListItemInSidebar.module.scss';

const COLOR_COUNT = 7;

export type CourseListItemInSidebarProps = {
  course: CourseListItemDto;
};

export const CourseListItemInSidebar: React.FC<CourseListItemInSidebarProps> = ({
  course,
}) => (
  <Link to={`/course/${course.id}`} className={styles.item}>
    <span
      className={styles.avatar}
      data-color-index={course.id % COLOR_COUNT}
    >
      {course.title[0].toUpperCase()}
    </span>
    <span className={styles.title}>{course.title}</span>
  </Link>
);
