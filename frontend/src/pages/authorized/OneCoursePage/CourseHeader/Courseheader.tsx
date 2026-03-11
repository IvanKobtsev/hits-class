import React from 'react';
import { Box, Typography, Paper, IconButton, Tooltip } from '@mui/material';
import { CourseDto } from 'services/api/api-client';
import { CourseRole } from '../useCourseRole';
import CopyIcon from '../../../../components/lexical/icons/copy.svg?react';
import styles from './Courseheader.module.scss';

type Props = {
  course: CourseDto;
  role: CourseRole;
};

const getColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const h = Math.abs(hash) % 360;

  return `hsl(${h}, 90%, 60%)`;
};

export const CourseHeader: React.FC<Props> = ({ course, role }) => {
  const teacherName = course.owner.legalName;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(course.inviteCode);
  };

  return (
    <Paper
      elevation={0}
      variant="outlined"
      className={styles.wrapper}
    >
      {/* Banner */}
      <Box 
        className={styles.banner}
        style={{ backgroundColor: getColor(course.title) }}
      >
        <Typography
          variant="h5"
          className={styles.title}
          data-test-id="CourseHeader-title"
        >
          {course.title}
        </Typography>
      </Box>

      {/* Info */}
      <Box className={styles.info}>
        {course.description && (
          <Typography
            variant="body2"
            className={styles.description}
            data-test-id="CourseHeader-description"
          >
            {course.description}
          </Typography>
        )}
        
        <Typography
          variant="body2"
          className={styles.teacher}
          data-test-id="CourseHeader-teacher"
        >
          Преподаватель: {teacherName}
        </Typography>

        {role === 'teacher' && (
          <Box
            data-test-id="CourseHeader-invite"
            className={styles.inviteRow}
          >
            <Box className={styles.inviteBox}>
              <Typography variant="body2" className={styles.inviteLabel}>
                Код приглашения:
              </Typography>
              <Typography
                variant="body2"
                className={styles.inviteCode}
                data-test-id="CourseHeader-invite-code"
              >
                {course.inviteCode}
              </Typography>
            </Box>

            <Tooltip title="Скопировать код">
              <IconButton
                size="small"
                onClick={handleCopy}
                className={styles.copyBtn}
                data-test-id="CourseHeader-copy-btn"
              >
                <CopyIcon className={styles.copyIcon}/>
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Paper>
  );
};