import React from 'react';
import type { CourseDto, UserDto } from 'services/api/api-client.types';
import type { CourseRole } from '../useCourseRole';
import styles from './CourseMembersTab.module.scss';

const AVATAR_COLORS = [
  '#1a73e8', '#e8710a', '#1e8e3e', '#d93025',
  '#9334e6', '#e52592', '#00897b', '#f9ab00',
];

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

type MemberRowProps = {
  user: UserDto;
  isOwner?: boolean;
  showGroup?: boolean;
};

const MemberRow: React.FC<MemberRowProps> = ({ user, isOwner, showGroup }) => (
  <div className={styles.memberRow} data-test-id={`member-row-${user.id}`}>
    <div
      className={styles.avatar}
      style={{ background: getAvatarColor(user.legalName) }}
    >
      {getInitials(user.legalName)}
    </div>
    <div className={styles.memberInfo}>
      <span className={styles.memberName}>{user.legalName}</span>
      <span className={styles.memberEmail}>{user.email}</span>
    </div>
    {isOwner && <span className={styles.ownerBadge}>Владелец</span>}
    {showGroup && user.groupNumber && (
      <span className={styles.groupBadge}>{user.groupNumber}</span>
    )}
  </div>
);

type CourseMembersTabProps = {
  course: CourseDto;
  role: CourseRole;
};

export const CourseMembersTab: React.FC<CourseMembersTabProps> = ({ course, role }) => {
  const { owner, teachers, students, bannedStudents = [] } = course;

  const allTeachers = [owner, ...teachers.filter((t) => t.id !== owner.id)];

  return (
    <div className={styles.container} data-test-id="course-members-tab">
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Преподаватели</h2>
          <span className={styles.sectionCount}>
            {allTeachers.length}
          </span>
        </div>
        {allTeachers.map((teacher) => (
          <MemberRow
            key={teacher.id}
            user={teacher}
            isOwner={teacher.id === owner.id}
          />
        ))}
      </div>

      <div className={styles.section}>
        <div className={`${styles.sectionHeader} ${styles.sectionHeaderStudents}`}>
          <h2 className={`${styles.sectionTitle} ${styles.sectionTitleStudents}`}>
            Учащиеся
          </h2>
          <span className={styles.sectionCount}>
            {students.length} {pluralStudents(students.length)}
          </span>
        </div>
        {students.length === 0 ? (
          <div className={styles.empty}>Нет учащихся</div>
        ) : (
          students.map((student) => (
            <MemberRow key={student.id} user={student} showGroup />
          ))
        )}
      </div>

      {role === 'teacher' && (
        <div className={styles.section}>
          <div className={`${styles.sectionHeader} ${styles.sectionHeaderStudents}`}>
            <h2 className={`${styles.sectionTitle} ${styles.sectionTitleStudents}`}>
              Заблокированные
            </h2>
            <span className={styles.sectionCount}>
              {bannedStudents.length} {pluralBanned(bannedStudents.length)}
            </span>
          </div>
          {bannedStudents.length === 0 ? (
            <div className={styles.empty}>Нет заблокированных</div>
          ) : (
            bannedStudents.map((user) => (
              <MemberRow key={user.id} user={user} showGroup />
            ))
          )}
        </div>
      )}
    </div>
  );
};

function pluralStudents(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'учащийся';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'учащихся';
  return 'учащихся';
}

function pluralBanned(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'заблокированный';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'заблокированных';
  return 'заблокированных';
}
