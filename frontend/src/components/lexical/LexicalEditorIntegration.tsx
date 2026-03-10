/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  InitialConfigType,
  InitialEditorStateType,
  LexicalComposer,
} from '@lexical/react/LexicalComposer';

import { FlashMessageContext } from './context/FlashMessageContext';
import { SettingsContext } from './context/SettingsContext';
import Editor from './Editor';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import { TableContext } from './plugins/TablePlugin';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';
import { OnChangePlugin, OnChangePluginProps } from './OnChangePlugin';
import clsx from 'clsx';
import styles from './lexical.module.scss';
import { createEditor, EditorState, LexicalEditor } from 'lexical';
import { useRef } from 'react';
import { BeautifulMentionNode } from 'lexical-beautiful-mentions';
import { getBeautifulMentionsTheme } from './getBeautifulMentionsTheme';
import { ContextKeyBlockerPlugin } from './KeyBlockerPlugin';

console.warn(
  'If you are profiling the playground app, please ensure you turn off the debug view. You can disable it by pressing on the settings control in the bottom-left of your screen and toggling the debug view setting.',
);

export const LexicalEditorIntegration = (props: {
  preparationFunction?: (editor: LexicalEditor) => void;
  onChange?: OnChangePluginProps['onChange'];
  onInitialHtmlConvertedToNodes?: (state: EditorState) => void;
  onChangeHtml?: OnChangePluginProps['onChangeHtml'];
  onFocus?: OnChangePluginProps['onFocus'];
  onBlur?: OnChangePluginProps['onBlur'];
  onMount?: OnChangePluginProps['onMount'];
  onEditor?: OnChangePluginProps['onEditor'];
  initialState?: InitialEditorStateType;
  initialHtmlState?: string | null;
  editable?: boolean;
  id?: string;
  editorClassName?: string;
  disableBeautifulMentions?: boolean;
  enableUserMentions?: boolean;
  placeholder?: string;
  placeholderClassName?: string;
  testId?: string;
}) => {
  let initialState = props.initialState;
  if (props.initialHtmlState && props.initialHtmlState.startsWith('{"root"')) {
    initialState = props.initialHtmlState;
  }

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
    editorState: initialState,
    editable: props.editable,
  };
  const isFirstChange = useRef(true);

  return (
    <SettingsContext>
      <FlashMessageContext>
        <LexicalComposer initialConfig={initialConfig}>
          <TableContext>
            <div
              style={{ maxWidth: 'fit-content' }}
              className={clsx(
                styles.editorShell,
                !props.editable && styles.readOnlyEditor,
              )}
            >
              <ContextKeyBlockerPlugin />
              <Editor
                preparationFunction={props.preparationFunction}
                testId={props.testId ?? 'lexical-editor'}
                initialHtml={initialState ? undefined : props.initialHtmlState}
                id={props.id}
                className={props.editorClassName}
                placeholder={props.placeholder}
                placeholderClassName={props.placeholderClassName}
              />
              <OnChangePlugin
                onChange={(state) => {
                  if (isFirstChange.current) {
                    props.onInitialHtmlConvertedToNodes?.(state);
                  } else {
                    props.onChange?.(state);
                  }
                  isFirstChange.current = false;
                }}
                onChangeHtml={props.onChangeHtml}
                onFocus={props.onFocus}
                onBlur={props.onBlur}
                onMount={props.onMount}
                onEditor={props.onEditor}
              />
            </div>
          </TableContext>
        </LexicalComposer>
      </FlashMessageContext>
    </SettingsContext>
  );
};

export const createEmptyEditor = (initialstate?: string) => {
  const editor = createEditor({
    nodes: [...PlaygroundNodes, BeautifulMentionNode],
    theme: {
      ...PlaygroundEditorTheme,
      ...getBeautifulMentionsTheme(),
    },
  });

  if (initialstate) {
    const editorState = editor.parseEditorState(initialstate);
    editor.setEditorState(editorState);
  }
  return editor;
};
