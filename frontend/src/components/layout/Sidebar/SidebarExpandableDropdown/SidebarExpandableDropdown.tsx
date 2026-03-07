import React from 'react';

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
> = ({ title, icon: Icon, onClick, isExpandedVertically, isExpandedHorizontally, children }) => (
  <div>
    <button type="button" onClick={onClick}>
      <Icon data-test-id="sidebar-expandable-dropdown-icon" />
      {isExpandedHorizontally && (
        <span data-test-id="sidebar-expandable-dropdown-title">{title}</span>
      )}
    </button>
    {isExpandedVertically && isExpandedHorizontally && children}
  </div>
);
