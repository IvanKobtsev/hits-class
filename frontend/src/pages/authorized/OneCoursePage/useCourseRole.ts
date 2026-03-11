import { CourseDto } from 'services/api/api-client';
import { QueryFactory } from 'services/api';

export type CourseRole = 'teacher' | 'student';

export function useCourseRole(course: CourseDto | undefined): CourseRole {
  const { data: currentUser } = QueryFactory.UserQuery.useGetCurrentUserInfoQuery();

  if (!course || !currentUser) return 'student';

  const isTeacher = course.teachers.some((t) => t.id === currentUser.id)
    || course.owner.id === currentUser.id;

  return isTeacher ? 'teacher' : 'student';
}