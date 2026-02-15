import { createBrowserRouter } from 'react-router-dom';
import { ServerSideLoginPage } from './unauthorized/ServerSideLoginPage';
import { RootPage } from './authorized/RootPage';
import { Links } from 'application/constants/links';
import { ReactRouterErrorBoundary } from './ReactRouterErrorBoundary';
import { LoginPage } from './unauthorized/LoginPage';
import { UseCookieAuth } from 'helpers/auth/auth-settings';

export const authorizedRoutes = () =>
  createBrowserRouter([
    {
      path: '/',
      element: <RootPage />,
      children: [
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
