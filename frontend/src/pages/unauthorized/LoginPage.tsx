import React, { useState } from 'react';
import { Button } from 'components/uikit/buttons/Button';
import styles from './LoginPage.module.scss';
import { useScopedTranslation } from 'application/localization/useScopedTranslation';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export const LoginPage: React.FC = () => {
  const [isRegistration, setIsRegistration] = useState(false);
  const i18n = useScopedTranslation('Page.LoginPage');
  return (
    <div className={styles.root}>
      <div className={styles.gridContainer}>
        <div className={styles.mainBackground}></div>
        <div className={styles.appName}>{i18n.t('app_name')}</div>
        <div className={styles.loginContainer} data-test-id={'login-container'}>
          {isRegistration ? <RegisterForm /> : <LoginForm />}
          <div className={styles.switchSection}>
            <span className={styles.switchText}>
              {isRegistration
                ? i18n.t('have_account_text')
                : i18n.t('no_account_text')}
            </span>
            <Button
              className={styles.switchButton}
              title={
                isRegistration
                  ? i18n.t('go_to_login_button')
                  : i18n.t('create_account_button')
              }
              onClick={() => setIsRegistration(!isRegistration)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
