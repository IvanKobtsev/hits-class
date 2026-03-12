import React from 'react';
import { Typography } from '@mui/material';
import { CourseListItem } from './CourseListItem/CourseListItem';
import { Loading } from 'components/uikit/suspense/Loading';
import {
  GetMyCoursesCourseQueryParameters,
  useGetMyCoursesQuery,
} from 'services/api/api-client/CourseQuery';
import styles from './CoursesList.module.scss';

type Props = GetMyCoursesCourseQueryParameters;

export const CoursesList: React.FC<Props> = (params) => {
  const { data, isLoading, isError } = useGetMyCoursesQuery(params);

  if (isError) {
    return (
      <Typography data-test-id="CoursesList-error" className={styles.error}>
        Не удалось загрузить курсы. Попробуйте позже.
      </Typography>
    );
  }

  return (
    <Loading loading={isLoading}>
      {data?.data.length === 0 ? (
        <Typography data-test-id="CoursesList-empty" className={styles.empty}>
          У вас пока нет курсов
        </Typography>
      ) : (
        <div className={styles.list}>
          {data?.data.map((course) => (
            <CourseListItem
              key={course.id}
              id={course.id}
              title={course.title}
              description={course.description}
            />
          ))}
        </div>
      )}
    </Loading>
  );
};
