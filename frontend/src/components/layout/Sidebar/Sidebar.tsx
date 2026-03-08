import React, { useState } from 'react';
import HomeIcon from 'assets/icons/i.svg?react';
import ListIcon from 'assets/icons/list-ul.svg?react';
import { useGetMyCoursesQuery } from 'services/api/api-client/CourseQuery';
import { useSidebar } from './SidebarContext';
import { SidebarExpandableButton } from './SidebarExpandableButton/SidebarExpandableButton';
import { SidebarExpandableDropdown } from './SidebarExpandableDropdown/SidebarExpandableDropdown';
import { CourseListItemInSidebar } from './CourseListItemInSidebar/CourseListItemInSidebar';
import styles from './Sidebar.module.scss';

export const Sidebar: React.FC = () => {
  const { isExpanded, toggle } = useSidebar();
  const [isStudyingExpanded, setIsStudyingExpanded] = useState(false);
  const [isTeachingExpanded, setIsTeachingExpanded] = useState(false);

  const { data: studyingData } = useGetMyCoursesQuery({ whereImStudent: true });
  const { data: teachingData } = useGetMyCoursesQuery({ whereImTeacher: true });

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
          onClick={toggle}
          isExpanded={isExpanded}
        />
        <SidebarExpandableDropdown
          title="Курсы, на которых я обучаюсь"
          icon={ListIcon}
          onClick={() => setIsStudyingExpanded((prev) => !prev)}
          isExpandedVertically={isStudyingExpanded}
          isExpandedHorizontally={isExpanded}
        >
          {studyingCourses.map((course) => (
            <CourseListItemInSidebar key={course.id} course={course} />
          ))}
        </SidebarExpandableDropdown>
        <SidebarExpandableDropdown
          title="Курсы, которые я преподаю"
          icon={ListIcon}
          onClick={() => setIsTeachingExpanded((prev) => !prev)}
          isExpandedVertically={isTeachingExpanded}
          isExpandedHorizontally={isExpanded}
        >
          {teachingCourses.map((course) => (
            <CourseListItemInSidebar key={course.id} course={course} />
          ))}
        </SidebarExpandableDropdown>
      </nav>
    </aside>
  );
};
