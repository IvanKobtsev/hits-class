import React from 'react';
import styles from './SidebarExpandableButton.module.scss';

export type SidebarExpandableButtonProps = {
  title: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
  isExpanded: boolean;
};

export const SidebarExpandableButton: React.FC<SidebarExpandableButtonProps> = ({
  title,
  icon: Icon,
  onClick,
  isExpanded,
}) => (
  <button type="button" onClick={onClick} className={styles.button}>
    <Icon data-test-id="sidebar-expandable-button-icon" className={styles.icon} />
    {isExpanded && (
      <span data-test-id="sidebar-expandable-button-title" className={styles.title}>
        {title}
      </span>
    )}
  </button>
);
