import React from 'react';
import ArrowDownIcon from 'assets/icons/arrow-down.svg?react';
import styles from './SidebarExpandableDropdown.module.scss';

export type SidebarExpandableDropdownProps = {
  title: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
  isExpandedVertically: boolean;
  isExpandedHorizontally: boolean;
  children?: React.ReactNode;
};

export const SidebarExpandableDropdown: React.FC<
  SidebarExpandableDropdownProps
> = ({
  title,
  icon: Icon,
  onClick,
  isExpandedVertically,
  isExpandedHorizontally,
  children,
}) => (
  <div className={styles.wrapper}>
    <button type="button" onClick={onClick} className={styles.header}>
      <Icon
        data-test-id="sidebar-expandable-dropdown-icon"
        className={styles.icon}
      />
      {isExpandedHorizontally && (
        <>
          <span
            data-test-id="sidebar-expandable-dropdown-title"
            className={styles.title}
          >
            {title}
          </span>
          <ArrowDownIcon
            className={`${styles.chevron}${isExpandedVertically ? ` ${styles.open}` : ''}`}
          />
        </>
      )}
    </button>
    {isExpandedVertically && isExpandedHorizontally && (
      <div className={styles.children}>
        {React.Children.count(children) > 0 ? (
          children
        ) : (
          <span className={styles.noCourses}>-- No courses --</span>
        )}
      </div>
    )}
  </div>
);
