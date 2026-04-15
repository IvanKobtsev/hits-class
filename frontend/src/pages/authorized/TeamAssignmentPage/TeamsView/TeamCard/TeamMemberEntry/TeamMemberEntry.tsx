import styles from './TeamMemberEntry.module.scss';
import { UserDto } from '../../../../../../services/api/api-client.types.ts';
import clsx from 'clsx';
import TruncatingContainer from '../../../../../../components/uikit/truncatingContainer/TruncatingContainer.tsx';

interface TeamMemberEntryProps {
  member?: UserDto | null;
  isCaptain?: boolean;
  color?: 'green' | 'yellow' | 'red';
}

export function TeamMemberEntry({
  member,
  isCaptain,
  color,
}: TeamMemberEntryProps) {
  return (
    <div
      className={clsx(
        styles.TeamMemberEntry,
        !!member && styles.member,
        isCaptain && styles.captain,
        {
          [styles.green]: color === 'green',
          [styles.yellow]: color === 'yellow',
          [styles.red]: color === 'red',
        },
      )}
    >
      {member ? (
        <>
          <div className={styles.name}>
            <TruncatingContainer title={member.legalName} />
            {isCaptain && <span className={styles.captain}>капитан</span>}
          </div>
          <span className={styles.groupNumber}>{member.groupNumber}</span>
        </>
      ) : (
        'свободный слот'
      )}
    </div>
  );
}
