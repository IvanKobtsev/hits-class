import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import HomeIcon from 'assets/icons/home.svg?react';
import SchoolIcon from 'assets/icons/school.svg?react';
import PeopleIcon from 'assets/icons/people.svg?react';
import AddIcon from 'assets/icons/add.svg?react';
import LoginIcon from 'assets/icons/login.svg?react';
import { useGetMyCoursesQuery } from 'services/api/api-client/CourseQuery';
import { useGetCurrentUserInfoQuery } from 'services/api/api-client/UserQuery';
import { useSidebar } from './SidebarContext';
import { SidebarExpandableButton } from './SidebarExpandableButton/SidebarExpandableButton';
import { SidebarExpandableDropdown } from './SidebarExpandableDropdown/SidebarExpandableDropdown';
import { CourseListItemInSidebar } from './CourseListItemInSidebar/CourseListItemInSidebar';
import { CreateCourseModal } from './CreateCourseModal/CreateCourseModal';
import { JoinCourseModal } from './JoinCourseModal/JoinCourseModal';
import styles from './Sidebar.module.scss';

export const Sidebar: React.FC = () => {
  const { isExpanded, toggle } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const handleHomeClick = () => {
    if (location.pathname !== '/courses') {
      void navigate('/courses');
    }
  };

  const [isStudyingExpanded, setIsStudyingExpanded] = useState(false);
  const [isTeachingExpanded, setIsTeachingExpanded] = useState(false);
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isJoinCourseOpen, setIsJoinCourseOpen] = useState(false);

  const { data: studyingData } = useGetMyCoursesQuery({ whereImStudent: true });
  const { data: teachingData } = useGetMyCoursesQuery({ whereImTeacher: true });
  const { data: currentUser } = useGetCurrentUserInfoQuery();

  const canCreateCourse = currentUser?.isTeacherSystemWide || currentUser?.isAdmin;

  const studyingCourses = studyingData?.data ?? [];
  const teachingCourses = teachingData?.data ?? [];

  return (
    <aside
      className={`${styles.sidebar}${isExpanded ? ` ${styles.expanded}` : ''}`}
    >
      <nav className={styles.nav}>
        <SidebarExpandableButton
          title="Главная страница"
          icon={HomeIcon}
          onClick={handleHomeClick}
          isExpanded={isExpanded}
        />
        <SidebarExpandableDropdown
          title="Курсы, на которых я обучаюсь"
          icon={SchoolIcon}
          onClick={() => {
            if (!isStudyingExpanded && !isExpanded) toggle();
            setIsStudyingExpanded((prev) => !prev);
          }}
          isExpandedVertically={isStudyingExpanded}
          isExpandedHorizontally={isExpanded}
        >
          {studyingCourses.map((course) => (
            <CourseListItemInSidebar key={course.id} course={course} />
          ))}
        </SidebarExpandableDropdown>
        <SidebarExpandableDropdown
          title="Курсы, которые я преподаю"
          icon={PeopleIcon}
          onClick={() => {
            if (!isTeachingExpanded && !isExpanded) toggle();
            setIsTeachingExpanded((prev) => !prev);
          }}
          isExpandedVertically={isTeachingExpanded}
          isExpandedHorizontally={isExpanded}
        >
          {teachingCourses.map((course) => (
            <CourseListItemInSidebar key={course.id} course={course} />
          ))}
        </SidebarExpandableDropdown>
        {canCreateCourse && (
          <SidebarExpandableButton
            title="Создать курс"
            icon={AddIcon}
            onClick={() => setIsCreateCourseOpen(true)}
            isExpanded={isExpanded}
          />
        )}
        <SidebarExpandableButton
          title="Записаться на курс"
          icon={LoginIcon}
          onClick={() => setIsJoinCourseOpen(true)}
          isExpanded={isExpanded}
        />
      </nav>

      <CreateCourseModal
        isOpen={isCreateCourseOpen}
        onClose={() => setIsCreateCourseOpen(false)}
      />
      <JoinCourseModal
        isOpen={isJoinCourseOpen}
        onClose={() => setIsJoinCourseOpen(false)}
      />
    </aside>
  );
};
