import { forwardRef } from 'react';

export const BeautifulMentionsMenu = forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ children, ...props }, ref) => (
    <ul ref={ref} {...props}>{children}</ul>
  ),
);

export const BeautifulMentionsMenuItem = forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ children, ...props }, ref) => (
    <li ref={ref} {...props}>{children}</li>
  ),
);
