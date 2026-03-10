import { Tooltip, TooltipProps } from '@mui/material';
import { withStyles } from '@mui/styles';
import styles from './Tooltip.module.scss';
import React from 'react';

// ToDo: find a way to use variables from SCSS
const _tooltip = withStyles({
  tooltipPlacementTop: {
    marginBottom: '4px !important',
  },
  tooltip: {
    backgroundColor: 'rgba(22, 27, 27, 0.8) !important',
    backdropFilter: 'blur(4px)',
    boxShadow: '0px 4px 16px rgba(0, 95, 76, 0.12)',
    fontSize: '14px !important',
    fontFamily: 'Figtree, sans-serif !important',
    lineHeight: '20px',
    fontWeight: '400 !important',
  },
})(Tooltip);

const _lightTooltip = withStyles({
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.8) !important',
  },
})(_tooltip);

export const LightTooltip = _lightTooltip;

export const DefaultTooltip = _tooltip;

export const CaptionTooltip = (props: TooltipProps & { caption: string }) => {
  const { caption, title, ...rest } = props;
  return (
    <_tooltip
      {...rest}
      title={
        <div className={styles.captionTooltipTitle}>
          <div className={styles.caption}>{caption}</div>
          {title}
        </div>
      }
    />
  );
};

export const HotkeyButtonTooltip = (
  props: Omit<TooltipProps, 'title'> & {
    text: string;
    hotkey?: string;
    children: React.ReactElement;
  },
) => {
  const { text, hotkey, children, ...rest } = props;

  const isDisabled =
    React.isValidElement(children) && (children.props as any).disabled;

  return isDisabled ? (
    children
  ) : (
    <DefaultTooltip
      {...rest}
      title={
        <div className={styles.tooltipWrapper}>
          <span className={styles.tooltipText}>{text}</span>
          {hotkey && <span className={styles.tooltipHotkey}>{hotkey}</span>}
        </div>
      }
      placement={'top'}
      enterDelay={500}
    >
      <span>{children}</span>
    </DefaultTooltip>
  );
};
