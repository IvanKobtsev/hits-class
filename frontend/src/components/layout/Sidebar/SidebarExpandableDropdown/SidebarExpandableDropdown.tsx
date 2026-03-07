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
> = () => <div></div>;
