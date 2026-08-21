// Optional glue: useState around the LineEditor plus the keystroke wiring.

import { type Key, useInput } from 'ink';
import { useState } from 'react';
import { LineEditor } from '../machines/line-editor.js';

/** What a keystroke outcome triggers. */
export interface LineHandlers {
  /** A non-empty submitted line, already remembered in the history. */
  onSubmit: (line: string) => void;
  /** Ctrl+c on an empty line. */
  onInterrupt: () => void;
}

/** The hook options. */
export interface LineEditorOptions {
  /** Whether keystrokes are consumed. True when omitted. Set it to false
   * while a screen is open, so the prompt and the screen never both read
   * the same keys. */
  isActive?: boolean;
}

/**
 * Holds one LineEditor for the application and feeds it the keystrokes.
 * The state lives in the calling component.
 *
 * @param handlers - What a submit or an interrupt triggers.
 * @param options - The hook options.
 * @returns The current editor and the setter, for completion.
 */
export function useLineEditor(
  handlers: LineHandlers,
  options: LineEditorOptions = {},
): {
  /** The current editor state. */
  editor: LineEditor;
  /** Replaces the editor, for writing a completed line. */
  setEditor: (editor: LineEditor) => void;
} {
  const [editor, setEditor] = useState(() => LineEditor.create());
  useInput((input, key) => advance(editor, input, key, handlers, setEditor), {
    isActive: options.isActive !== false,
  });
  return { editor, setEditor };
}

/**
 * Applies one keystroke and triggers the matching handler.
 *
 * @param editor - The current editor state.
 * @param input - The printable characters of the keystroke.
 * @param key - The special-key flags.
 * @param handlers - What a submit or an interrupt triggers.
 * @param setEditor - Replaces the editor state.
 * @returns Nothing.
 */
function advance(
  editor: LineEditor,
  input: string,
  key: Key,
  handlers: LineHandlers,
  setEditor: (editor: LineEditor) => void,
): void {
  const next = editor.key(input, key);
  if (next.interrupted) {
    handlers.onInterrupt();
    return;
  }
  const line = next.submitted?.trim() ?? '';
  if (next.submitted === undefined || line === '') {
    setEditor(next);
    return;
  }
  setEditor(next.remember(line));
  handlers.onSubmit(line);
}
