import {
  BeautifulMentionsMenuItemProps,
  BeautifulMentionsMenuProps,
} from 'lexical-beautiful-mentions';
import { forwardRef } from 'react';
import styles from './BeautifulMentionsMenu.module.scss';
import { createId } from 'components/uikit/type-utils.ts';

export const BeautifulMentionsMenu = (props: BeautifulMentionsMenuProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { loading, ...other } = props;
  return (
    <ul
      className={styles.menu}
      {...other}
      data-beautiful-mentions-menu
      data-test-id="beautiful-mentions-menu"
    />
  );
};

export const BeautifulMentionsMenuItem = forwardRef<
  HTMLLIElement,
  BeautifulMentionsMenuItemProps
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
>(({ selected, item, itemValue, display, ...props }, ref) => (
  <li
    className={styles.menuItem}
    key={createId()}
    {...props}
    ref={ref}
    data-selected={selected}
  >
    {display}
  </li>
));
