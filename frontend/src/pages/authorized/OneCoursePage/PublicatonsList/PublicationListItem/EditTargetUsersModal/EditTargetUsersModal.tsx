import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Checkbox } from '@mui/material';
import { CustomModal } from 'components/uikit/modal/CustomModal';
import { Button, ButtonColor, ButtonWidth } from 'components/uikit/buttons/Button';
import { Loading } from 'components/uikit/suspense/Loading';
import { useModal } from 'components/uikit/modal/useModal';
import { Avatar } from 'components/uikit/avatar/Avatar';
import { PublicationType, type UserDto } from 'services/api/api-client.types';
import { useGetCourseQuery } from 'services/api/api-client/CourseQuery';
import { useUpdateAnnouncementMutation } from 'services/api/api-client/AnnouncementQuery';
import { usePatchAssignmentMutation } from 'services/api/api-client/AssignmentQuery';
import { QueryFactory } from 'services/api';
import styles from './EditTargetUsersModal.module.scss';

export type EditTargetUsersModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  publicationId: number;
  publicationType: PublicationType;
  initialTargetUserIds: string[];
};

export const EditTargetUsersModal = ({
  isOpen,
  onClose,
  onSuccess,
  publicationId,
  publicationType,
  initialTargetUserIds,
}: EditTargetUsersModalProps) => {
  const { courseId } = useParams<{ courseId: string }>();
  const queryClient = useQueryClient();
  const modal = useModal();

  const { data: course, isLoading } = useGetCourseQuery(Number(courseId));

  const { mutateAsync: updateAnnouncement, isPending: isAnnouncementPending } =
    useUpdateAnnouncementMutation(publicationId);
  const { mutateAsync: patchAssignment, isPending: isAssignmentPending } =
    usePatchAssignmentMutation(publicationId);

  const isPending = isAnnouncementPending || isAssignmentPending;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialTargetUserIds),
  );
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(initialTargetUserIds));
      setSearch('');
      setGroupFilter('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const students: UserDto[] = useMemo(() => {
    if (!course) return [];
    return [...course.students].sort((a, b) => {
      const ga = a.groupNumber ?? '';
      const gb = b.groupNumber ?? '';
      return ga.localeCompare(gb) || a.legalName.localeCompare(b.legalName);
    });
  }, [course]);

  const groupOptions: string[] = useMemo(() => {
    const groups = new Set<string>();
    students.forEach((s) => {
      if (s.groupNumber) groups.add(s.groupNumber);
    });
    return Array.from(groups).sort();
  }, [students]);

  const searchLower = search.toLowerCase();

  const filteredStudents = students.filter((u) => {
    const matchesSearch = u.legalName.toLowerCase().includes(searchLower);
    const matchesGroup = groupFilter === '' || u.groupNumber === groupFilter;
    return matchesSearch && matchesGroup;
  });

  const toggleUser = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    try {
      const targetUsersIds = [...selectedIds];
      if (publicationType === PublicationType.Announcement) {
        await updateAnnouncement({ targetUsersIds });
      } else {
        await patchAssignment({ targetUsersIds });
      }
      await queryClient.invalidateQueries({
        queryKey: QueryFactory.PublicationsQuery.getPublicationsQueryKey({
          courseId: 1,
        }).slice(0, 1),
      });
      onClose();
      onSuccess?.();
    } catch {
      void modal.showError({ text: 'Не удалось изменить целевых пользователей' });
    }
  };

  const UserRow = ({ user }: { user: UserDto }) => (
    <div
      className={styles.userRow}
      onClick={() => toggleUser(user.id)}
      data-test-id={`EditTargetUsers-user-${user.id}`}
    >
      <Avatar user={user} />
      <div className={styles.userInfo}>
        <span className={styles.userName}>{user.legalName}</span>
        {user.groupNumber && (
          <span className={styles.userGroup}>{user.groupNumber}</span>
        )}
      </div>
      <Checkbox
        checked={selectedIds.has(user.id)}
        onChange={() => toggleUser(user.id)}
        onClick={(e) => e.stopPropagation()}
        size="small"
      />
    </div>
  );

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      isBlocking={false}
      title="Изменить целевых пользователей"
    >
      <Loading loading={isLoading || isPending}>
        <div className={styles.modal}>
          <div className={styles.searchRow}>
            <input
              className={styles.searchInput}
              placeholder="Поиск по имени"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={styles.groupSelect}
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              data-test-id="EditTargetUsers-group-filter"
            >
              <option value="">Все группы</option>
              {groupOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.userList}>
            {filteredStudents.map((u) => (
              <UserRow key={u.id} user={u} />
            ))}
          </div>

          <div className={styles.footer}>
            <Button
              title="Отмена"
              color={ButtonColor.Default}
              width={ButtonWidth.Content}
              onClick={onClose}
            />
            <Button
              title="Сохранить"
              color={ButtonColor.Primary}
              width={ButtonWidth.Content}
              onClick={() => { void handleSave(); }}
            />
          </div>
        </div>
      </Loading>
    </CustomModal>
  );
};
