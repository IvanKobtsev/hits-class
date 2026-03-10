import { createContext, useContext, useRef } from 'react';

// For this component to fully serve its purpose, ideally you need to be able to pass a
// function to it which would be triggered when scrolling/resizing the scroller, but
// for now it just provides the scroller itself.
export const ScrollerContextProvider = (
  props: React.PropsWithChildren<ScrollerContextProviderProps>,
) => {
  const { customScrollRef: scrollRef, children, className } = props;
  const internalRef = useRef<HTMLDivElement | null>(null);
  const containerRef = scrollRef ?? internalRef;

  return (
    <ScrollerContext.Provider
      value={{
        anchorElement: containerRef.current,
        anchorElementRef: containerRef,
      }}
    >
      <div className={className} ref={scrollRef ? null : containerRef}>
        {children}
      </div>
    </ScrollerContext.Provider>
  );
};

export const useScrollerContext = () => {
  const context = useContext(ScrollerContext);

  if (!context) return { anchorElement: null, anchorElementRef: null };

  return context;
};

export type ScrollerContextType = {
  anchorElement: HTMLElement | null;
  anchorElementRef: React.RefObject<HTMLDivElement | null>;
};

type ScrollerContextProviderProps = {
  customScrollRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
};

export const ScrollerContext = createContext<ScrollerContextType | null>(null);
