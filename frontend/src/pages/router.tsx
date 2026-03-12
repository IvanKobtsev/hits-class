import { createBrowserRouter } from 'react-router-dom';
import { RootPage } from './authorized/RootPage';
import { Links } from 'application/constants/links';
import { ReactRouterErrorBoundary } from './ReactRouterErrorBoundary';
import { UseCookieAuth } from 'helpers/auth/auth-settings';
import { LoginPage } from './unauthorized/LoginPage/LoginPage';
import { ServerSideLoginPage } from './unauthorized/LoginPage/ServerSideLoginPage';
import { CoursesPage } from './authorized/CoursesPage/CoursesPage';
import { CoursesRoutes } from './authorized/CoursesPage/CoursesRoutes';
import { AssignmentPage } from './authorized/AssignmentPage/AssignmentPage';
import { OneCoursePage } from './authorized/OneCoursePage/OneCoursePage';
import { EmailConfirmPage } from './unauthorized/EmailConfirmPage/EmailConfirmPage';
import { PageNotFound } from './authorized/PageNotFound/PageNotFound';

export const authorizedRoutes = () =>
  createBrowserRouter([
    {
      path: '/',
      element: <RootPage />,
      children: [
        {
          path: Links.Authorized.Dashboard.route,
          element: <CoursesPage />,
        },
        {
          path: Links.Authorized.Courses.route,
          element: <CoursesPage />,
        },
        {
          path: '*',
          element: <PageNotFound />,
        },
        {
          path: Links.Authorized.CourseRoutes.route,
          element: <CoursesRoutes />,
          children: [
            {
              index: true,
              element: <OneCoursePage />,
            },
            {
              path: Links.Authorized.CourseNotFound.route,
              element: <div>Course not found</div>,
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
    {
      path: Links.Unauthorized.ConfirmEmail.route,
      element: <EmailConfirmPage />,
    },
  ]);
