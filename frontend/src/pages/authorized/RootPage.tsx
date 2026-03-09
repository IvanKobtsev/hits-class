import React from 'react';
import { Outlet } from 'react-router';
import styles from './RootPage.module.scss';
import { ModalProvider } from 'components/uikit/modal/useModal.tsx';
import { AppHeader } from 'components/layout/Header/AppHeader';
import { SidebarProvider } from 'components/layout/Sidebar/SidebarContext';
import { Sidebar } from 'components/layout/Sidebar/Sidebar';

export const RootPage: React.FC = () => {
  return (
    <ModalProvider>
      <SidebarProvider>
        <div className={styles.container} data-test-id="main-page-container">
          <AppHeader />
          <div className={styles.content}>
            <Sidebar />
            <main className={styles.main}>
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ModalProvider>
  );
};
