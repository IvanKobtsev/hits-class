import type { EditorState } from 'lexical/LexicalEditorState';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $generateHtmlFromNodes } from '@lexical/html';
import {
  BLUR_COMMAND,
  COMMAND_PRIORITY_LOW,
  FOCUS_COMMAND,
  LexicalEditor,
} from 'lexical';

export type OnChangePluginProps = {
  onEditor?: (editor: LexicalEditor) => void;
  onChange?: (state: EditorState) => void;
  onChangeHtml?: (html: string) => void;
  onFocus?: (editor: LexicalEditor) => void;
  onBlur?: (editor: LexicalEditor) => void;
  onMount?: (editor: LexicalEditor) => void;
};
export function OnChangePlugin({
  onChange,
  onChangeHtml,
  onFocus,
  onBlur,
  onMount,
  onEditor,
}: OnChangePluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    onEditor?.(editor);
  }, [editor, onEditor]);

  useEffect(() => {
    onMount?.(editor);
    // blur editor when it's unmounted
    return () => {
      onBlur?.(editor);
    };
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      if (onChangeHtml) {
        editor.update(() => {
          const htmlString = $generateHtmlFromNodes(editor, null);
          onChangeHtml?.(htmlString);
        });
      }
      onChange?.(editorState);
    });
  }, [editor]);

  useEffect(
    () =>
      editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          onFocus?.(editor);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    [editor],
  );
  useEffect(
    () =>
      editor.registerCommand(
        BLUR_COMMAND,
        (e) => {
          if ((e.relatedTarget as any)?.className?.includes('toolbar-item'))
            return false;
          onBlur?.(editor);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    [editor],
  );
  return null;
}
