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

interface LexicalViewerProps {
  lexicalState: string;
  className?: string;
}

export function LexicalViewer({ lexicalState, className }: LexicalViewerProps) {
  const [editor, setEditor] = useState<LexicalEditor>(null!);

  useEffect(() => {
    if (editor && !!lexicalState) {
      editor?.update(() => {
        editor.setEditorState(editor.parseEditorState(lexicalState));
      });
    }
  }, [editor, lexicalState]);

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
    editorState: lexicalState,
    editable: false,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <Editor className={className} disableShortcuts={true} />
      <OnChangePlugin onMount={setEditor} />
    </LexicalComposer>
  );
}
