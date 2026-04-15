import { useEventCallback } from '@mui/material';
import { RefObject, useEffect, useRef, useState } from 'react';

export enum OverflowDirection {
  Horizontal,
  Vertical,
}

export const useElementTextOverflow = <T extends HTMLElement>(
  direction: OverflowDirection,
  extraPropsToCheck?: any[],
): [RefObject<T>, boolean] => {
  const ref = useRef<T>(null!);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const checkForOverflow = useEventCallback(() => {
    if (ref.current) {
      if (direction === OverflowDirection.Vertical) {
        setIsOverflowing(ref.current.scrollHeight > ref.current.clientHeight);
      } else {
        setIsOverflowing(ref.current.offsetWidth < ref.current.scrollWidth);
      }
    }
  });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(checkForOverflow);

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref.current, direction, extraPropsToCheck]);

  return [ref, isOverflowing];
};
