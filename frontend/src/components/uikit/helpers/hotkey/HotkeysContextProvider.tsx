import { createContext, useContext, useState } from 'react';
import useHotkeys, { UseHotkeysProps } from './useHotkeys';
import { KeyCombination } from './HotkeysUtils';

export const HotkeysContextProvider = (
  props: React.PropsWithChildren<UseHotkeysProps>,
) => {
  const hotkeysResult = useHotkeys(props);
  const [usedHotkeys, setUsedHotkeys] = useState(
    hotkeysResult.usedKeyCombinations,
  );
  return (
    <HotkeysContext.Provider
      value={{
        usedHotkeys,
        setUsedHotkeys,
      }}
    >
      {props.children}
    </HotkeysContext.Provider>
  );
};

type HotkeysContextType = {
  usedHotkeys: KeyCombination[];
  setUsedHotkeys: React.Dispatch<React.SetStateAction<KeyCombination[]>>;
};

export const HotkeysContext = createContext<HotkeysContextType | null>(null);

export const useHotkeysContext = (): HotkeysContextType => {
  const context = useContext(HotkeysContext);
  if (!context) {
    throw new Error(
      'useHotkeysContext must be used within a HotkeysContextProvider',
    );
  }
  return context;
};
