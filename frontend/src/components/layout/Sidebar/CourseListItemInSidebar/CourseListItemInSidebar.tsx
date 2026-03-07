import React from 'react';
import { Link } from 'react-router';
import { CourseListItemDto } from 'services/api/api-client.types';

export type CourseListItemInSidebarProps = {
  course: CourseListItemDto;
};

export const CourseListItemInSidebar: React.FC<CourseListItemInSidebarProps> = ({
  course,
}) => (
  <Link to={`/course/${course.id}`}>{course.title}</Link>
);
