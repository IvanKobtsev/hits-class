import { createBrowserRouter } from 'react-router-dom';
import { RootPage } from './authorized/RootPage';
import { Links } from 'application/constants/links';
import { ReactRouterErrorBoundary } from './ReactRouterErrorBoundary';
import { UseCookieAuth } from 'helpers/auth/auth-settings';
import { LoginPage } from './unauthorized/LoginPage/LoginPage';
import { ServerSideLoginPage } from './unauthorized/LoginPage/ServerSideLoginPage';
import { CoursesPage } from './authorized/CoursesPage/CoursesPage';
import { CoursesRoutes } from './authorized/CoursesPage/CoursesRoutes';
import { PageNotFound } from './authorized/errorPages/PageNotFound';
import { AssignmentPage } from './authorized/AssignmentPage/AssignmentPage';

export const authorizedRoutes = () =>
  createBrowserRouter([
    {
      path: '/',
      element: <RootPage />,
      children: [
        {
          path: Links.Authorized.Courses.route,
          element: <CoursesPage />,
        },
        {
          path: Links.Authorized.CourseRoutes.route,
          element: <CoursesRoutes />,
          children: [
            {
              path: Links.Authorized.CourseNotFound.route,
              element: <PageNotFound />,
            },
            {
              path: Links.Authorized.CourseAccessDenied.route,
              element: <div>Access denied</div>,
            },
            {
              path: Links.Authorized.AssignmentRoutes.route,
              element: <AssignmentPage />,
            },
          ],
        },
      ],
      ErrorBoundary: ReactRouterErrorBoundary,
    },
  ]);
export const anonymousRoutes = () =>
  createBrowserRouter([
    {
      path: '/*',
      element: UseCookieAuth ? <LoginPage /> : <ServerSideLoginPage />,
      ErrorBoundary: ReactRouterErrorBoundary,
    },
    {
      path: Links.Unauthorized.Login.route,
      element: <LoginPage />,
    },
  ]);
