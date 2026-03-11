import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { createEmptyHistoryState, HistoryState, registerHistory } from './core';
import { useEffect, useMemo } from 'react';
import type { LexicalEditor } from 'lexical';

export function HistoryPlugin({
  delay,
  externalHistoryState,
}: {
  delay?: number;
  externalHistoryState?: HistoryState;
}): null {
  const [editor] = useLexicalComposerContext();
  useHistory(editor, externalHistoryState, delay);

  return null;
}

function useHistory(
  editor: LexicalEditor,
  externalHistoryState?: HistoryState,
  delay = 1000,
): void {
  const historyState: HistoryState = useMemo(
    () => externalHistoryState || createEmptyHistoryState(),
    [externalHistoryState],
  );

  useEffect(() => {
    return registerHistory(editor, historyState, delay);
  }, [delay, editor, historyState]);
}
