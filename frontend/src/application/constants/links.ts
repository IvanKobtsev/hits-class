import {
  createRoute,
  RequiredNumberParam,
  RequiredStringParam,
} from 'react-router-url-params';

export const Links = {
  Unauthorized: {
    Login: createRoute('/login'),
    ConfirmEmail: createRoute('/confirm-email/:userId', {
      userId: RequiredStringParam,
    }),
  },
  Authorized: {
    Dashboard: createRoute('/'),
    CourseRoutes: createRoute('/courses/:courseId'),
    CourseNotFound: createRoute('/courses/:courseId/not-found', {
      courseId: RequiredNumberParam,
    }),
    CourseAccessDenied: createRoute('/courses/:courseId/access-denied', {
      courseId: RequiredNumberParam,
    }),
    AssignmentRoutes: createRoute(
      '/courses/:courseId/assignments/:assignmentId',
    ),
    Products: createRoute('/products'),
    ProductDetails: createRoute('/products/:id', {
      id: RequiredNumberParam,
    }),
    CreateProduct: createRoute('/products/create'),
    EditProduct: createRoute('/products/:id/edit', {
      id: RequiredNumberParam,
    }),
    UiKit: createRoute('/uikit'),
    Courses: createRoute('/courses'),
  },
};
