import React, { useState } from 'react';
import { Typography, Tabs, Tab } from '@mui/material';
import { Input } from 'components/uikit/inputs/Input';
import { CoursesList } from './CoursesList/CoursesList';
import styles from './CoursesPage.module.scss';

type TabValue = 'all' | 'student' | 'teacher' | 'created';

export const CoursesPage: React.FC = () => {
  const [search, setSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabValue>('all');

  const titleParam = search.trim() !== '' ? search.trim() : undefined;

  const filterParams = {
    whereImStudent: activeTab === 'student' ? true : undefined,
    whereImTeacher: activeTab === 'teacher' ? true : undefined,
    createdByMe: activeTab === 'created' ? true : undefined,
  };

  return (
    <div className={styles.page}>
      <Typography variant="h4" fontWeight={700} data-test-id="CoursesPage-title">
        Мои курсы
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(_, value: TabValue) => setActiveTab(value)}
        data-test-id="CoursesPage-tabs"
        className={styles.tabs}
      >
        <Tab label="Все" value="all" data-test-id="CoursesPage-tab-all" />
        <Tab label="Я студент" value="student" data-test-id="CoursesPage-tab-student" />
        <Tab label="Я преподаватель" value="teacher" data-test-id="CoursesPage-tab-teacher" />
        <Tab label="Созданные мной" value="created" data-test-id="CoursesPage-tab-created" />
      </Tabs>


      <div className={styles.search} data-test-id="CoursesPage-search">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию курса"
          />
        </div>

      <CoursesList title={titleParam} {...filterParams} />
    </div>
  );
};
