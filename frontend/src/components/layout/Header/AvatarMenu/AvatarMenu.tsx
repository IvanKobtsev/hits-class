import React, { useRef, useEffect, useState } from 'react';
import { UserDto } from 'services/api/api-client.types';
import { Avatar } from 'components/uikit/avatar/Avatar';
import { logOut } from 'helpers/auth/auth-interceptor';
import styles from './AvatarMenu.module.scss';

export type AvatarMenuProps = {
  user?: UserDto;
};

export const AvatarMenu: React.FC<AvatarMenuProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logOut();
  };

  return (
    <div ref={menuRef} className={styles.wrapper}>
      <button
        type="button"
        data-test-id="avatar-menu-button"
        className={styles.trigger}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Avatar user={user} />
      </button>
      {isOpen && (
        <div role="menu" className={styles.dropdown}>
          <button
            type="button"
            role="menuitem"
            className={styles.logout}
            onClick={() => void handleLogout()}
          >
            Выйти из аккаунта
          </button>
        </div>
      )}
    </div>
  );
};
