import React, { useState } from 'react';
import { Box, IconButton, Menu, MenuItem, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { QueryFactory } from 'services/api';
import {
  usePatchCourseMutation,
  useDeleteCourseMutation,
  getCourseQueryKey,
  getMyCoursesQueryKey,
} from 'services/api/api-client/CourseQuery';
import { Links } from 'application/constants/links';
import styles from './DelAndEditCourseButtons.module.scss';
import { CustomModal } from 'components/uikit/modal/CustomModal';

type Props = {
  courseId: number;
};

export const DelAndEditCourseButtons: React.FC<Props> = ({ courseId }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: currentUser } =
    QueryFactory.UserQuery.useGetCurrentUserInfoQuery();
  const { data: course } = QueryFactory.CourseQuery.useGetCourseQuery(
    courseId,
    {
      throwOnError: false,
    },
  );

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { mutateAsync: patchCourse, isPending: isPatching } =
    usePatchCourseMutation(courseId);
  const { mutateAsync: deleteCourse, isPending: isDeleting } =
    useDeleteCourseMutation(courseId);

  const isOwner =
    !!currentUser && !!course && course.owner.id === currentUser.id;

  if (!isOwner) return null;

  const handleEditOpen = () => {
    setTitle(course!.title);
    setDescription(course!.description);
    setTitleError(null);
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!title.trim()) {
      setTitleError('Введите название курса');
      return;
    }
    await patchCourse(
      { title: title.trim(), description: description.trim() },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: getCourseQueryKey(courseId),
          });
          await queryClient.invalidateQueries({
            queryKey: getMyCoursesQueryKey({}),
          });
          setEditOpen(false);
        },
      },
    );
  };

  const handleDeleteSubmit = async () => {
    await deleteCourse(undefined, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getMyCoursesQueryKey({}),
        });
        await navigate(Links.Authorized.Courses.link());
      },
    });
  };

  return (
    <>
      <>
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          data-test-id="DelAndEditCourseButtons"
          className={styles.menuButton}
        >
            ⋮
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              handleEditOpen();
            }}
            data-test-id="DelAndEditCourseButtons-edit"
          >
            Редактировать
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              setDeleteOpen(true);
            }}
            data-test-id="DelAndEditCourseButtons-delete"
            sx={{ color: 'error.main' }}
          >
            Удалить
          </MenuItem>
        </Menu>
      </>

      <CustomModal
        isOpen={editOpen}
        isBlocking={false}
        title="Редактировать курс"
        onClose={() => setEditOpen(false)}
        buttons="ok-cancel"
        okButtonText={isPatching ? 'Сохранение...' : 'Сохранить'}
        onButtonClick={(btn: 'ok' | 'cancel') => {
          if (btn === 'ok') void handleEditSubmit();
          else setEditOpen(false);
        }}
      >
        <Box className={styles.form}>
          <TextField
            label="Название курса"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleError(null);
            }}
            error={!!titleError}
            helperText={titleError ?? ''}
            fullWidth
            autoFocus
            slotProps={{
              htmlInput: {
                'data-test-id': 'DelAndEditCourseButtons-title-input',
              },
            }}
          />
          <TextField
            label="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            slotProps={{
              htmlInput: {
                'data-test-id': 'DelAndEditCourseButtons-description-input',
              },
            }}
          />
        </Box>
      </CustomModal>

      <CustomModal
        isOpen={deleteOpen}
        isBlocking={false}
        title="Удалить курс"
        onClose={() => setDeleteOpen(false)}
        buttons="ok-cancel"
        okButtonText={isDeleting ? 'Удаление...' : 'Удалить'}
        onButtonClick={(btn: 'ok' | 'cancel') => {
          if (btn === 'ok') void handleDeleteSubmit();
          else setDeleteOpen(false);
        }}
      >
        <Typography>
          Вы уверены что хотите удалить курс <strong>{course?.title}</strong>?
          Это действие необратимо.
        </Typography>
      </CustomModal>
    </>
  );
};
