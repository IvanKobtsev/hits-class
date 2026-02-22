import React, { useState } from 'react';
import styles from './RegisterForm.module.scss';
import { useScopedTranslation } from 'application/localization/useScopedTranslation';
import { Button } from 'components/uikit/buttons/Button';
import { Field } from 'components/uikit/Field';
import { Input } from 'components/uikit/inputs/Input';
import { useAdvancedForm } from 'helpers/form/useAdvancedForm';
import { requiredRule } from 'helpers/form/react-hook-form-helper';
import { FormError } from 'components/uikit/FormError';
import { Loading } from 'components/uikit/suspense/Loading';
import { register as sendRegisterRequest } from 'services/api/api-client/UserClient';

type Form = {
  email: string;
  legalName: string;
  groupNumber: string;
  password: string;
};

export const RegisterForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const i18n = useScopedTranslation('Page.RegisterForm');
  const form = useAdvancedForm<Form>(async (data) => {
    setIsLoading(true);
    try {
      await sendRegisterRequest({
        email: data.email,
        legalName: data.legalName,
        groupNumber: data.groupNumber || null,
        password: data.password,
      });
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  });

  if (isSuccess) {
    return (
      <div className={styles.successContainer} data-test-id="register-success">
        <p className={styles.successTitle}>{i18n.t('success_title')}</p>
        <p className={styles.successMessage}>{i18n.t('success_message')}</p>
      </div>
    );
  }

  return (
    <Loading loading={isLoading}>
      <form onSubmit={form.handleSubmitDefault}>
        <Field
          title={i18n.t('email_field')}
          className={styles.inputField}
          testId="Email"
        >
          <Input
            {...form.register('email', { ...requiredRule() })}
            errorText={form.formState.errors.email?.message}
          />
        </Field>
        <Field
          title={i18n.t('legal_name_field')}
          className={styles.inputField}
          testId="LegalName"
        >
          <Input
            {...form.register('legalName', { ...requiredRule() })}
            errorText={form.formState.errors.legalName?.message}
          />
        </Field>
        <Field
          title={i18n.t('group_number_field')}
          className={styles.inputField}
          testId="GroupNumber"
        >
          <Input
            {...form.register('groupNumber')}
            errorText={form.formState.errors.groupNumber?.message}
          />
        </Field>
        <Field
          title={i18n.t('password_filed')}
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
          <Button title={i18n.t('register_button')} type="submit" />
        </div>
      </form>
    </Loading>
  );
};
