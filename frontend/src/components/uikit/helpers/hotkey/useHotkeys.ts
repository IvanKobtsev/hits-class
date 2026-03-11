import { useCallback, useEffect } from 'react';
import * as utils from './HotkeysUtils';

export type UseHotkeysResult = {
  usedKeyCombinations: utils.KeyCombination[];
};

export type UseHotkeysProps = {
  hotkeys: Partial<Record<utils.KeyboardShortcut, utils.HotkeyCallback>>;
  options?: utils.HotkeyOptions;
  deps?: React.DependencyList;
};

const useHotkeys = (props: UseHotkeysProps): UseHotkeysResult => {
  const {
    preventDefault = true,
    stopPropagation = true,
    enabled = true,
    target = null,
  } = props.options ?? {};

  const handleKeyDown = useCallback(
    (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (!enabled) return;

      for (const [hotkey, callback] of Object.entries(props.hotkeys)) {
        if (utils.matchesHotkey(keyboardEvent, hotkey)) {
          if (preventDefault) keyboardEvent.preventDefault();
          if (stopPropagation) keyboardEvent.stopPropagation();

          callback(keyboardEvent);
          break;
        }
      }
    },
    [
      props.hotkeys,
      preventDefault,
      stopPropagation,
      enabled,
      ...(props.deps || []),
    ],
  );

  useEffect(() => {
    const element = target || document;

    element.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, target]);

  return {
    usedKeyCombinations: Object.keys(props.hotkeys).map(
      utils.parseKeyCombination,
    ),
  };
};

export default useHotkeys;
