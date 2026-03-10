import { BeautifulMentionsTheme } from 'lexical-beautiful-mentions';
import styles from './BeautifulMentionsMenu.module.scss';

export const getBeautifulMentionsTheme = () => {
  const beautifulMentionsTheme: BeautifulMentionsTheme = {
    '@': styles.chip,
  };

  return { beautifulMentions: beautifulMentionsTheme };
};
