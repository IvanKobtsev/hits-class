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
import { useTeamStatus } from './useTeamStatus.ts';

interface TeamCardProps {
  teamDto: TeamDto;
  assignment: PublicationDto;
  myTeam?: boolean;
  onClick?: () => void;
  forceHideDetails?: boolean;
}

export function TeamCard({
  teamDto,
  assignment,
  myTeam,
  onClick,
  forceHideDetails,
}: TeamCardProps) {
  const payload = assignment.publicationPayload as TeamAssignmentPayload;
  const teamStatus = useTeamStatus(teamDto, payload);

  return (
    <div
      className={clsx(
        styles.TeamCard,
        myTeam && styles.myTeam,
        !!onClick && styles.clickable,
        {
          [styles.blue]:
            forceHideDetails ||
            (teamStatus === 'green' && payload.areTeamsFrozen),
          [styles.green]: teamStatus === 'green',
          [styles.yellow]: teamStatus === 'yellow',
          [styles.red]: teamStatus === 'red',
        },
      )}
      onClick={onClick}
    >
      <div className={styles.header}>
        <div className={styles.teamTitle}>
          <TruncatingContainer title={teamDto.name} />
          {myTeam && <span className={styles.myTeam}>[моя команда]</span>}
        </div>
        <div className={styles.participantsNumber}>
          {teamDto.members.length}
          {!!payload.maxTeamSize && !payload.areTeamsFrozen && !forceHideDetails
            ? `/${payload.maxTeamSize}`
            : null}
        </div>
      </div>
      <div className={styles.separator} />
      <TeamMembersList
        color={
          forceHideDetails || (teamStatus === 'green' && payload.areTeamsFrozen)
            ? 'blue'
            : teamStatus
        }
        teamDto={teamDto}
        payload={payload}
        hideExtraSlots={forceHideDetails}
      />
      {(teamStatus === 'green' && payload.areTeamsFrozen) ||
        forceHideDetails || <TeamStatus teamDto={teamDto} payload={payload} />}
    </div>
  );
}

export function TeamMembersList({
  teamDto,
  color,
  payload,
  hideExtraSlots,
  canAssignCaptainRole,
  onAssignCaptainRole,
}: {
  teamDto: TeamDto;
  color?: 'red' | 'green' | 'yellow' | 'blue';
  payload: TeamAssignmentPayload;
  hideExtraSlots?: boolean;
  canAssignCaptainRole?: boolean;
  onAssignCaptainRole?: (member: UserDto) => Promise<void> | void;
}) {
  const numberOfMembers = teamDto.members.length;
  const numberOfSlots = !payload.maxTeamSize
    ? numberOfMembers > 5
      ? numberOfMembers
      : 5
    : payload.maxTeamSize;
  const members: (UserDto | null)[] = [
    ...teamDto.members,
    ...(!payload.areTeamsFrozen && !hideExtraSlots
      ? Array.from({ length: numberOfSlots - numberOfMembers }, () => null)
      : []),
  ].filter((m) => !m || m.id !== teamDto.captain.id);

  return (
    <>
      <TeamMemberEntry member={teamDto.captain} color={color} isCaptain />
      {(members.length === 0 && (payload.areTeamsFrozen || hideExtraSlots)) || (
        <div className={styles.otherMembers}>
          {members.map((member, index) => (
            <TeamMemberEntry
              key={member?.id ?? `free-slot-${index}`}
              member={member}
              color={color}
              canAssignCaptain={canAssignCaptainRole && !!member}
              onAssignCaptain={onAssignCaptainRole}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function TeamStatus({
  teamDto,
  payload,
}: {
  teamDto: TeamDto;
  payload: TeamAssignmentPayload;
}) {
  const teamStatus = useTeamStatus(teamDto, payload);

  return (
    <div
      className={clsx(styles.teamStatus, {
        [styles.green]: teamStatus === 'green',
        [styles.yellow]: teamStatus === 'yellow',
        [styles.red]: teamStatus === 'red',
      })}
    >
      {teamStatus === 'red' && (
        <>
          Слишком много участников
          <RedStatusIcon />
        </>
      )}
      {teamStatus === 'yellow' && (
        <>
          Не хватает участников
          <YellowStatusIcon />
        </>
      )}
      {teamStatus === 'green' && (
        <>
          Укомплектована
          <GreenStatusIcon />
        </>
      )}
    </div>
  );
}
