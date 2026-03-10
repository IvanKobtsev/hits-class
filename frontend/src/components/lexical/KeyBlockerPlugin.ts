import {
  KEY_DOWN_COMMAND,
  COMMAND_PRIORITY_HIGH,
  LexicalEditor,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useContext, useEffect } from 'react';
import { KeyCombination, normalizeKey } from 'helpers/hotkey/HotkeysUtils';
import { HotkeysContext } from 'helpers/hotkey/HotkeysContextProvider';

export function ContextKeyBlockerPlugin() {
  const [editor] = useLexicalComposerContext();
  const hotKeyContext = useContext(HotkeysContext);
  useLexicalKeyBlocker(hotKeyContext?.usedHotkeys, editor);
  return null;
}

export function KeyBlockerPlugin({
  editor,
  blockedKeys,
  onBlock,
}: {
  editor?: LexicalEditor | null;
  blockedKeys: KeyCombination[];
  onBlock?: (editor: LexicalEditor) => void;
}) {
  useLexicalKeyBlocker(blockedKeys, editor, onBlock);
  return null;
}

const useLexicalKeyBlocker = (
  blockedKeys?: KeyCombination[],
  editor?: LexicalEditor | null,
  onBlock?: (editor: LexicalEditor) => void,
) => {
  useEffect(() => {
    if (!editor || !blockedKeys) {
      return;
    }
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        const isBlocked = blockedKeys.some((blocked) => {
          return (
            (!blocked.ctrlKey || event.ctrlKey === blocked.ctrlKey) &&
            (!blocked.shiftKey || event.shiftKey === blocked.shiftKey) &&
            (!blocked.altKey || event.altKey === blocked.altKey) &&
            normalizeKey(event.code) === blocked.key
          );
        });

        if (isBlocked) {
          onBlock?.(editor);
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor, blockedKeys]);
};
