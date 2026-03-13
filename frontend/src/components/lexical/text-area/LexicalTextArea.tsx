import { LexicalEditorIntegration } from '../LexicalEditorIntegration.tsx';
import styles from './LexicalTextArea.module.scss';
import { ToolbarContext } from '../context/ToolbarContext.tsx';
import { SharedHistoryContext } from '../context/SharedHistoryContext.tsx';
import ToolbarPlugin from '../plugins/ToolbarPlugin';
import { useEffect, useState } from 'react';
import { EditorState, type LexicalEditor } from 'lexical';
import clsx from 'clsx';
import { Controller, FieldValues, Path } from 'react-hook-form';
import { AdvancedFormReturnType } from 'helpers/form/useAdvancedForm.ts';
import { Field, FieldProps } from '../../uikit/Field.tsx';
import { ScrollerContextProvider } from 'helpers/ScrollerContext.tsx';

export interface RichTextAreaProps {
  value?: string;
  onChange?: (state: string) => void;
  placeholder?: string;
  defaultValue?: string;
  updater?: number;
  className?: string;
  editorClassName?: string;
  testId?: string;
}

export function LexicalTextArea({
  placeholder,
  value,
  onChange,
  defaultValue,
  updater,
  className,
  editorClassName,
  testId,
}: RichTextAreaProps) {
  const [activeEditor, setActiveEditor] = useState<LexicalEditor>(null!);
  const [editor, setEditor] = useState<LexicalEditor>(null!);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (editor && !!defaultValue) {
      editor?.update(() => {
        editor.setEditorState(editor.parseEditorState(defaultValue));
      });
    }
  }, [editor, defaultValue, updater]);

  return (
    <ScrollerContextProvider className={className}>
      <SharedHistoryContext>
        <ToolbarContext>
          <div className={clsx(styles.editor, editorClassName)}>
            <div className={styles.editorInput} data-test-id={testId}>
              <LexicalEditorIntegration
                placeholder={placeholder}
                placeholderClassName={clsx(
                  styles.editorPlaceholder,
                  focused && styles.halfTransparent,
                )}
                onMount={(editor) => {
                  setEditor(editor);
                  setActiveEditor(editor);
                }}
                onBlur={() => setFocused(false)}
                onFocus={() => setFocused(true)}
                initialState={value}
                onChange={(editorState: EditorState) =>
                  onChange?.(JSON.stringify(editorState.toJSON()))
                }
              />
            </div>
            <ToolbarPlugin
              editor={editor}
              activeEditor={activeEditor}
              setActiveEditor={setActiveEditor}
              enableListFormatting={true}
            />
          </div>
        </ToolbarContext>
      </SharedHistoryContext>
    </ScrollerContextProvider>
  );
}

export interface RichTextAreaControlledProps<T extends FieldValues>
  extends RichTextAreaProps {
  form: AdvancedFormReturnType<T>;
  name: Path<T>;
  fieldProps?: FieldProps;
  testId?: string;
}

export function LexicalTextAreaControlled<T extends FieldValues>({
  form,
  name,
  fieldProps,
  testId,
  ...restProps
}: RichTextAreaControlledProps<T>) {
  const lexicalJsonPropertyName = (name + '.json') as Path<T>;

  const controller = (
    <Controller
      name={lexicalJsonPropertyName}
      control={form.control}
      render={({ field }) => (
        <LexicalTextArea
          value={field.value}
          onChange={field.onChange}
          defaultValue={form.formState.defaultValues?.[name]?.['json']}
          {...restProps}
        />
      )}
    />
  );

  return fieldProps ? <Field {...fieldProps}>{controller}</Field> : controller;
}
