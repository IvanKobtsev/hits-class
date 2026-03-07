import React from 'react';
import { Outlet } from 'react-router';
import styles from './RootPage.module.scss';
import { ModalProvider } from 'components/uikit/modal/useModal.tsx';
import { AppHeader } from 'components/layout/AppHeader';
import { SidebarProvider } from 'components/layout/SidebarContext';

export const RootPage: React.FC = () => {
  return (
    <ModalProvider>
      <SidebarProvider>
        <div className={styles.container} data-test-id="main-page-container">
          <div className={styles.content}>
            <AppHeader />
            <Outlet />
          </div>
        </div>
      </SidebarProvider>
    </ModalProvider>
  );
};
