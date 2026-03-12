import { ErrorPage } from 'components/uikit/ErrorPage';
import {
  navigateBack,
  useNavigateWithFallback,
} from 'helpers/navigation-helpers';
import { Links } from 'application/constants/links';

export function PageNotFound() {
  const navigate = useNavigateWithFallback();

  return (
    <ErrorPage
      title={'Страница не найдена!'}
      message={
        'Похоже, что вы перешли по неверной ссылке или страница была удалена.'
      }
      primaryButton={{
        title: 'На главную страницу',
        onClick: () => navigate(Links.Authorized.Dashboard.link()),
      }}
      secondaryButton={{
        title: 'Назад',
        onClick: navigateBack,
      }}
    />
  );
}
