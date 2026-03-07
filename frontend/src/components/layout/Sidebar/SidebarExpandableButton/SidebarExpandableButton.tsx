import React from 'react';

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
  <button type="button" onClick={onClick}>
    <Icon data-test-id="sidebar-expandable-button-icon" />
    {isExpanded && (
      <span data-test-id="sidebar-expandable-button-title">{title}</span>
    )}
  </button>
);
