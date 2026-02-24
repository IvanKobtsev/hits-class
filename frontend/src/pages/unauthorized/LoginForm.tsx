import React, { useState } from 'react';
import styles from './LoginForm.module.scss';
import { useScopedTranslation } from 'application/localization/useScopedTranslation';
import { Button } from 'components/uikit/buttons/Button';
import { Field } from 'components/uikit/Field';
import { Input } from 'components/uikit/inputs/Input';
import { useAdvancedForm } from 'helpers/form/useAdvancedForm';
import { requiredRule } from 'helpers/form/react-hook-form-helper';
import { FormError } from 'components/uikit/FormError';
import { Loading } from 'components/uikit/suspense/Loading';
import { handleLoginErrors, sendLoginRequest } from 'helpers/auth/auth-client';
import { queryClient } from 'services/api/query-client-helper';

type Form = {
  login: string;
  password: string;
};

export const LoginForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const i18n = useScopedTranslation('Page.LoginForm');
  const form = useAdvancedForm<Form>(async (data) => {
    setIsLoading(true);
    try {
      await sendLoginRequest(data.login, data.password.trim());
      await queryClient.resetQueries();
    } catch (e) {
      handleLoginErrors(e);
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <Loading loading={isLoading}>
      <form onSubmit={form.handleSubmitDefault}>
        <Field
          title={i18n.t('login_field')}
          className={styles.inputField}
          testId="Login"
        >
          <Input
            {...form.register('login', { ...requiredRule() })}
            errorText={form.formState.errors.login?.message}
          />
        </Field>
        <Field
          title={i18n.t('password_field')}
          className={styles.inputField}
          testId="Password"
        >
          <Input
            {...form.register('password', { ...requiredRule() })}
            type="password"
            errorText={form.formState.errors.password?.message}
          />
        </Field>
        <FormError>{form.overallError ? form.overallError : null}</FormError>
        <div className={styles.buttonContainer}>
          <Button title={i18n.t('login_button')} type="submit" />
        </div>
      </form>
    </Loading>
  );
};
