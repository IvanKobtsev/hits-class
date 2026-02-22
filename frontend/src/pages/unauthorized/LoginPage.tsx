import React, { useState } from 'react';
import styles from './LoginPage.module.scss';
import { useScopedTranslation } from 'application/localization/useScopedTranslation';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

type ActiveForm = 'login' | 'register';

export const LoginPage: React.FC = () => {
  const [activeForm, setActiveForm] = useState<ActiveForm>('login');
  const i18n = useScopedTranslation('Page.Login');
  return (
    <div className={styles.root}>
      <div className={styles.gridContainer}>
        <div className={styles.mainBackground}></div>
        <div className={styles.appName}>{i18n.t('app_name')}</div>
        <div className={styles.loginContainer} data-test-id={'login-container'}>
          {activeForm === 'login' ? (
            <LoginForm onSwitchToRegister={() => setActiveForm('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setActiveForm('login')} />
          )}
        </div>
      </div>
    </div>
  );
};
