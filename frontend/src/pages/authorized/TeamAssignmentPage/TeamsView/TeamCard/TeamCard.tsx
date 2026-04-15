import styles from './TeamCard.module.scss';
import {
  PublicationDto,
  TeamAssignmentPayload,
  TeamDto,
  UserDto,
} from '../../../../../services/api/api-client.types.ts';
import clsx from 'clsx';
import RedStatusIcon from 'assets/icons/red-status.svg?react';
import YellowStatusIcon from 'assets/icons/yellow-status.svg?react';
import GreenStatusIcon from 'assets/icons/green-status.svg?react';
import { TeamMemberEntry } from './TeamMemberEntry/TeamMemberEntry.tsx';
import TruncatingContainer from '../../../../../components/uikit/truncatingContainer/TruncatingContainer.tsx';

interface TeamCardProps {
  teamDto: TeamDto;
  assignment: PublicationDto;
  myTeam?: boolean;
  teacherView?: boolean;
}

export function TeamCard({
  teamDto,
  assignment,
  myTeam,
  teacherView,
}: TeamCardProps) {
  const payload = assignment.publicationPayload as TeamAssignmentPayload;
  const isRed =
    !!payload.maxTeamSize && teamDto.members.length > payload.maxTeamSize;
  const isYellow = teamDto.members.length < (payload.minTeamSize ?? 1);
  const isGreen = !isRed && !isYellow;
  const color = isGreen ? 'green' : isYellow ? 'yellow' : 'red';

  const numberOfMembers = teamDto.members.length;
  const numberOfSlots = !payload.maxTeamSize
    ? numberOfMembers > 5
      ? numberOfMembers
      : 5
    : payload.maxTeamSize;
  const members: (UserDto | null)[] = [
    ...teamDto.members,
    ...Array.from({ length: numberOfSlots - numberOfMembers }, () => null),
  ].filter((m) => !m || m.id !== teamDto.captain.id);

  return (
    <div
      className={clsx(
        styles.TeamCard,
        myTeam && styles.myTeam,
        (teacherView || myTeam) && styles.clickable,
        {
          [styles.green]: isGreen,
          [styles.yellow]: isYellow,
          [styles.red]: isRed,
        },
      )}
    >
      <div className={styles.header}>
        <div className={styles.teamTitle}>
          <TruncatingContainer title={teamDto.name} />
        </div>
        {myTeam && <span className={styles.myTeam}>[моя команда]</span>}
        <div className={styles.participantsNumber}>
          {teamDto.members.length}
          {!!payload.maxTeamSize ? `/{payload.maxTeamSize}` : null}
        </div>
      </div>
      <div className={styles.separator} />
      <TeamMemberEntry member={teamDto.captain} color={color} isCaptain />
      <div className={styles.otherMembers}>
        {members.map((member) => (
          <TeamMemberEntry member={member} color={color} />
        ))}
      </div>
      <div className={styles.teamStatus}>
        {isRed && (
          <>
            Слишком много участников
            <RedStatusIcon />
          </>
        )}
        {isYellow && (
          <>
            Не хватает участников
            <YellowStatusIcon />
          </>
        )}
        {isGreen && (
          <>
            Укомплектована
            <GreenStatusIcon />
          </>
        )}
      </div>
    </div>
  );
}
