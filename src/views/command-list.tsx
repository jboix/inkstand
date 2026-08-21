// Command names and descriptions, padded to one width.

import { Box, Text } from 'ink';
import type { ReactElement } from 'react';
import type { CommandInfo } from '../machines/router.js';

/** One command list. */
export interface CommandListProps {
  /** The commands to list, in display order. */
  commands: CommandInfo[];
  /** Dim the lines, for the suggestion list. */
  dim?: boolean;
  /** The index to mark, from `useSuggestions`. */
  highlight?: number;
}

/**
 * Renders a command list. Serves as the help block and, dimmed, as the
 * suggestion list under a prompt. A highlighted row carries a marker and
 * keeps its color while the rest stay dimmed.
 *
 * @param props - The component props.
 * @returns The list element, or null for an empty list.
 */
export function CommandList(props: CommandListProps): ReactElement | null {
  if (props.commands.length === 0) {
    return null;
  }
  const width =
    Math.max(...props.commands.map((command) => command.name.length)) + 2;
  return (
    <Box flexDirection="column" paddingX={1}>
      {props.commands.map((command, index) => (
        <Text
          color={index === props.highlight ? 'cyan' : undefined}
          dimColor={props.dim === true && index !== props.highlight}
          key={command.name}
        >
          {props.highlight === undefined ? '' : marker(index, props.highlight)}
          {command.name.padEnd(width)} {command.description}
        </Text>
      ))}
    </Box>
  );
}

/**
 * Builds the marker column of one row.
 *
 * @param index - The row index.
 * @param highlight - The highlighted index.
 * @returns The marker, or two spaces.
 */
function marker(index: number, highlight: number): string {
  return index === highlight ? '❯ ' : '  ';
}
