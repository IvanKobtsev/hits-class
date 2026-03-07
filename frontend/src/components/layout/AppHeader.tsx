import React from 'react';
import { Link, useLocation } from 'react-router';
import { useMediaQuery } from '@mui/material';
import { useScopedTranslation } from 'application/localization/useScopedTranslation';
import { useSidebar } from './SidebarContext';
import styles from './AppHeader.module.scss';
import { QueryFactory } from 'services/api';
import { Avatar } from 'components/uikit/avatar/Avatar';

export const AppHeader: React.FC = () => {
  const i18n = useScopedTranslation('AppHeader');
  const { isExpanded, toggle } = useSidebar();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 600px)');

  const isCoursesPage = location.pathname === '/courses';
  const showBreadcrumbs = !isMobile || isCoursesPage;
  const showAvatar = !isMobile || isCoursesPage;

  const userQuery = QueryFactory.UserQuery.useGetCurrentUserInfoQuery();
  const user = userQuery.data;

  return (
    <header data-test-id="app-header" className={styles.header}>
      <div className={styles.left}>
        <button
          data-test-id="app-header-sidebar-toggle"
          aria-expanded={isExpanded}
          onClick={toggle}
          className={styles.menuButton}
          type="button"
        >
          ☰
        </button>
        <Link
          to="/courses"
          data-test-id="app-header-hitsclass-button"
          className={styles.logoButton}
        >
          {i18n.t('hitsclass_button')}
        </Link>
      </div>

      {showBreadcrumbs && (
        <nav
          data-test-id="app-header-breadcrumbs"
          className={styles.breadcrumbs}
        >
          {isCoursesPage && <span>Courses</span>}
        </nav>
      )}

      {showAvatar && <Avatar user={user} />}
    </header>
  );
};
