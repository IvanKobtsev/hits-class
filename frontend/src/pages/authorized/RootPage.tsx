import React from 'react';
import { Outlet } from 'react-router';
import styles from './RootPage.module.scss';
import { ModalProvider } from 'components/uikit/modal/useModal.tsx';

export const RootPage: React.FC = () => {
  return (
    <ModalProvider>
      <div className={styles.container} data-test-id="main-page-container">
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </ModalProvider>
  );
};
