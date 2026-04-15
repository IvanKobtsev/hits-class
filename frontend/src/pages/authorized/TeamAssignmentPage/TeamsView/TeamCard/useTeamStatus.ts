import {
  TeamAssignmentPayload,
  TeamDto,
} from '../../../../../services/api/api-client.types.ts';

export function useTeamStatus(
  teamDto: TeamDto,
  payload: TeamAssignmentPayload,
) {
  const isRed =
    !!payload.maxTeamSize && teamDto.members.length > payload.maxTeamSize;
  const isYellow = teamDto.members.length < (payload.minTeamSize ?? 1);
  const isGreen = !isRed && !isYellow;

  return isRed ? 'red' : isYellow ? 'yellow' : 'green';
}
