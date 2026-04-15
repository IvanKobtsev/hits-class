import { DefaultTooltip } from 'components/uikit/tooltips/Tooltip.tsx';
import {
  OverflowDirection,
  useElementTextOverflow,
} from 'helpers/useElementTextOverflow.ts';
import styles from './TruncatingContainer.module.scss';
import clsx from 'clsx';
import { DependencyList } from 'react';

type TestCaseTitleProps = {
  title?: string;
  className?: string;
  tooltipPlacement?: TooltipPlacement;
  overflowDirection?: OverflowDirection;
  extraPropsToCheck?: DependencyList;
  testId?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export type TooltipPlacement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end';

export default function TruncatingContainer({
  title,
  className,
  tooltipPlacement,
  overflowDirection,
  extraPropsToCheck,
  testId,
  ...rest
}: TestCaseTitleProps) {
  const [titleRef, isTitleTruncated] =
    useElementTextOverflow<HTMLParagraphElement>(
      overflowDirection ?? OverflowDirection.Horizontal,
      [title, extraPropsToCheck],
    );

  const content = (
    <div
      data-test-id={testId}
      ref={titleRef}
      className={clsx(
        styles.truncatingContainer,
        overflowDirection !== OverflowDirection.Vertical && styles.horizontal,
        className,
      )}
      {...rest}
    >
      {title}
    </div>
  );

  return !isTitleTruncated ? (
    content
  ) : (
    <DefaultTooltip title={title} placement={tooltipPlacement ?? 'top'}>
      {content}
    </DefaultTooltip>
  );
}
