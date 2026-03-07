export type CurrentUser = {
  name: string;
};

export function useCurrentUser(): CurrentUser {
  throw new Error('useCurrentUser must be used within an auth context');
}
