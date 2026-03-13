import clsx from 'clsx';
import styles from './ErrorPage.module.scss';
import { Button, ButtonColor, ButtonProps } from './buttons/Button.tsx';

interface ErrorPageProps {
  title?: React.ReactNode;
  message?: React.ReactNode;
  image?: React.ReactNode;
  primaryButton?: ButtonProps;
  secondaryButton?: ButtonProps;
}

export function ErrorPage({
  title,
  message,
  image,
  primaryButton,
  secondaryButton,
}: ErrorPageProps) {
  return (
    <div className={styles.ErrorPage}>
      {image}
      {title && <div className={styles.title}>{title}</div>}
      {message && <div className={styles.message}>{message}</div>}
      {primaryButton && (
        <Button
          color={ButtonColor.Primary}
          {...primaryButton}
          className={clsx(styles.primaryButton, primaryButton.className)}
        />
      )}
      {secondaryButton && (
        <Button
          color={ButtonColor.Primary}
          {...secondaryButton}
          className={clsx(styles.primaryButton, secondaryButton.className)}
        />
      )}
    </div>
  );
}
