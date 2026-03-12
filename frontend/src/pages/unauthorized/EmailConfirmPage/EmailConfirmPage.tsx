import { Links } from 'application/constants/links';
import { useEffect, useRef, useState } from 'react';
import { useConfirmEmailMutation } from 'services/api/api-client/UserQuery.ts';
import { ProblemDetails } from 'services/api/api-client.types.ts';
import styles from './EmailConfirmPage.module.scss';
import { useNavigate } from 'react-router-dom';
import { Loading } from 'components/uikit/suspense/Loading.tsx';
import { Button } from 'components/uikit/buttons/Button.tsx';

type EmailConfirmState = 'pending' | 'success' | 'error';

export function EmailConfirmPage() {
  const params = Links.Unauthorized.ConfirmEmail.useParams();
  const mutation = useConfirmEmailMutation(params.userId, {
    onError: (error) => {
      setState('error');
      setError(
        (error as ProblemDetails).detail === 'Email is already confirmed'
          ? 'Аккаунт уже подтверждён'
          : 'Пожалуйста, убедитесь, что ссылка верная и попробуйте ещё раз.',
      );
    },
    onSuccess: () => {
      setState('success');
    },
  });
  const hasCalledRef = useRef(false);
  const [state, setState] = useState<EmailConfirmState>('pending');
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!hasCalledRef.current) {
      hasCalledRef.current = true;
      mutation.mutate();
    }
  }, []);

  const navigate = useNavigate();

  switch (state) {
    default:
    case 'pending':
      return <Loading loading={true} />;
    case 'success':
      return (
        <div className={styles.confirmationSuccess}>
          <h2 className={styles.title}>Вы успешно подтвердили свой аккаунт!</h2>
          <span className={styles.description}>
            Теперь вы можете войти в систему и начать использовать все
            возможности нашего сервиса.
          </span>
          <Button
            title={'На страницу логина'}
            onClick={() => navigate(Links.Authorized.Dashboard.link())}
          />
        </div>
      );
    case 'error':
      return (
        <div className={styles.confirmationFailure}>
          <h2 className={styles.title}>Не удалось подтвердить аккаунт</h2>
          <span className={styles.description}>{error}</span>
          <Button
            title={'На страницу логина'}
            onClick={() => navigate(Links.Authorized.Dashboard.link())}
          />
        </div>
      );
  }
}
