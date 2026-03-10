import { createContext, useContext } from 'react';

const ScrollerContext = createContext<HTMLElement | null>(null);

export function useScrollerContext(): HTMLElement | null {
  return useContext(ScrollerContext);
}

export { ScrollerContext };
