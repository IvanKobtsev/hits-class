import {
  BeautifulMentionsMenu,
  BeautifulMentionsMenuItem,
} from './BeautifulMentionsMenu.tsx';
import {
  $createTextNode,
  $getRoot,
  ElementNode,
  LexicalNode,
  ParagraphNode,
  TextNode,
  type LexicalEditor,
} from 'lexical';
import {
  $createBeautifulMentionNode,
  $isBeautifulMentionNode,
  BeautifulMentionNode,
  BeautifulMentionsItem,
  BeautifulMentionsPlugin,
} from 'lexical-beautiful-mentions';
import { useContext, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ParameterRow } from './IterationSelector';
import { useEventCallback } from '@mui/material';
import { TestCaseViewContext } from './TestCaseViewContextProvider';
import { toast } from 'react-toastify';
import { useScopedTranslation } from 'application/localization/useScopedTranslation.ts';
import { ParameterKey } from './useSharedParametersTableForm';
import { useSharedHistoryContext } from 'components/lexical/context/SharedHistoryContext.tsx';

export type ParametersPluginProps = {
  getParameterKeys?: () => ParameterKey[];
  addParameter?: (parameter: string) => void;
  hasSharedParameters?: () => boolean;
};

const parameterMentionTriggers = ['@'];

function buildMentionRegex(triggers: string[]): RegExp {
  const escapedTriggers = triggers.map((trigger) =>
    trigger.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
  );

  const triggerGroup = `[${escapedTriggers.join('')}]`;

  return new RegExp(`${triggerGroup}\\w+`, 'g');
}

export const ParameterMentionsPlugin = (props: ParametersPluginProps) => {
  const [editor] = useLexicalComposerContext();
  const { historyState } = useSharedHistoryContext();
  const testCaseViewContext = useContext(TestCaseViewContext);
  const i18n = useScopedTranslation(
    'Page.TestRepository.TestCase.TestCaseView.ErrorMessages',
  );

  const getUnsharedParametersNames = useEventCallback(() => {
    return testCaseViewContext?.parameterKeys?.length !== 0
      ? testCaseViewContext?.parameterKeys
      : null;
  });

  const getSharedParametersNames = useEventCallback(() => {
    return testCaseViewContext?.sharedParameters
      ? Object.keys(
          testCaseViewContext?.sharedParameters?.parameterRows![0]
            .parameterValues ?? [],
        )
      : null;
  });

  const replaceTextWithMentionsInNode = (
    node: TextNode,
    hasChanges: boolean = false,
  ) => {
    const text = node.getTextContent();
    const segments = extractSegments(text);

    if (segments.length > 0 && segments.some((s) => s.type === 'mention')) {
      hasChanges = replaceMentionsInSegments(node, segments) !== null;
    }
    return hasChanges;
  };

  const replaceMentionsInSegments = (
    node: TextNode,
    segments: TextSegment[],
    showError: boolean = false,
  ): BeautifulMentionNode | null => {
    let mentionNodeToReturn: BeautifulMentionNode | null = null;

    const parent = node.getParent();
    const siblings =
      parent?.getChildren().map((n) => (n.is(node) ? null : n)) ?? [];

    const unsharedParameters = getUnsharedParametersNames();
    const sharedParameters = getSharedParametersNames();

    const noSharedParameters =
      sharedParameters &&
      !segments.some((s) => sharedParameters.includes(s.value.substring(1)));

    const noUnsharedParameters =
      unsharedParameters &&
      !segments.some((s) => unsharedParameters.includes(s.value.substring(1)));

    if (noSharedParameters || noUnsharedParameters) {
      if (showError)
        toast.error(
          i18n.t(
            noSharedParameters
              ? 'shared_parameter_not_found'
              : 'unshared_parameter_not_found',
          ),
          {
            toastId: noSharedParameters
              ? 'shared_parameter_not_found'
              : 'unshared_parameter_not_found',
          },
        );
      return null;
    }

    parent?.clear();

    siblings.forEach((sibling) => {
      if (sibling) {
        parent?.append(sibling);
        return;
      }
      segments.forEach((segment) => {
        if (
          segment.type === 'mention' &&
          (sharedParameters?.includes(segment.value.substring(1)) ||
            unsharedParameters?.includes(segment.value.substring(1)))
        ) {
          const mentionNode = $createBeautifulMentionNode(
            segment.value[0],
            segment.value.substring(1),
          );
          parent?.append(mentionNode);
          mentionNodeToReturn = mentionNode;
          return;
        }

        const textNode = $createTextNode(segment.value);
        parent?.append(textNode);
      });
    });

    return mentionNodeToReturn;
  };

  const replaceParameterTextsWithMentions = (editor: LexicalEditor) => {
    let hasChanges = false;
    editor.update(() => {
      const root = $getRoot();

      root.getAllTextNodes().forEach((node) => {
        if (node instanceof TextNode) {
          hasChanges = replaceTextWithMentionsInNode(node, hasChanges);
        }
      });
    });

    return hasChanges;
  };

  // TODO: Fix the bug that sends cursor to the beginning of editor after pressing "Space"
  //  in the editor with non-highlighted mention
  // useEffect(() => {
  //   const unregister = editor.registerCommand(
  //     KEY_SPACE_COMMAND,
  //     () => {
  //       const selection = $getSelection();
  //       if ($isRangeSelection(selection)) {
  //         const node = selection.anchor.getNode();
  //         const segments = extractSegments(node.getTextContent());
  //
  //         if (
  //           node instanceof TextNode &&
  //           segments.some((s) => s.type === 'mention')
  //         ) {
  //           replaceMentionsInSegments(
  //             node,
  //             segments,
  //             parameterMentionTriggers.some((trigger) =>
  //               node
  //                 .getTextContent()
  //                 .substring(
  //                   0,
  //                   selection.getStartEndPoints()?.pop()?.offset ?? 0,
  //                 )
  //                 .split(' ')
  //                 .pop()
  //                 ?.includes(trigger),
  //             ),
  //           )?.selectEnd();
  //         }
  //       }
  //       return false;
  //     },
  //     COMMAND_PRIORITY_LOW,
  //   );
  //
  //   return () => unregister();
  // }, [editor, testCaseViewContext?.sharedParameters]);

  const keys = props.getParameterKeys?.();
  useEffect(() => {
    const hasChanges = replaceParameterTextsWithMentions(editor);
    if (!hasChanges) return;
    requestAnimationFrame(() => {
      if (historyState) historyState.undoStack = [];
      testCaseViewContext?.markCurrentAsUnchanged();
    });
  }, [editor, JSON.stringify(keys)]);

  const onSearch = useEventCallback(
    async (trigger: string, queryString?: string | null) => {
      const results: BeautifulMentionsItem[] = [];
      const parameterKeys = props.getParameterKeys?.();

      if (
        parameterMentionTriggers.every((t) => t !== trigger) ||
        !parameterKeys
      )
        return [];

      Array.from(parameterKeys).forEach((key) => {
        if (key.name.includes(queryString ?? '')) {
          results.push({
            value: key.name,
            display: key.name,
            parameterId: key.id,
          });
        }
      });

      if (
        props.addParameter &&
        !props.hasSharedParameters?.() &&
        !!queryString &&
        Array.from(parameterKeys).every((key) => key.name !== queryString)
      )
        results.push({
          value: queryString,
          display: `Create: "${queryString}"`,
        });

      if (results.length === 0 && props.hasSharedParameters?.()) {
        toast.error(i18n.t('shared_parameter_not_found'), {
          toastId: 'shared_parameter_not_found',
        });
      }

      return results;
    },
  );

  return (
    <BeautifulMentionsPlugin
      menuComponent={BeautifulMentionsMenu}
      menuItemComponent={BeautifulMentionsMenuItem}
      allowSpaces={false}
      insertOnBlur={false}
      menuItemLimit={100}
      showMentionsOnDelete
      triggers={parameterMentionTriggers}
      punctuation={ParameterPunctuation}
      onMenuItemSelect={(item) => {
        const existingParameters = props.getParameterKeys?.();
        if (existingParameters?.some((p) => p.name === item.value)) return;

        props.addParameter?.(item.value);
      }}
      onSearch={onSearch}
    />
  );
};

const ParameterPunctuation = '.,*?$|#{}()^/!%\'"~=<>:;@';
export const ParameterNameValidationRegex = new RegExp(
  `[${ParameterPunctuation}\\s]`,
);

type TextSegment = {
  type: 'text' | 'mention';
  value: string;
};

function extractSegments(text: string): TextSegment[] {
  const result: TextSegment[] = [];
  const mentionRegex = buildMentionRegex(parameterMentionTriggers);
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mentionRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        result.push({ type: 'text', value: textBefore });
      }
    }

    result.push({ type: 'mention', value: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText.trim()) {
      result.push({ type: 'text', value: remainingText });
    }
  }

  return result;
}

/**
 * Replaces parameter mentions with text.
 * Can work with local AND shared parameters.
 * @param editor - lexical editor instance.
 * @param row - parameter row to pick values from.
 * @param sharedParametersNames - shared parameters' names,
 * since under the hood they use IDs.
 */

export const replaceMentionsWithTexts = (
  editor: LexicalEditor,
  row: ParameterRow,
  sharedParametersNames?: { [key: string]: string },
) => {
  editor.update(() => {
    const root = $getRoot();
    root.getChildren().forEach((child) => {
      replaceInTree(child, row, sharedParametersNames);
    });
  });
};

const replaceInTree = (
  node: LexicalNode,
  row: ParameterRow,
  sharedParametersNames?: { [key: string]: string },
) => {
  if (node instanceof BeautifulMentionNode) {
    replaceInNode(node, row, sharedParametersNames);
    return;
  }
  if ('getChildren' in node && typeof node.getChildren === 'function') {
    (node as ElementNode).getChildren().forEach((child) => {
      replaceInTree(child, row, sharedParametersNames);
    });
  }
};

export const replaceInNode = (
  node: LexicalNode,
  row: ParameterRow,
  sharedParametersNames?: { [key: string]: string },
) => {
  if ($isBeautifulMentionNode(node)) {
    const mentionNode = node as BeautifulMentionNode;

    let parameterName = mentionNode.getValue();

    if (sharedParametersNames) {
      parameterName =
        Object.entries(sharedParametersNames).find(
          (entry) => entry[1] === parameterName,
        )?.[0] ?? parameterName;
    }

    const parameterValueAsArray = row.values.filter(
      (kvp) => kvp.key === parameterName,
    );

    const parameterValue =
      parameterValueAsArray.length > 0
        ? parameterValueAsArray[0].value
        : `${mentionNode.__trigger}${parameterName}`;

    mentionNode.replace($createTextNode(parameterValue));
  }
};

export const usedParameterMentions = (editor: LexicalEditor): Set<string> => {
  const mentionsCount: Set<string> = new Set();

  editor.read(() => {
    const root = $getRoot();
    root.getChildren().forEach((node) => {
      if (node instanceof ParagraphNode) {
        node.getChildren().forEach((node) => {
          if ($isBeautifulMentionNode(node)) {
            const mentionNode = node as BeautifulMentionNode;
            const value = mentionNode.getValue();
            mentionsCount.add(value);
          }
        });
      }
    });
  });

  return mentionsCount;
};
