import {
  BeautifulMentionsMenu,
  BeautifulMentionsMenuItem,
} from '../../../testStepsTable/parameters/BeautifulMentionsMenu.tsx';
import { useEventCallback } from '@mui/material';
import {
  BeautifulMentionsItem,
  BeautifulMentionsPlugin,
} from 'lexical-beautiful-mentions';
import { QueryFactory } from 'services/api';

const userMentionTriggers = ['@'];
const UserPunctuation = '.,*?$|#{}()^/!%\'"~=<>:;@';

export const UserMentionsPlugin = () => {
  const usersQuery = QueryFactory.TeamQuery.useSearchUsersQuery();

  const onSearch = useEventCallback(async (_, queryString?: string | null) => {
    const results: BeautifulMentionsItem[] =
      usersQuery.data
        ?.filter(
          (user) =>
            user.email !== null &&
            user.fullName
              .toLowerCase()
              .includes(queryString?.toLowerCase() ?? ''),
        )
        .map((user) => ({
          value: user.fullName,
          display: user.fullName,
          userId: user.id,
        })) ?? [];

    return results;
  });

  return (
    <>
      <BeautifulMentionsPlugin
        menuComponent={BeautifulMentionsMenu}
        menuItemComponent={BeautifulMentionsMenuItem}
        allowSpaces={true}
        showCurrentMentionsAsSuggestions
        insertOnBlur={false}
        punctuation={UserPunctuation}
        showMentionsOnDelete
        triggers={userMentionTriggers}
        onSearch={onSearch}
      />
    </>
  );
};
