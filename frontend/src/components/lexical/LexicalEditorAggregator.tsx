import { createContext, useContext, useMemo } from 'react';
import { LexicalEditor } from 'lexical';

/*
 * This Context aggregates multiple Lexical editors that are rendered inside of LexicalEditorAggregatorContextProvider.
 * This is needed to be able to change the contents of the editors outside of them.
 * E.g. in Test Case view when changing the Parameter name we should change the contents of Test Steps.
 */
export const LexicalEditorAggregatorContextProvider: React.FC<
  React.PropsWithChildren
> = (props) => {
  const contextValue: LexicalEditorAggregatorContextType = useMemo(() => {
    const editors: Record<string, LexicalEditor> = {};
    return {
      registerEditor(id, editor, preparationFunction) {
        editors[id] = editor;
        preparationFunction?.(editor);
        return () => {
          delete editors[id];
        };
      },
      executeOnAllEditors(action) {
        Object.keys(editors).forEach((key) => {
          action(key, editors[key]);
        });
      },
    };
  }, []);

  return (
    <LexicalEditorAggregatorContext.Provider value={contextValue}>
      {props.children}
    </LexicalEditorAggregatorContext.Provider>
  );
};

export const useLexicalEditorAggregator = () => {
  const context = useContext(LexicalEditorAggregatorContext);
  if (!context) {
    return null;
  }
  return context;
};

type LexicalEditorAggregatorContextType = {
  /*
   * Returns unregister function
   */
  registerEditor: (
    id: string,
    editor: LexicalEditor,
    preparationFunction?: (editor: LexicalEditor) => void,
  ) => () => void;
  executeOnAllEditors: (
    action: (id: string, editor: LexicalEditor) => void,
  ) => void;
};

export const LexicalEditorAggregatorContext =
  createContext<LexicalEditorAggregatorContextType | null>(null);
