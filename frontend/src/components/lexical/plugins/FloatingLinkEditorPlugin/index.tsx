/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import styles from './index.module.scss';

import {
  $createLinkNode,
  $isAutoLinkNode,
  $isLinkNode,
  TOGGLE_LINK_COMMAND,
} from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isLineBreakNode,
  $isRangeSelection,
  $setSelection,
  BaseSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  ElementNode,
  getDOMSelection,
  KEY_ESCAPE_COMMAND,
  LexicalEditor,
  SELECTION_CHANGE_COMMAND,
  TextNode,
} from 'lexical';
import { Dispatch, useCallback, useEffect, useRef, useState } from 'react';
import * as React from 'react';
import { createPortal } from 'react-dom';

import { getSelectedNode } from '../../utils/getSelectedNode';
import { setFloatingElemPositionForLinkEditor } from '../../utils/setFloatingElemPositionForLinkEditor';
import { sanitizeUrl } from '../../utils/url';
import { Button, ButtonColor } from 'components/uikit/buttons/Button.tsx';
import { Input } from 'components/uikit/inputs/Input.tsx';
import { Field } from 'components/uikit/Field.tsx';
import { useTriggerOnClickOutsideElement } from 'helpers/useTriggerOnClickOutsideElement.ts';
import { useScopedTranslation } from 'application/localization/useScopedTranslation.ts';
import clsx from 'clsx';
import { useScrollerContext } from '../../ScrollerContext';

function FloatingLinkEditor({
  editor,
  isLink,
  setIsLink,
  anchorElem,
}: {
  editor: LexicalEditor;
  isLink: boolean;
  setIsLink: Dispatch<boolean>;
  anchorElem: HTMLElement;
}): React.JSX.Element {
  const editorRef = useRef<HTMLDivElement>(null!);
  const targetRectRef = useRef<DOMRect | undefined>(undefined);
  const [hidden, setHidden] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [editedLinkUrl, setEditedLinkUrl] = useState('https://');
  const [lastSelection, setLastSelection] = useState<BaseSelection | null>(
    null,
  );
  const lastSelectionParentElement = useRef<HTMLElement | null | undefined>(
    null,
  );
  const i18n = useScopedTranslation('Components.LexicalToolbar');
  const { anchorElement } = useScrollerContext();

  useTriggerOnClickOutsideElement(
    editorRef,
    () => {
      setIsLink(false);
      clearNodesStyle();
    },
    isLink,
  );

  // Todo: consider about another way to clear nodes style
  const clearNodesStyle = useCallback(() => {
    const rootElement = editor.getRootElement();
    const highlightedLink = rootElement?.querySelectorAll(
      `.${styles.highlighted}`,
    );
    for (const link of highlightedLink ?? []) {
      link.classList.remove(styles.highlighted);
    }
  }, [editor]);

  const $updateLinkEditor = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection);
      const linkParent = $findMatchingParent(node, $isLinkNode);

      if (linkParent) {
        setLinkUrl(linkParent.getURL());
      } else if ($isLinkNode(node)) {
        setLinkUrl(node.getURL());
      } else {
        setLinkUrl('');
      }
      setEditedLinkUrl(linkUrl);
    }
    const editorElem = editorRef.current;
    const nativeSelection = getDOMSelection(editor._window);
    const activeElement = document.activeElement;

    if (editorElem === null) {
      return;
    }

    const rootElement = editor.getRootElement();
    clearNodesStyle();

    if (
      selection !== null &&
      nativeSelection !== null &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode) &&
      editor.isEditable()
    ) {
      const nodes = selection.getNodes();
      nodes.forEach((node) => {
        const nodeParent = (node as ElementNode).getParent();
        if (nodeParent?.getType() === 'link') {
          const domElement = editor.getElementByKey(nodeParent.getKey());
          if (domElement) {
            domElement.className = styles.highlighted;
          }
        }
      });

      if (nativeSelection.anchorNode?.nodeName === '#text') {
        lastSelectionParentElement.current =
          nativeSelection.focusNode?.parentElement;
      }
      setLastSelection(selection);
    } else if (!activeElement) {
      targetRectRef.current = undefined;
      setLastSelection(null);
      setLinkUrl('');
    }

    const scrollerRect = anchorElement?.getBoundingClientRect();

    if (targetRectRef.current && scrollerRect) {
      setHidden(
        (targetRectRef.current.top - scrollerRect.top < 20 ||
          scrollerRect.bottom - targetRectRef.current.bottom < 20) &&
          scrollerRect.height > 175,
      );
    }

    const domRect: DOMRect | undefined =
      lastSelectionParentElement.current?.getBoundingClientRect();

    if (domRect) {
      domRect.y += 30;
      targetRectRef.current = domRect;
    }

    if (targetRectRef.current || rootElement)
      setFloatingElemPositionForLinkEditor(
        targetRectRef.current ?? null,
        editorElem,
        anchorElem,
        'fixed',
      );

    return true;
  }, [anchorElement, editor, linkUrl]);

  const updateFunc = () => {
    editor.getEditorState().read(() => {
      $updateLinkEditor();
    });
  };

  useEffect(() => {
    window.addEventListener('resize', updateFunc);
    anchorElement?.addEventListener('scroll', updateFunc);

    return () => {
      window.removeEventListener('resize', updateFunc);
      anchorElement?.removeEventListener('scroll', updateFunc);
    };
  }, [anchorElement, editor, $updateLinkEditor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateLinkEditor();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateLinkEditor();
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (isLink) {
            setIsLink(false);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [editor, $updateLinkEditor, setIsLink, isLink]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      $updateLinkEditor();
    });
  }, [editor, $updateLinkEditor]);

  const monitorInputInteraction = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Enter') {
      handleLinkSubmission(event);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleLinkSubmission = (
    event:
      | React.KeyboardEvent<HTMLInputElement>
      | React.MouseEvent<HTMLElement>,
  ) => {
    event.preventDefault();
    if (lastSelection !== null) {
      if (linkUrl !== '') {
        editor.update(() => {
          editor.dispatchCommand(
            TOGGLE_LINK_COMMAND,
            sanitizeUrl(editedLinkUrl),
          );
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const parent = getSelectedNode(selection).getParent();
            if ($isAutoLinkNode(parent)) {
              const linkNode = $createLinkNode(parent.getURL(), {
                rel: parent.__rel,
                target: parent.__target,
                title: parent.__title,
              });
              parent.replace(linkNode, true);
            }

            // Put selection after the link to hide the link editor
            const nextSibling = parent?.getNextSibling() as TextNode | null;
            if (nextSibling) {
              selection.setTextNodeRange(nextSibling, 0, nextSibling, 0);
            } else {
              $setSelection(null);
            }
          }
        });
      }
      setEditedLinkUrl('https://');
      setIsLink(false);
    }
  };

  return (
    <div
      data-test-id={!hidden && 'floating-link-editor'}
      ref={editorRef}
      className={clsx(hidden && styles.hidden, styles.linkEditor)}
    >
      {!isLink ? null : (
        <div className={styles.editModeWrapper}>
          <Field
            title={i18n.t('link_field')}
            childrenWrapperClassName={styles.linkInputWrapper}
            className={styles.linkInputField}
          >
            <Input
              onClick={(e) => e.stopPropagation()}
              ref={inputRef}
              className={styles.input}
              value={editedLinkUrl}
              onChange={(event) => {
                setEditedLinkUrl(event.target.value);
              }}
              onKeyDown={(event) => {
                monitorInputInteraction(event);
              }}
            />
            <Button
              data-test-id={'floating-link-editor-save-button'}
              color={ButtonColor.Primary}
              title={'Save'}
              onClick={handleLinkSubmission}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

function useFloatingLinkEditorToolbar(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
): React.JSX.Element | null {
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isLink, setIsLink] = useState(false);

  useEffect(() => {
    function $updateToolbar() {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const focusNode = getSelectedNode(selection);
        const focusLinkNode = $findMatchingParent(focusNode, $isLinkNode);
        const focusAutoLinkNode = $findMatchingParent(
          focusNode,
          $isAutoLinkNode,
        );
        if (!(focusLinkNode || focusAutoLinkNode)) {
          setIsLink(false);
          return;
        }
        const badNode = selection
          .getNodes()
          .filter((node) => !$isLineBreakNode(node))
          .find((node) => {
            const linkNode = $findMatchingParent(node, $isLinkNode);
            const autoLinkNode = $findMatchingParent(node, $isAutoLinkNode);
            return (
              (focusLinkNode && !focusLinkNode.is(linkNode)) ||
              (linkNode && !linkNode.is(focusLinkNode)) ||
              (focusAutoLinkNode && !focusAutoLinkNode.is(autoLinkNode)) ||
              (autoLinkNode &&
                (!autoLinkNode.is(focusAutoLinkNode) ||
                  autoLinkNode.getIsUnlinked()))
            );
          });
        if (!badNode && editor.isEditable() && !isCursorAtEnd(editor)) {
          setIsLink(true);
        } else {
          setIsLink(false);
        }
      }
    }
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          $updateToolbar();
          setActiveEditor(newEditor);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        CLICK_COMMAND,
        (payload) => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = getSelectedNode(selection);
            const linkNode = $findMatchingParent(node, $isLinkNode);
            if ($isLinkNode(linkNode) && (payload.metaKey || payload.ctrlKey)) {
              window.open(linkNode.getURL(), '_blank');
              return true;
            }
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);
  return createPortal(
    <FloatingLinkEditor
      editor={activeEditor}
      isLink={isLink}
      anchorElem={anchorElem}
      setIsLink={setIsLink}
    />,
    anchorElem,
  );
}

export default function FloatingLinkEditorPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement;
}): React.JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  return useFloatingLinkEditorToolbar(editor, anchorElem);
}

function isCursorAtEnd(editor: LexicalEditor) {
  let isAtEnd = false;

  editor.getEditorState().read(() => {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      const anchor = selection.anchor;
      const rootNode = anchor.getNode().getTopLevelElementOrThrow();
      const textContent = rootNode.getTextContent();
      const cursorPosition = anchor.offset;

      isAtEnd = cursorPosition === textContent.length;
    }
  });

  return isAtEnd;
}
