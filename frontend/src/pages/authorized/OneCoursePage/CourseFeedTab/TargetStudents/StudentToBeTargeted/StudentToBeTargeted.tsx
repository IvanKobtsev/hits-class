import React from 'react';
import { Checkbox } from '@mui/material';
import { Avatar } from 'components/uikit/avatar/Avatar';
import type { UserDto } from 'services/api/api-client.types';
import styles from './StudentToBeTargeted.module.scss';

export type StudentToBeTargetedProps = {
  user: UserDto;
  checked: boolean;
  onChange: () => void;
};

export const StudentToBeTargeted: React.FC<StudentToBeTargetedProps> = ({
  user,
  checked,
  onChange,
}) => {
  return (
    <div
      className={styles.row}
      onClick={onChange}
      data-test-id={`student-to-be-targeted-${user.id}`}
    >
      <Avatar user={user} />
      <div className={styles.userInfo}>
        <span className={styles.userName}>{user.legalName ?? ''}</span>
        <span className={styles.userEmail}>{user.email ?? ''}</span>
      </div>
      <span className={styles.groupBadge}>{user.groupNumber ?? '—'}</span>
      <Checkbox
        checked={checked}
        onChange={onChange}
        onClick={(e) => e.stopPropagation()}
        size="small"
        data-test-id={`student-to-be-targeted-checkbox-${user.id}`}
      />
    </div>
  );
};
