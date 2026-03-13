import Editor from './Editor.tsx';
import PlaygroundNodes from './nodes/PlaygroundNodes.ts';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme.ts';
import { BeautifulMentionNode } from 'lexical-beautiful-mentions';
import { getBeautifulMentionsTheme } from './getBeautifulMentionsTheme';
import {
  InitialConfigType,
  LexicalComposer,
} from '@lexical/react/LexicalComposer';
import { OnChangePlugin } from './OnChangePlugin.tsx';
import { useEffect, useState } from 'react';
import { LexicalEditor } from 'lexical';
import { LexicalState } from 'services/api/api-client.types.ts';

const EMPTY_EDITOR_STATE_JSON = JSON.stringify({
  root: {
    children: [
      {
        children: [],
        direction: null,
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
});

function getEditorStateJson(lexicalState: LexicalState | null | undefined): string {
  const json = lexicalState?.json;
  if (json == null || json === '') return EMPTY_EDITOR_STATE_JSON;
  try {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json;
    if (!parsed?.root) return EMPTY_EDITOR_STATE_JSON;
    return typeof json === 'string' ? json : JSON.stringify(parsed);
  } catch {
    return EMPTY_EDITOR_STATE_JSON;
  }
}

interface LexicalViewerProps {
  lexicalState: LexicalState | null | undefined;
  className?: string;
}

export function LexicalViewer({ lexicalState, className }: LexicalViewerProps) {
  const [editor, setEditor] = useState<LexicalEditor>(null!);
  const editorStateJson = getEditorStateJson(lexicalState);

  useEffect(() => {
    if (editor) {
      editor.update(() => {
        editor.setEditorState(editor.parseEditorState(editorStateJson));
      });
    }
  }, [editor, editorStateJson]);

  const initialConfig: InitialConfigType = {
    namespace: 'Page Editor',
    nodes: [...PlaygroundNodes, BeautifulMentionNode],
    onError: (error: Error) => {
      throw error;
    },
    theme: {
      ...PlaygroundEditorTheme,
      ...getBeautifulMentionsTheme(),
    },
    editorState: editorStateJson,
    editable: false,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <Editor className={className} disableShortcuts={true} />
      <OnChangePlugin onMount={setEditor} />
    </LexicalComposer>
  );
}
