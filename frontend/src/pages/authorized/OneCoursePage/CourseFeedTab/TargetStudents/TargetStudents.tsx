import React, { useCallback, useMemo } from 'react';
import { Checkbox } from '@mui/material';
import { Loading } from 'components/uikit/suspense/Loading';
import { useGetCourseQuery } from 'services/api/api-client/CourseQuery';
import type { UserDto } from 'services/api/api-client.types';
import { StudentToBeTargeted } from './StudentToBeTargeted/StudentToBeTargeted';
import styles from './TargetStudents.module.scss';

export type TargetStudentsProps = {
  courseId: number;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
};

type GroupedStudents = { groupLabel: string; students: UserDto[] }[];

function groupAndSortStudents(students: UserDto[]): GroupedStudents {
  const sorted = [...students].sort((a, b) => {
    const ga = a.groupNumber ?? '';
    const gb = b.groupNumber ?? '';
    return ga.localeCompare(gb) || (a.legalName ?? '').localeCompare(b.legalName ?? '');
  });

  const groups: GroupedStudents = [];
  let currentGroup = '';
  let currentStudents: UserDto[] = [];

  for (const s of sorted) {
    const g = s.groupNumber ?? '—';
    if (g !== currentGroup) {
      if (currentStudents.length > 0) {
        groups.push({
          groupLabel: currentGroup || 'Без группы',
          students: currentStudents,
        });
      }
      currentGroup = g;
      currentStudents = [s];
    } else {
      currentStudents.push(s);
    }
  }
  if (currentStudents.length > 0) {
    groups.push({
      groupLabel: currentGroup || 'Без группы',
      students: currentStudents,
    });
  }
  return groups;
}

export const TargetStudents: React.FC<TargetStudentsProps> = ({
  courseId,
  selectedIds,
  onSelectionChange,
}) => {
  const { data: course, isLoading } = useGetCourseQuery(courseId);

  const students = course?.students ?? [];
  const groupedStudents = useMemo(() => groupAndSortStudents(students), [students]);

  const allIds = useMemo(() => new Set(students.map((s) => s.id)), [students]);
  const allSelected = students.length > 0 && allIds.size === selectedIds.size;
  const someSelected = selectedIds.size > 0 && selectedIds.size < allIds.size;

  const toggleUser = useCallback(
    (id: string) => {
      onSelectionChange(
        (() => {
          const next = new Set(selectedIds);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        })()
      );
    },
    [selectedIds, onSelectionChange]
  );

  const toggleAll = useCallback(() => {
    onSelectionChange(allSelected ? new Set() : new Set(allIds));
  }, [allSelected, allIds, onSelectionChange]);

  const toggleGroup = useCallback(
    (groupStudents: UserDto[]) => {
      const ids = new Set(groupStudents.map((s) => s.id));
      const allInGroupSelected = groupStudents.every((s) => selectedIds.has(s.id));
      const next = new Set(selectedIds);
      if (allInGroupSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      onSelectionChange(next);
    },
    [selectedIds, onSelectionChange]
  );

  return (
    <div className={styles.container} data-test-id="target-students">
      <h3 className={styles.title}>Целевые студенты</h3>
      <Loading loading={isLoading}>
        {students.length === 0 ? (
          <div className={styles.empty}>Нет студентов в курсе</div>
        ) : (
          <>
            <div className={styles.selectAllRow}>
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={toggleAll}
                size="small"
                inputProps={{ 'data-test-id': 'target-students-select-all' }}
                aria-label="Выбрать всех"
              />
              <span className={styles.selectAllLabel}>Выбрать всех</span>
            </div>

            <div className={styles.list}>
              {groupedStudents.map(({ groupLabel, students: groupStudents }, idx) => {
                const groupAllSelected = groupStudents.every((s) =>
                  selectedIds.has(s.id)
                );
                const groupSomeSelected =
                  groupStudents.some((s) => selectedIds.has(s.id)) &&
                  !groupAllSelected;

                return (
                  <div key={`${groupLabel}-${idx}`} className={styles.group}>
                    <div
                      className={styles.groupHeader}
                      data-test-id={`target-students-group-${groupLabel}`}
                    >
                      <div className={styles.groupSeparator} />
                      <Checkbox
                        checked={groupAllSelected}
                        indeterminate={groupSomeSelected}
                        onChange={() => toggleGroup(groupStudents)}
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                        inputProps={{
                          'data-test-id': `target-students-group-checkbox-${groupLabel}`,
                        }}
                        aria-label={`Группа ${groupLabel}`}
                      />
                      <span className={styles.groupLabel}>{groupLabel}</span>
                    </div>
                    {groupStudents.map((user) => (
                      <StudentToBeTargeted
                        key={user.id}
                        user={user}
                        checked={selectedIds.has(user.id)}
                        onChange={() => toggleUser(user.id)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Loading>
    </div>
  );
};
