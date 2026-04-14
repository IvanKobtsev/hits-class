import styles from '../TeamAssignmentPage.module.scss';
import TeamAssignmentIcon from 'assets/icons/team-assignment.svg?react';

export function TeamsViewAsStudent() {
  return (
    <div className={styles.layout}>
      <div className={styles.invites}></div>
      <h2 className={styles.invites}>Команды</h2>
    </div>
  );
}
