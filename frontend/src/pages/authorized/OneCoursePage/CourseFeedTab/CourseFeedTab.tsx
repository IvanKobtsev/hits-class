import React from 'react';
import { Box, Button } from '@mui/material';
import { PublicationDto } from 'services/api/api-client';
import { CourseRole } from '../useCourseRole';
import { PublicationList } from '../PublicatonsList/PublicationList';
import AnnouncementIcon from 'assets/icons/announcement.svg?react';
import AssignmentIcon from 'assets/icons/assignment.svg?react';
import styles from './CourseFeedTab.module.scss';

type Props = {
  courseId: number;
  publications: PublicationDto[];
  role: CourseRole;
  onCreateAnnouncement: () => void;
  onCreateAssignment: () => void;
};

export const CourseFeedTab: React.FC<Props> = ({
  publications,
  role,
  onCreateAnnouncement,
  onCreateAssignment,
}) => {
  return (
    <Box className={styles.wrapper}>
      <Box className={styles.actions} data-test-id="CourseFeedTab-actions">
        <Button
          variant="outlined"
          onClick={onCreateAnnouncement}
          data-test-id="CourseFeedTab-create-announcement"
          startIcon={<AnnouncementIcon className={styles.icon} />}
          className={styles.btnSecondary}
        >
          Создать объявление
        </Button>

        {role === 'teacher' && (
          <Button
            variant="contained"
            onClick={onCreateAssignment}
            data-test-id="CourseFeedTab-create-assignment"
            startIcon={<AssignmentIcon className={styles.icon} />}
            className={styles.btnPrimary}
          >
            Создать задание
          </Button>
        )}
      </Box>

      <PublicationList publications={publications} />
    </Box>
  );
};
