import styles from './TeamCard.module.scss';
import {
  PublicationDto,
  TeamAssignmentPayload,
  TeamDto,
} from '../../../../../services/api/api-client.types.ts';
import clsx from 'clsx';
import RedStatusIcon from 'assets/icons/red-status.svg?react';
import YellowStatusIcon from 'assets/icons/yellow-status.svg?react';
import GreenStatusIcon from 'assets/icons/green-status.svg?react';
import { TeamMemberEntry } from './TeamMemberEntry/TeamMemberEntry.tsx';

interface TeamCardProps {
  teamDto: TeamDto;
  assignment: PublicationDto;
}

export function TeamCard({ teamDto, assignment }: TeamCardProps) {
  const payload = assignment.publicationPayload as TeamAssignmentPayload;
  const isRed =
    !!payload.maxTeamSize && teamDto.members.length > payload.maxTeamSize;
  const isYellow = teamDto.members.length < (payload.minTeamSize ?? 2);
  const isGreen = !isRed && !isYellow;

  return (
    <div
      className={clsx(styles.TeamCard, {
        [styles.green]: isGreen,
        [styles.yellow]: isYellow,
        [styles.red]: isRed,
      })}
    >
      <div className={styles.header}>
        <div className={styles.teamTitle}>{teamDto.name}</div>
        <div className={styles.participantsNumber}>
          {teamDto.members.length}
          {!!payload.maxTeamSize ? `/{payload.maxTeamSize}` : null}
        </div>
      </div>
      <div className={styles.separator} />
      <div className={clsx(styles.studentEntry, styles.captain)} />
      <div className={styles.otherMembers}>
        {teamDto.members.map((member) => (
          <TeamMemberEntry member={member} />
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
