import { createBrowserRouter } from 'react-router-dom';
import { RootPage } from './authorized/RootPage';
import { Links } from 'application/constants/links';
import { ReactRouterErrorBoundary } from './ReactRouterErrorBoundary';
import { UseCookieAuth } from 'helpers/auth/auth-settings';
import { LoginPage } from './unauthorized/LoginPage/LoginPage';
import { ServerSideLoginPage } from './unauthorized/LoginPage/ServerSideLoginPage';
import { SubmissionPanel } from './authorized/AssignmentPage/CreateSubmissionPanel/SubmissionPanel';
import { CoursesPage } from './authorized/CoursesPage/CoursesPage';

export const authorizedRoutes = () =>
  createBrowserRouter([
    {
      path: '/',
      element: <RootPage />,
      children: [
        {
          path: '/create-submission',
          element: <SubmissionPanel />,
        },
        {
          path: Links.Authorized.Courses.route,
          element: <CoursesPage />,
        }
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
