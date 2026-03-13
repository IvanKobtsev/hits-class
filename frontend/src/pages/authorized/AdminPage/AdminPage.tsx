import React, { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Client,
  useGetUsersQuery,
  getUsersQueryKey,
  getCurrentUserInfoQueryKey,
} from 'services/api/api-client/UserQuery';
import { Button, ButtonColor, ButtonWidth } from 'components/uikit/buttons/Button';
import { Loading } from 'components/uikit/suspense/Loading';
import {
  UserWithRole,
  type SystemRole,
  ADMIN_ROLE,
  TEACHER_ROLE,
  STUDENT_ROLE,
} from './UserWithRole/UserWithRole';
import type { UserDto } from 'services/api/api-client.types';
import styles from './AdminPage.module.scss';

function getInitialRoleFromUser(user: UserDto): SystemRole {
  const roles = user.roles ?? [];
  if (roles.includes(ADMIN_ROLE)) return ADMIN_ROLE;
  if (roles.includes(TEACHER_ROLE)) return TEACHER_ROLE;
  return STUDENT_ROLE;
}

async function syncUserRole(userId: string, targetRole: SystemRole): Promise<void> {
  if (targetRole === STUDENT_ROLE) {
    try {
      await Client.removeRolesFromUser(userId, ADMIN_ROLE);
    } catch {
      // User may not have Admin role - ignore
    }
    try {
      await Client.removeRolesFromUser(userId, TEACHER_ROLE);
    } catch {
      // User may not have Teacher role - ignore
    }
    return;
  }

  if (targetRole === ADMIN_ROLE) {
    try {
      await Client.removeRolesFromUser(userId, TEACHER_ROLE);
    } catch {
      // User may not have Teacher role - ignore
    }
    await Client.addRoleToUser(userId, ADMIN_ROLE);
    return;
  }

  if (targetRole === TEACHER_ROLE) {
    try {
      await Client.removeRolesFromUser(userId, ADMIN_ROLE);
    } catch {
      // User may not have Admin role - ignore
    }
    await Client.addRoleToUser(userId, TEACHER_ROLE);
  }
}

export const AdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleOverrides, setRoleOverrides] = useState<Record<string, SystemRole>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, isLoading } = useGetUsersQuery({ limit: 1000 });

  const users = data?.data ?? [];

  const filteredUsers = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    if (!searchLower) return users;
    return users.filter(
      (u) =>
        (u.legalName ?? '').toLowerCase().includes(searchLower) ||
        (u.email ?? '').toLowerCase().includes(searchLower)
    );
  }, [users, search]);

  const getSelectedRole = useCallback(
    (user: UserDto): SystemRole =>
      roleOverrides[user.id] ?? getInitialRoleFromUser(user),
    [roleOverrides]
  );

  const handleRoleChange = useCallback((user: UserDto, role: SystemRole) => {
    setRoleOverrides((prev) => ({ ...prev, [user.id]: role }));
    setSaveError(null);
  }, []);

  const handleSave = useCallback(async () => {
    const userIdsToSync = Object.keys(roleOverrides);
    if (userIdsToSync.length === 0) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      for (const userId of userIdsToSync) {
        const targetRole = roleOverrides[userId];
        await syncUserRole(userId, targetRole);
      }
      setRoleOverrides({});
      await queryClient.invalidateQueries({ queryKey: getUsersQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getCurrentUserInfoQueryKey() });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось сохранить изменения';
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }, [roleOverrides, queryClient]);

  const hasChanges = Object.keys(roleOverrides).length > 0;

  return (
    <div className={styles.container} data-test-id="admin-page">
      <h1 className={styles.title}>Админ-панель</h1>

      <div className={styles.searchRow}>
        <input
          className={styles.searchInput}
          placeholder="Поиск по имени или email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-test-id="admin-page-search"
        />
      </div>

      <Loading loading={isLoading}>
        <div className={styles.userList}>
          {filteredUsers.map((user) => (
            <UserWithRole
              key={user.id}
              user={user}
              selectedRole={getSelectedRole(user)}
              onRoleChange={(role) => handleRoleChange(user, role)}
            />
          ))}
        </div>
      </Loading>

      {saveError && <div className={styles.error}>{saveError}</div>}

      <div className={styles.footer}>
        <Button
          title="Сохранить"
          color={ButtonColor.Primary}
          width={ButtonWidth.Content}
          onClick={() => void handleSave()}
          disabled={!hasChanges || isSaving}
          testId="admin-page-save"
        />
      </div>
    </div>
  );
};
