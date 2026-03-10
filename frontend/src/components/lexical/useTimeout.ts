import { useRef } from 'react';

// This hook is just a more convenient way to handle a timer
// that should be cleared on every new call
export function useTimeout() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  function startTimeout(
    callback: (...args: any[]) => void,
    ms: number,
    ...args: any[]
  ) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(callback, ms, ...args);
  }

  function abortTimeout() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  return { startTimeout, abortTimeout, timeoutRef };
}
