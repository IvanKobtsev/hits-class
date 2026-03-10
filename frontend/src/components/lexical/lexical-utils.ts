import {
  $getCaretRange,
  $getChildCaret,
  $getRoot,
  $getSiblingCaret,
  LexicalEditor,
  LexicalNode,
  $insertNodes,
  $createParagraphNode,
} from 'lexical';
import { createEmptyEditor } from 'components/lexical/LexicalEditorIntegration';
import { $generateNodesFromDOM } from '@lexical/html';

export function runForEveryLexicalNode(
  editor: LexicalEditor,
  action: (node: LexicalNode) => void,
) {
  editor.update(() => {
    // this is a proper way to traverse all lexical nodes according to
    // https://lexical.dev/docs/concepts/traversals
    [
      ...$getCaretRange(
        // Start with the arrow pointing towards the first child of root
        $getChildCaret($getRoot(), 'next'),
        // End when the arrow points away from root
        $getSiblingCaret($getRoot(), 'next'),
      ),
    ].forEach((caret) => {
      const node = caret.origin;
      action(node);
    });
  });
}

export async function plainTextToLexicalJSON(text: string) {
  return await new Promise<string>((resolve) => {
    const editor = createEmptyEditor();
    const parser = new DOMParser();
    editor.update(
      () => {
        const dom = parser.parseFromString(text, 'text/html');

        const nodes = $generateNodesFromDOM(editor, dom);
        if (nodes.length === 0) nodes.push($createParagraphNode());
        $insertNodes(nodes);
      },
      {
        onUpdate: () => {
          resolve(JSON.stringify(editor.getEditorState().toJSON()));
        },
      },
    );
  });
}
