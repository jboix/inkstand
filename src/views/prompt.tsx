// The input line in a rounded box. Controlled: value and caret come in as props.

import { Box, Text } from 'ink';
import type { ReactElement } from 'react';
import { LineEditorView } from './line-editor-view.js';

/**
 * Renders the input line.
 *
 * @param props - The component props.
 * @param props.value - The current line.
 * @param props.cursor - The caret position.
 * @param props.prefix - The characters before the input; `> ` when omitted.
 * @returns The prompt element.
 */
export function Prompt(props: {
  value: string;
  cursor: number;
  prefix?: string;
}): ReactElement {
  return (
    <Box borderStyle="round" paddingX={1}>
      <Text color="cyan">{props.prefix ?? '> '}</Text>
      <LineEditorView cursor={props.cursor} value={props.value} />
    </Box>
  );
}
