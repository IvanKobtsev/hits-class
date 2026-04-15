import { Field } from 'components/uikit/Field';
import { Input } from 'components/uikit/inputs/Input';
import { CustomModal } from 'components/uikit/modal/CustomModal';
import { Loading } from 'components/uikit/suspense/Loading';
import styles from './TeamSubmissionsModal.module.scss';
import {
  getTeamForAssignmentQueryKey,
  getTeamsForAssignmentQueryKey,
  useGetTeamForAssignmentQuery,
} from '../../../../../services/api/api-client/TeamQuery.ts';
import AddMemberIcon from 'assets/icons/add-member.svg?react';
import { TeamAssignmentPayload } from '../../../../../services/api/api-client.types.ts';
import { Button, Typography } from '@mui/material';
import clsx from 'clsx';
import {
  disbandTeam,
  updateTeamName,
} from '../../../../../services/api/api-client/TeamClient.ts';
import { useRef, useState } from 'react';
import { ButtonColor } from '../../../../../components/uikit/buttons/Button.tsx';
import { Links } from 'application/constants/links.ts';
import { queryClient } from '../../../../../services/api/query-client-helper.ts';
import { useRerender } from '../../../../../helpers/useRerender.ts';
import { TeamMembersList } from '../../TeamsView/TeamCard/TeamCard.tsx';

type TeamSubmissionsModalProps = {
  assignmentId: number;
  teamId: number;
  isOpen: boolean;
  onClose: () => void;
  assignmentPayload: TeamAssignmentPayload;
  teacherView?: boolean;
};

export const TeamSubmissionsModal = ({
  assignmentId,
  teamId,
  isOpen,
  onClose,
  assignmentPayload,
  teacherView,
}: TeamSubmissionsModalProps) => {
  const params = Links.Authorized.TeamAssignmentRoutes.useParams();
  const [disbandOpen, setDisbandOpen] = useState(false);
  const { rerender } = useRerender();

  const teamQuery = useGetTeamForAssignmentQuery(assignmentId, teamId);

  const handleClose = () => {
    onClose();
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      isBlocking={false}
      maxWidth="lg"
      title="Оценить команду"
    >
      <Loading loading={teamQuery.isLoading} doNotRenderChildrenWhileLoading>
        {teamQuery.data && (
          <>
            <div className={styles.teamMembers}>
              <TeamMembersList
                teamDto={teamQuery.data}
                payload={assignmentPayload}
                hideExtraSlots
              />
            </div>
            <div className={styles.footer}>
              <Button
                variant="contained"
                data-test-id="TeamSubmissions-save-button"
                className={clsx(styles.btnPrimary, styles.red)}
                disabled={
                  teamQuery.data.members.length >=
                  (assignmentPayload.maxTeamSize ?? 100)
                }
                onClick={() => setDisbandOpen(true)}
              >
                {'Сохранить'}
              </Button>
            </div>
          </>
        )}
      </Loading>
    </CustomModal>
  );
};
