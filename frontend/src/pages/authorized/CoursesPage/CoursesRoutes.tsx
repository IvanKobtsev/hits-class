import { Navigate, Outlet, useParams } from 'react-router-dom';

export function CoursesRoutes() {
  const { courseId } = useParams();

  if (!courseId || !/^\d+$/.test(courseId)) {
    return <Navigate to="page-not-found" replace />;
  }

  return <Outlet />;
}
