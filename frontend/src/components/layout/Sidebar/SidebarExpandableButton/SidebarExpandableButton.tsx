export type SidebarExpandableButtonProps = {
  title: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
  isExpanded: boolean;
};

export const SidebarExpandableButton: React.FC<
  SidebarExpandableButtonProps
> = () => <div></div>;
