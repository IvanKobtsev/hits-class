import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, Tab, Button } from '@mui/material';
import { QueryFactory } from 'services/api';
import { Loading } from 'components/uikit/suspense/Loading';
import { useCourseRole } from './useCourseRole';
import { CourseFeedTab } from './CourseFeedTab/CourseFeedTab';
import { CreateAnnouncementModal } from './CourseFeedTab/CreateAnnouncementModal/CreateAnnouncementModal';
import { CreateAssignmentModal } from './CourseFeedTab/CreateAssignmentModal/CreateAssignmentModal';
import styles from './OneCoursePage.module.scss';
import { CourseHeader } from './CourseHeader/Courseheader';
import { Navigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { exportMarks } from 'services/api/api-client/CourseClient';
import { Links } from 'application/constants/links';
import { GradeList } from './GradeList/GradeList';

type TabValue = 'feed' | 'grades' | 'members';

export const OneCoursePage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const id = Number(courseId);

  const [activeTab, setActiveTab] = useState<TabValue>('feed');
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
  } = QueryFactory.CourseQuery.useGetCourseQuery(id, { throwOnError: false });
  
  const { data: publicationsData, isLoading: pubLoading } =
    QueryFactory.PublicationsQuery.useGetPublicationsQuery({ courseId: id });

  const role = useCourseRole(course);

  const handleExportMarks = async () => {
    const response = await exportMarks(id);

    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = response.fileName ?? `Оценки.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const isLoading = courseLoading || pubLoading;

  if (!courseLoading && courseError) {
    const status = isAxiosError(courseError)
      ? courseError.response?.status
      : null;
    if (status === 403)
      return (
        <Navigate
          to={Links.Authorized.CourseAccessDenied.link({ courseId: id })}
          replace
        />
      );
    return (
      <Navigate
        to={Links.Authorized.CourseNotFound.link({ courseId: id })}
        replace
      />
    );
  }

  return (
    <Loading loading={isLoading}>
      {course && (
        <div className={styles.page}>
          <CourseHeader course={course} role={role} />

          <div className={styles.tabsWrapper}>
            <Tabs
              value={activeTab}
              onChange={(_, v: TabValue) => setActiveTab(v)}
              className={styles.tabs}
              data-test-id="OneCoursePage-tabs"
            >
              <Tab
                label="Лента"
                value="feed"
                data-test-id="OneCoursePage-tab-feed"
              />
              <Tab
                label="Оценки"
                value="grades"
                data-test-id="OneCoursePage-tab-grades"
              />
              <Tab
                label="Участники"
                value="members"
                data-test-id="OneCoursePage-tab-members"
              />
            </Tabs>
          </div>

          <div className={styles.content}>
            {activeTab === 'feed' && (
              <CourseFeedTab
                courseId={id}
                publications={publicationsData?.data ?? []}
                role={role}
                onCreateAnnouncement={() => setIsAnnouncementModalOpen(true)}
                onCreateAssignment={() => setIsAssignmentModalOpen(true)}
              />
            )}
            {activeTab === 'grades' && (
              <div data-test-id="OneCoursePage-grades">
                {role === 'teacher' && (
                  <Button variant="outlined" onClick={handleExportMarks}>
                    Экспорт оценок
                  </Button>
                )}
                {
                  role === 'student' && (
                    <GradeList publications={publicationsData?.data ?? []} />
                  )
                }
              </div>
            )}
            {activeTab === 'members' && (
              <div data-test-id="OneCoursePage-members">
                Участники — в разработке
              </div>
            )}
          </div>
        </div>
      )}
      <CreateAnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
      />
      <CreateAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
      />
    </Loading>
  );
};
