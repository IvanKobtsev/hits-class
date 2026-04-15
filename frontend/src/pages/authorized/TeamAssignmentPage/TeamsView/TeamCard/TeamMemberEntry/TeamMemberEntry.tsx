import styles from './TeamMemberEntry.module.scss';
import { UserDto } from '../../../../../../services/api/api-client.types.ts';
import clsx from 'clsx';
import TruncatingContainer from '../../../../../../components/uikit/truncatingContainer/TruncatingContainer.tsx';
import { IconButton, Menu, MenuItem } from '@mui/material';
import DotsIcon from 'assets/icons/dots.svg?react';
import { MouseEvent, useState } from 'react';

interface TeamMemberEntryProps {
  member?: UserDto | null;
  isCaptain?: boolean;
  color?: 'green' | 'yellow' | 'red' | 'blue';
  canAssignCaptain?: boolean;
  onAssignCaptain?: (member: UserDto) => void | Promise<void>;
}

export function TeamMemberEntry({
  member,
  isCaptain,
  color,
  canAssignCaptain,
  onAssignCaptain,
}: TeamMemberEntryProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (e: MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleAssignCaptain = async () => {
    if (!member || !onAssignCaptain) return;
    handleMenuClose();
    await onAssignCaptain(member);
  };

  return (
    <div
      className={clsx(
        styles.TeamMemberEntry,
        !!member && styles.member,
        isCaptain && styles.captain,
        {
          [styles.green]: color === 'green',
          [styles.yellow]: color === 'yellow',
          [styles.red]: color === 'red',
          [styles.blue]: color === 'blue',
        },
      )}
    >
      {member ? (
        <>
          <div className={styles.name}>
            <TruncatingContainer title={member.legalName} />
            {isCaptain && <span className={styles.captain}>капитан</span>}
          </div>
          <span className={styles.groupNumber}>{member.groupNumber}</span>
          {canAssignCaptain && !isCaptain && onAssignCaptain && (
            <>
              <div className={styles.memberActions}>
                <IconButton
                  size="small"
                  onClick={handleMenuOpen}
                  data-test-id={`TeamMemberEntry-actions-${member.id}`}
                >
                  <DotsIcon width={16} height={16} />
                </IconButton>
              </div>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => void handleAssignCaptain()}>
                  Назначить капитаном
                </MenuItem>
              </Menu>
            </>
          )}
        </>
      ) : (
        'свободный слот'
      )}
    </div>
  );
}
