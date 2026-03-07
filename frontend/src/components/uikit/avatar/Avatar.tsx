import styles from './Avatar.module.scss';
import { UserDto } from 'services/api/api-client.types.ts';

export type AvatarProps = {
  user?: UserDto;
};

export const Avatar = (props: AvatarProps) => {
  const user = props.user ?? null;
  const initials = user ? getInitials(user) : 'N/A';
  const colorIndex = user ? (user.legalName ?? 'a').charCodeAt(0) % 7 : 6;

  return (
    <div className={styles.wrapper} data-test-id="user-avatar">
      <div className={styles.round} />
      <div className={styles.avatar}>
        <div className={styles.initials} data-color={colorIndex}>
          {initials}
        </div>
      </div>
    </div>
  );
};

export type AvatarGroupProps = {
  max?: number;
  items: AvatarProps[];
};

function getInitials(user: UserDto): string {
  const names = user.legalName?.split(' ').filter((n) => n.trim());
  const first = names?.[0]?.[0] ?? '';
  const last =
    names && names.length > 1 ? (names[names.length - 1]?.[0] ?? '') : '';

  if (first && last) return (first + last).toUpperCase();
  if (first) return first.toUpperCase();
  return 'N/A';
}
