import styles from './TeamSubmissionsView.module.scss';
import { useGetTeamsForAssignmentQuery } from '../../../../services/api/api-client/TeamQuery.ts';
import { Loading } from 'components/uikit/suspense/Loading.tsx';
import { TeamCard } from '../TeamsView/TeamCard/TeamCard.tsx';
import { Links } from '../../../../application/constants/links.ts';
import { useGetPublicationByIdQuery } from 'services/api/api-client/PublicationsQuery.ts';
import { TeamAssignmentPayload } from '../../../../services/api/api-client.types.ts';
import { TeamSubmissionsModal } from './TeamSubmissionsModal/TeamSubmissionsModal.tsx';

export function TeamSubmissionsView() {
  const params = Links.Authorized.TeamAssignmentRoutes.useParams();
  const teamsQuery = useGetTeamsForAssignmentQuery(params.assignmentId);

  const { data: publication } = useGetPublicationByIdQuery(params.assignmentId);

  if (!publication) return null;

  const payload = publication.publicationPayload as TeamAssignmentPayload;

  return (
    <div className={styles.TeamSubmissionsView}>
      {/*<div className={styles.header}>*/}
      {/*  <b>Тип оценки:</b> одна на команду*/}
      {/*</div>*/}
      <Loading loading={teamsQuery.isLoading} doNotWrapChildren>
        {teamsQuery.data?.length === 0 && 'Нет команд'}
        <div className={styles.teamsContainer}>
          {teamsQuery.data?.map((t) => (
            <TeamCard
              key={t.id}
              teamDto={t}
              assignment={publication}
              forceHideDetails
              onClick={() => {
                params.setQueryParams({ teamId: t.id });
              }}
            />
          ))}
        </div>
        {params.queryParams.teamId && (
          <TeamSubmissionsModal
            assignmentId={params.assignmentId}
            teamId={params.queryParams.teamId}
            isOpen={!!params.queryParams.teamId}
            onClose={() => params.setQueryParams({ teamId: undefined })}
            assignmentPayload={payload}
          />
        )}
      </Loading>
    </div>
  );
}
