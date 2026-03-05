export type SidebarContextValue = {
  isExpanded: boolean;
  toggle: () => void;
};

export function useSidebar(): SidebarContextValue {
  throw new Error('useSidebar must be used within a SidebarProvider');
}
