import React from 'react';
import { Avatar } from 'components/uikit/avatar/Avatar';
import type { UserDto } from 'services/api/api-client.types';
import styles from './UserWithRole.module.scss';

export const ADMIN_ROLE = 'Admin';
export const TEACHER_ROLE = 'Teacher';
export const STUDENT_ROLE = 'Student';

export type SystemRole = typeof ADMIN_ROLE | typeof TEACHER_ROLE | typeof STUDENT_ROLE;

export const ROLE_OPTIONS: { value: SystemRole; label: string }[] = [
  { value: ADMIN_ROLE, label: 'Администратор' },
  { value: TEACHER_ROLE, label: 'Преподаватель' },
  { value: STUDENT_ROLE, label: 'Студент' },
];

export type UserWithRoleProps = {
  user: UserDto;
  selectedRole: SystemRole;
  onRoleChange: (role: SystemRole) => void;
};

export const UserWithRole: React.FC<UserWithRoleProps> = ({
  user,
  selectedRole,
  onRoleChange,
}) => {
  return (
    <div className={styles.row} data-test-id={`user-with-role-${user.id}`}>
      <div className={styles.avatarWrapper}>
        <Avatar user={user} />
      </div>
      <div className={styles.memberInfo}>
        <span className={styles.memberName}>{user.legalName}</span>
        <span className={styles.memberEmail}>{user.email}</span>
      </div>
      <span className={styles.groupBadge}>{user.groupNumber ?? '—'}</span>
      <select
        className={styles.roleSelect}
        value={selectedRole}
        onChange={(e) => onRoleChange(e.target.value as SystemRole)}
        data-test-id={`user-with-role-select-${user.id}`}
      >
        {ROLE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
