import React from 'react';
import { Box, Button, Select, MenuItem } from '@mui/material';
import { PublicationDto, PublicationType } from 'services/api/api-client';
import { CourseRole } from '../useCourseRole';
import {
  PublicationList,
  PublicationTypeFilter,
} from '../PublicatonsList/PublicationList';
import AnnouncementIcon from 'assets/icons/announcement.svg?react';
import AssignmentIcon from 'assets/icons/assignment.svg?react';
import TeamAssignmentIcon from 'assets/icons/team-assignment.svg?react';
import styles from './CourseFeedTab.module.scss';

type Props = {
  courseId: number;
  publications: PublicationDto[];
  role: CourseRole;
  onCreateAnnouncement: () => void;
  onCreatePersonalAssignment: () => void;
  onCreateTeamAssignment: () => void;
};

export const CourseFeedTab: React.FC<Props> = ({
  publications,
  role,
  onCreateAnnouncement,
  onCreatePersonalAssignment,
  onCreateTeamAssignment,
}) => {
  const [filter, setFilter] = React.useState<PublicationTypeFilter>('all');

  return (
    <Box className={styles.wrapper}>
      <Box className={styles.actions} data-test-id="CourseFeedTab-actions">
        <div className={styles.createActions}>
          <h3>Создать:</h3>
          <Button
            variant="outlined"
            onClick={onCreateAnnouncement}
            data-test-id="CourseFeedTab-create-announcement"
            startIcon={<AnnouncementIcon className={styles.icon} />}
            className={styles.btnSecondary}
          >
            Объявление
          </Button>

          {role === 'teacher' && (
            <>
              <Button
                variant="contained"
                onClick={onCreatePersonalAssignment}
                data-test-id="CourseFeedTab-create-individual-assignment"
                startIcon={<AssignmentIcon className={styles.icon} />}
                className={styles.btnPrimary}
              >
                Индивидуальное задание
              </Button>
              <Button
                variant="contained"
                onClick={onCreateTeamAssignment}
                data-test-id="CourseFeedTab-create-team-assignment"
                startIcon={<TeamAssignmentIcon className={styles.icon} />}
                className={styles.btnPrimary}
              >
                Командное задание
              </Button>
            </>
          )}
        </div>
        <div className={styles.filters}>
          <h3>Фильтр:</h3>
          <Select
            className={styles.select}
            defaultValue={'all'}
            onChange={(e) => setFilter(e.target.value as PublicationTypeFilter)}
          >
            <MenuItem value={'all'} className={styles.selectOption}>
              Все
            </MenuItem>
            <MenuItem
              value={PublicationType.Announcement}
              className={styles.selectOption}
            >
              Объявления
            </MenuItem>
            <MenuItem
              value={PublicationType.Assignment}
              className={styles.selectOption}
            >
              Индивидуальные задания
            </MenuItem>
            <MenuItem
              value={PublicationType.TeamAssignment}
              className={styles.selectOption}
            >
              Командные задания
            </MenuItem>
          </Select>
        </div>
      </Box>
      <PublicationList publications={publications} filter={filter} />
    </Box>
  );
};
