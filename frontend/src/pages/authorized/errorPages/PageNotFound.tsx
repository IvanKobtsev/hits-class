import { ErrorPage } from './ErrorPage.tsx';
import PageNotFoundIcon from 'src/assets/icons/page_not_found.svg';
import { Links } from 'application/constants/links.ts';
import { browserNavigate, navigateBack } from 'helpers/navigation-helpers.ts';

export function PageNotFound() {
  return (
    <ErrorPage
      title={'Oops! Page not found'}
      message={
        'Something went wrong.<br /> It looks like the link is broken or the page has been removed.'
      }
      image={<PageNotFoundIcon />}
      primaryButton={{
        title: 'На главную страницу',
        onClick: () => browserNavigate(Links.Authorized.Dashboard.link()),
      }}
      secondaryButton={{
        title: 'Назад',
        onClick: navigateBack,
      }}
    />
  );
}
