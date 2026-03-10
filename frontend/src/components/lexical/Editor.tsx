/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CharacterLimitPlugin } from '@lexical/react/LexicalCharacterLimitPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

import { useSettings } from './context/SettingsContext';
import { useSharedHistoryContext } from './context/SharedHistoryContext';
import AutocompletePlugin from './plugins/AutocompletePlugin';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin';
import FloatingLinkEditorPlugin from './plugins/FloatingLinkEditorPlugin';
import InlineImagePlugin from './plugins/InlineImagePlugin';
import KeywordsPlugin from './plugins/KeywordsPlugin';
import LinkPlugin from './plugins/LinkPlugin';
import { MaxLengthPlugin } from './plugins/MaxLengthPlugin';
import ContentEditable from './ui/ContentEditable';
import ShortcutsPlugin from './plugins/ShortcutsPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateNodesFromDOM } from '@lexical/html';
import {
  $insertNodes,
  $setSelection,
  EditorState,
  LexicalEditor,
} from 'lexical';
import { HistoryPlugin } from './history/plugin';
import { useLexicalEditorAggregator } from './LexicalEditorAggregator.tsx';
import { createId } from 'components/uikit/type-utils.ts';
import { CAN_USE_DOM } from 'shared/canUseDOM.ts';

// In the browser you can use the native DOMParser API to parse the HTML string.
const parser = new DOMParser();

export default function Editor(props: {
  preparationFunction?: (editor: LexicalEditor) => void;
  initialHtml?: string | null | undefined;
  onInitialHtmlConvertedToNodes?: (state: EditorState) => void;
  id?: string;
  className?: string;
  placeholder?: string;
  placeholderClassName?: string;
  testId?: string;
  disableShortcuts?: boolean;
}): React.JSX.Element {
  const { historyState } = useSharedHistoryContext();
  const {
    settings: {
      isAutocomplete,
      isMaxLength,
      isCharLimit,
      hasLinkAttributes,
      isCharLimitUtf8,
      isRichText,
      showTreeView,
    },
  } = useSettings();
  const isEditable = useLexicalEditable();
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const [isSmallWidthViewport, setIsSmallWidthViewport] =
    useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const lexicalAggregator = useLexicalEditorAggregator();
  useEffect(() => {
    return lexicalAggregator?.registerEditor(
      props.id ?? createId(),
      editor,
      props.preparationFunction,
    );
  }, [editor]);
  const [activeEditor] = useState(editor);

  // We need to save _externalKey to restore history state consistency when step (with Editor component) is deleted
  // See: registerHistory in src/components/lexical/history/core.ts
  useEffect(() => {
    // @ts-ignore
    if (props.id && editor._externalKey !== props.id) {
      editor.update(() => {
        // @ts-ignore
        editor._externalKey = props.id;
      });
    }
  }, [props.id, editor]);

  const wasInitialized = useRef(false);
  useEffect(() => {
    if (wasInitialized.current) return;
    if (props.initialHtml) {
      wasInitialized.current = true;
      editor.update(
        () => {
          const html = props.initialHtml === '<BR/>' ? '' : props.initialHtml;
          const dom = parser.parseFromString(html!, 'text/html');

          const nodes = $generateNodesFromDOM(editor, dom);
          $insertNodes(nodes);
          $setSelection(null);
        },
        { tag: 'historic' },
      );
    }
  }, []);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport =
        CAN_USE_DOM && window.matchMedia('(max-width: 1025px)').matches;

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    updateViewPortWidth();
    window.addEventListener('resize', updateViewPortWidth);

    return () => {
      window.removeEventListener('resize', updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);
  return (
    <>
      {isRichText && !props.disableShortcuts && (
        <ShortcutsPlugin editor={activeEditor} />
      )}
      <div
        className={`editor-container ${showTreeView ? 'tree-view' : ''} ${
          !isRichText ? 'plain-text' : ''
        }`}
      >
        {isMaxLength && <MaxLengthPlugin maxLength={30} />}
        <KeywordsPlugin />
        <AutoLinkPlugin />
        {isRichText ? (
          <>
            <HistoryPlugin externalHistoryState={historyState} />
            <RichTextPlugin
              contentEditable={
                <div className="editor-scroller">
                  <div
                    className="editor"
                    ref={onRef}
                    style={{ position: 'relative' }}
                  >
                    <ContentEditable
                      testId={props.testId}
                      placeholder={props.placeholder ?? ''}
                      className={props.className}
                      placeholderClassName={props.placeholderClassName}
                    />
                  </div>
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <CodeHighlightPlugin />
            <ListPlugin />
            <TabIndentationPlugin maxIndent={16} />
            <InlineImagePlugin />
            <LinkPlugin hasLinkAttributes={hasLinkAttributes} />
            <ClickableLinkPlugin disabled={isEditable} />
            {floatingAnchorElem && !isSmallWidthViewport && (
              <FloatingLinkEditorPlugin anchorElem={floatingAnchorElem} />
            )}
          </>
        ) : (
          <>
            <PlainTextPlugin
              contentEditable={
                <ContentEditable
                  placeholder={props.placeholder ?? ''}
                  testId={props.testId}
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin externalHistoryState={historyState} />
          </>
        )}
        {(isCharLimit || isCharLimitUtf8) && (
          <CharacterLimitPlugin
            charset={isCharLimit ? 'UTF-16' : 'UTF-8'}
            maxLength={5}
          />
        )}
        {isAutocomplete && <AutocompletePlugin />}
      </div>
    </>
  );
}
