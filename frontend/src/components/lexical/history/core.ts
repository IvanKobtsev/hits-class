/*
  Compilation of:
  - the original file https://github.com/facebook/lexical/blob/main/packages/lexical-history/src/index.ts
  - #56644 bug fixing PR (https://github.com/dsdeur/lexical/pull/1/files)
  - custom history actions

  Tips:
  - Do not use CAN_REDO_COMMAND, CAN_UNDO_COMMAND. To determine if the undo/redo command can be executed, check the length of the undo/redo stack.
  - Do not use REDO_COMMAND, UNDO_COMMAND. Instead, use the redo and undo functions provided by the history state.
  - If you need to execute a custom action, push it to the redo stack and execute REDO_COMMAND.
 */

import type { EditorState, LexicalEditor, LexicalNode, NodeKey } from 'lexical';
import {
  $isRangeSelection,
  $isRootNode,
  $isTextNode,
  CLEAR_EDITOR_COMMAND,
  CLEAR_HISTORY_COMMAND,
  COMMAND_PRIORITY_EDITOR,
} from 'lexical';

import { mergeRegister } from '@lexical/utils';

type MergeAction = 0 | 1 | 2;
const HISTORY_MERGE = 0;
const HISTORY_PUSH = 1;
const DISCARD_HISTORY_CANDIDATE = 2;

type ChangeType = 0 | 1 | 2 | 3 | 4;
const OTHER = 0;
const COMPOSING_CHARACTER = 1;
const INSERT_CHARACTER_AFTER_SELECTION = 2;
const DELETE_CHARACTER_BEFORE_SELECTION = 3;
const DELETE_CHARACTER_AFTER_SELECTION = 4;

export type HistoryStateEditorEntry = {
  editor: LexicalEditor;
  editorState: EditorState;
};
export type HistoryStateEntry = Map<string, HistoryStateEditorEntry>;

/**
 * Custom action type for history stack.
 * @property act - The action to be executed on redo. If it returns a compensation function, it will be stored in `compensate`.
 * @property compensate - The compensation function to be executed on undo.
 */
export type CustomAction = {
  act: () => (() => void) | void;
  compensate?: () => void;
};

function IsCustomAction(action: any): action is CustomAction {
  return action.act !== undefined;
}

export type HistoryState = {
  current: null | HistoryStateEntry;
  redoStack: Array<HistoryStateEntry | CustomAction>;
  undoStack: Array<HistoryStateEntry | CustomAction>;
};

type IntentionallyMarkedAsDirtyElement = boolean;

function getDirtyNodes(
  editorState: EditorState,
  dirtyLeaves: Set<NodeKey>,
  dirtyElements: Map<NodeKey, IntentionallyMarkedAsDirtyElement>,
): Array<LexicalNode> {
  const nodeMap = editorState._nodeMap;
  const nodes = [];

  for (const dirtyLeafKey of dirtyLeaves) {
    const dirtyLeaf = nodeMap.get(dirtyLeafKey);

    if (dirtyLeaf !== undefined) {
      nodes.push(dirtyLeaf);
    }
  }

  for (const [dirtyElementKey, intentionallyMarkedAsDirty] of dirtyElements) {
    if (!intentionallyMarkedAsDirty) {
      continue;
    }

    const dirtyElement = nodeMap.get(dirtyElementKey);

    if (dirtyElement !== undefined && !$isRootNode(dirtyElement)) {
      nodes.push(dirtyElement);
    }
  }

  return nodes;
}

function getChangeType(
  prevEditorState: null | EditorState,
  nextEditorState: EditorState,
  dirtyLeavesSet: Set<NodeKey>,
  dirtyElementsSet: Map<NodeKey, IntentionallyMarkedAsDirtyElement>,
  isComposing: boolean,
): ChangeType {
  if (
    prevEditorState === null ||
    (dirtyLeavesSet.size === 0 && dirtyElementsSet.size === 0 && !isComposing)
  ) {
    return OTHER;
  }

  const nextSelection = nextEditorState._selection;
  const prevSelection = prevEditorState._selection;

  if (isComposing) {
    return COMPOSING_CHARACTER;
  }

  if (
    !$isRangeSelection(nextSelection) ||
    !$isRangeSelection(prevSelection) ||
    !prevSelection.isCollapsed() ||
    !nextSelection.isCollapsed()
  ) {
    return OTHER;
  }

  const dirtyNodes = getDirtyNodes(
    nextEditorState,
    dirtyLeavesSet,
    dirtyElementsSet,
  );

  if (dirtyNodes.length === 0) {
    return OTHER;
  }

  // Catching the case when inserting new text node into an element (e.g. first char in paragraph/list),
  // or after existing node.
  if (dirtyNodes.length > 1) {
    const nextNodeMap = nextEditorState._nodeMap;
    const nextAnchorNode = nextNodeMap.get(nextSelection.anchor.key);
    const prevAnchorNode = nextNodeMap.get(prevSelection.anchor.key);

    if (
      nextAnchorNode &&
      prevAnchorNode &&
      !prevEditorState._nodeMap.has(nextAnchorNode.__key) &&
      $isTextNode(nextAnchorNode) &&
      nextAnchorNode.__text.length === 1 &&
      nextSelection.anchor.offset === 1
    ) {
      return INSERT_CHARACTER_AFTER_SELECTION;
    }

    return OTHER;
  }

  const nextDirtyNode = dirtyNodes[0];

  const prevDirtyNode = prevEditorState._nodeMap.get(nextDirtyNode.__key);

  if (
    !$isTextNode(prevDirtyNode) ||
    !$isTextNode(nextDirtyNode) ||
    prevDirtyNode.__mode !== nextDirtyNode.__mode
  ) {
    return OTHER;
  }

  const prevText = prevDirtyNode.__text;
  const nextText = nextDirtyNode.__text;

  if (prevText === nextText) {
    return OTHER;
  }

  const nextAnchor = nextSelection.anchor;
  const prevAnchor = prevSelection.anchor;

  if (nextAnchor.key !== prevAnchor.key || nextAnchor.type !== 'text') {
    return OTHER;
  }

  const nextAnchorOffset = nextAnchor.offset;
  const prevAnchorOffset = prevAnchor.offset;
  const textDiff = nextText.length - prevText.length;

  if (textDiff === 1 && prevAnchorOffset === nextAnchorOffset - 1) {
    return INSERT_CHARACTER_AFTER_SELECTION;
  }

  if (textDiff === -1 && prevAnchorOffset === nextAnchorOffset + 1) {
    return DELETE_CHARACTER_BEFORE_SELECTION;
  }

  if (textDiff === -1 && prevAnchorOffset === nextAnchorOffset) {
    return DELETE_CHARACTER_AFTER_SELECTION;
  }

  return OTHER;
}

function isTextNodeUnchanged(
  key: NodeKey,
  prevEditorState: EditorState,
  nextEditorState: EditorState,
): boolean {
  const prevNode = prevEditorState._nodeMap.get(key);
  const nextNode = nextEditorState._nodeMap.get(key);

  const prevSelection = prevEditorState._selection;
  const nextSelection = nextEditorState._selection;
  const isDeletingLine =
    $isRangeSelection(prevSelection) &&
    $isRangeSelection(nextSelection) &&
    prevSelection.anchor.type === 'element' &&
    prevSelection.focus.type === 'element' &&
    nextSelection.anchor.type === 'text' &&
    nextSelection.focus.type === 'text';

  if (
    !isDeletingLine &&
    $isTextNode(prevNode) &&
    $isTextNode(nextNode) &&
    prevNode.__parent === nextNode.__parent
  ) {
    // This has the assumption that object key order won't change if the
    // content did not change, which should normally be safe given
    // the manner in which nodes and exportJSON are typically implemented.
    return (
      JSON.stringify(prevEditorState.read(() => prevNode.exportJSON())) ===
      JSON.stringify(nextEditorState.read(() => nextNode.exportJSON()))
    );
  }
  return false;
}

function createMergeActionGetter(
  editor: LexicalEditor,
  delay: number,
): (
  prevEditorState: null | EditorState,
  nextEditorState: EditorState,
  currentHistoryEntry: null | HistoryStateEditorEntry,
  dirtyLeaves: Set<NodeKey>,
  dirtyElements: Map<NodeKey, IntentionallyMarkedAsDirtyElement>,
  tags: Set<string>,
) => MergeAction {
  let prevChangeTime = Date.now();
  let prevChangeType = OTHER;

  return (
    prevEditorState,
    nextEditorState,
    currentHistoryEntry,
    dirtyLeaves,
    dirtyElements,
    tags,
  ) => {
    const changeTime = Date.now();

    // If applying changes from history stack there's no need
    // to run history logic again, as history entries already calculated
    if (tags.has('historic')) {
      prevChangeType = OTHER;
      prevChangeTime = changeTime;
      return DISCARD_HISTORY_CANDIDATE;
    }

    const changeType = getChangeType(
      prevEditorState,
      nextEditorState,
      dirtyLeaves,
      dirtyElements,
      editor.isComposing(),
    );

    const mergeAction = (() => {
      const isSameEditor =
        currentHistoryEntry === null || currentHistoryEntry.editor === editor;
      const shouldPushHistory = tags.has('history-push');
      const shouldMergeHistory =
        !shouldPushHistory && isSameEditor && tags.has('history-merge');

      if (shouldMergeHistory) {
        return HISTORY_MERGE;
      }

      if (prevEditorState === null) {
        return HISTORY_PUSH;
      }

      const selection = nextEditorState._selection;
      const hasDirtyNodes = dirtyLeaves.size > 0 || dirtyElements.size > 0;

      if (!hasDirtyNodes) {
        if (selection !== null) {
          return HISTORY_MERGE;
        }

        return DISCARD_HISTORY_CANDIDATE;
      }

      if (
        !shouldPushHistory &&
        changeType !== OTHER &&
        changeType === prevChangeType &&
        changeTime < prevChangeTime + delay &&
        isSameEditor
      ) {
        return HISTORY_MERGE;
      }

      // A single node might have been marked as dirty, but not have changed
      // due to some node transform reverting the change.
      if (dirtyLeaves.size === 1) {
        const dirtyLeafKey = Array.from(dirtyLeaves)[0];
        if (
          isTextNodeUnchanged(dirtyLeafKey, prevEditorState, nextEditorState)
        ) {
          return HISTORY_MERGE;
        }
      }

      return HISTORY_PUSH;
    })();

    prevChangeTime = changeTime;
    prevChangeType = changeType;

    return mergeAction;
  };
}

export const redo = (historyState: HistoryState | undefined) => {
  if (!historyState) return;

  const redoStack = historyState.redoStack;
  const undoStack = historyState.undoStack;

  if (redoStack.length !== 0) {
    const current = historyState.current;
    const historyStateEntry = redoStack.pop();

    if (IsCustomAction(historyStateEntry)) {
      const compensate = historyStateEntry.act();
      if (compensate) historyStateEntry.compensate = compensate;
      undoStack.push(historyStateEntry);
      return;
    }

    if (current !== null) {
      undoStack.push(current);
    }

    historyState.current = historyStateEntry || null;

    if (historyStateEntry) {
      historyStateEntry.forEach((entry) => {
        entry.editor.setEditorState(entry.editorState, {
          tag: 'historic',
        });
      });
    }
  }
};

export const undo = (historyState: HistoryState | undefined) => {
  if (!historyState) return;

  const redoStack = historyState.redoStack;
  const undoStack = historyState.undoStack;
  const undoStackLength = undoStack.length;

  if (undoStackLength !== 0) {
    const current = historyState.current;
    const historyStateEntry = undoStack.pop();

    if (IsCustomAction(historyStateEntry)) {
      historyStateEntry.compensate?.();
      redoStack.push(historyStateEntry);
      return;
    }

    if (current !== null) {
      redoStack.push(current);
    }

    historyState.current = historyStateEntry || null;

    if (historyStateEntry) {
      historyStateEntry.forEach((entry) => {
        entry.editor.setEditorState(entry.editorState, {
          tag: 'historic',
        });
      });
    }
  }
};

function clearHistory(historyState: HistoryState) {
  historyState.undoStack = [];
  historyState.redoStack = [];
  historyState.current = null;
}

/**
 * Registers necessary listeners to manage undo/redo history stack and related editor commands.
 * It returns `unregister` callback that cleans up all listeners and should be called on editor unmount.
 * @param editor - The lexical editor.
 * @param historyState - The history state, containing the current state and the undo/redo stack.
 * @param delay - The time (in milliseconds) the editor should delay generating a new history stack,
 * instead of merging the current changes with the current stack.
 * @returns The listeners cleanup callback function.
 */
export function registerHistory(
  editor: LexicalEditor,
  historyState: HistoryState,
  delay: number,
): () => void {
  const getMergeAction = createMergeActionGetter(editor, delay);

  // Updates editors in history state if new one with existing _externalKey is added
  const updateEntry = (entry: HistoryStateEditorEntry) => {
    // @ts-ignore
    if (entry.editor._externalKey === editor._externalKey) {
      entry.editor = editor;
    }
  };
  for (const editorState of historyState.undoStack) {
    if (IsCustomAction(editorState)) continue;
    editorState.forEach(updateEntry);
  }
  for (const editorState of historyState.redoStack) {
    if (IsCustomAction(editorState)) continue;
    editorState.forEach(updateEntry);
  }
  historyState.current?.forEach(updateEntry);

  const applyChange = ({
    editorState,
    prevEditorState,
    dirtyLeaves,
    dirtyElements,
    tags,
  }: {
    editorState: EditorState;
    prevEditorState: EditorState;
    dirtyElements: Map<NodeKey, IntentionallyMarkedAsDirtyElement>;
    dirtyLeaves: Set<NodeKey>;
    tags: Set<string>;
  }): void => {
    const current = historyState.current;
    const redoStack = historyState.redoStack;
    const undoStack = historyState.undoStack;
    const editorCurrent =
      current === null ? null : current.get(editor.getKey()) || null;
    const currentEditorState =
      editorCurrent === null ? null : editorCurrent.editorState;
    if (current !== null && editorState === currentEditorState) {
      return;
    }

    const mergeAction = getMergeAction(
      prevEditorState,
      editorState,
      editorCurrent,
      dirtyLeaves,
      dirtyElements,
      tags,
    );

    if (mergeAction === HISTORY_PUSH) {
      if (redoStack.length !== 0) {
        historyState.redoStack = [];
      }

      if (current !== null) {
        undoStack.push(current);
        historyState.current = null;
      }
    } else if (mergeAction === DISCARD_HISTORY_CANDIDATE) {
      return;
    }

    if (historyState.current) {
      historyState.current.set(editor.getKey(), {
        editor,
        editorState,
      });
    } else {
      historyState.current = new Map([
        [editor.getKey(), { editor, editorState }],
      ]);
    }
  };

  return mergeRegister(
    editor.registerCommand(
      CLEAR_EDITOR_COMMAND,
      () => {
        clearHistory(historyState);
        return false;
      },
      COMMAND_PRIORITY_EDITOR,
    ),
    editor.registerCommand(
      CLEAR_HISTORY_COMMAND,
      () => {
        clearHistory(historyState);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    ),
    editor.registerUpdateListener(applyChange),
  );
}

/**
 * Creates an empty history state.
 * @returns - The empty history state, as an object.
 */
export function createEmptyHistoryState(): HistoryState {
  return {
    current: null,
    redoStack: [],
    undoStack: [],
  };
}
