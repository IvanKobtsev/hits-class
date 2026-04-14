import styles from './TeamMemberEntry.module.scss';
import { UserDto } from '../../../../../../services/api/api-client.types.ts';

interface TeamMemberEntryProps {
  member: UserDto;
}

export function TeamMemberEntry({ member }: TeamMemberEntryProps) {
  return <div className={styles.TeamMemberEntry}>{member.legalName}</div>;
}
