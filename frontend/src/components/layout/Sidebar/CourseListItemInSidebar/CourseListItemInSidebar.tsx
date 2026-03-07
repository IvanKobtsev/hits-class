import { CourseListItemDto } from 'services/api/api-client.types';

export type CourseListItemInSidebarProps = {
  course: CourseListItemDto;
};

export const CourseListItemInSidebar: React.FC<CourseListItemInSidebarProps> = (
  props: CourseListItemInSidebarProps,
) => <div></div>;
