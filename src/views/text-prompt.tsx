// A single line input on the screen slot, optionally masked.

import { Box, type Key, Text, useInput } from 'ink';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { LineEditor } from '../machines/line-editor.js';
import { LineEditorView } from './line-editor-view.js';

/** The text prompt contract. */
export interface TextPromptProps {
  /** The prompt label. */
  label: string;
  /** A dimmed line under the input. */
  hint?: string;
  /** The character the value renders as, for a secret. */
  mask?: string;
  /** Called with the entered line. */
  onSubmit: (value: string) => void;
  /** Called on escape or ctrl+c. */
  onCancel: () => void;
}

/**
 * Renders the input. The editor state is ephemeral: it stays inside the
 * widget and resets on unmount. A masked value renders as the mask character
 * repeated, and the caret keeps its position.
 *
 * @param props - The component props.
 * @returns The input element.
 */
export function TextPrompt(props: TextPromptProps): ReactElement {
  const [editor, setEditor] = useState(() => LineEditor.create());
  useInput((input, key) => apply(input, key, editor, setEditor, props));
  const display =
    props.mask === undefined
      ? editor.value
      : props.mask.repeat(editor.value.length);
  return (
    <Box flexDirection="column">
      <Box>
        <Text color="cyan">{props.label}: </Text>
        <LineEditorView cursor={editor.cursor} value={display} />
      </Box>
      {props.hint === undefined ? null : <Text dimColor>{props.hint}</Text>}
    </Box>
  );
}

/**
 * Applies one keystroke. Escape and ctrl+c cancel, enter submits, and the
 * rest goes to the editor.
 *
 * @param input - The printable characters of the keystroke.
 * @param key - The special-key flags.
 * @param editor - The current editor.
 * @param setEditor - Replaces the editor.
 * @param props - The component props.
 * @returns Nothing.
 */
function apply(
  input: string,
  key: Key,
  editor: LineEditor,
  setEditor: (next: LineEditor) => void,
  props: TextPromptProps,
): void {
  if (key.escape || (key.ctrl && input === 'c')) {
    props.onCancel();
    return;
  }
  const next = editor.key(input, key);
  if (next.submitted === undefined) {
    setEditor(next);
    return;
  }
  props.onSubmit(next.submitted);
}
