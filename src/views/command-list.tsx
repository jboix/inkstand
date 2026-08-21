// Command names and descriptions, padded to one width.

import { Box, type Key, Text, useInput } from 'ink';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import type { CommandInfo } from '../machines/router.js';

/** One command list. */
export interface CommandListProps {
  /** The commands to list, in display order. */
  commands: CommandInfo[];
  /** Dim the lines, for the suggestion list. */
  dim?: boolean;
  /** Whether the list reads the keys and marks the highlighted row. */
  focused?: boolean;
  /** The Ink color of the highlighted row. Cyan when omitted. */
  highlightColor?: string;
  /** Called with the highlighted command on enter, while focused. */
  onPick?: (command: CommandInfo) => void;
  /** Called when a keystroke moves the focus out of the list. */
  onBlur?: () => void;
}

/**
 * Renders a command list. Serves as the help block and, dimmed, as the
 * suggestion list under a prompt. While `focused`, the list reads the keys:
 * the arrows move the highlight, enter picks the highlighted command, and
 * any other key blurs. The highlight is ephemeral: it resets when the list
 * gains the focus.
 *
 * @param props - The component props.
 * @returns The list element, or null for an empty list.
 */
export function CommandList(props: CommandListProps): ReactElement | null {
  const [highlight, setHighlight] = useState(0);
  const focused = props.focused === true && props.commands.length > 0;
  const clamped = Math.min(highlight, Math.max(props.commands.length - 1, 0));
  useEffect(() => {
    if (focused) {
      setHighlight(0);
    }
  }, [focused]);
  useInput((_input, key) => handleKey(key, clamped, setHighlight, props), {
    isActive: focused,
  });
  if (props.commands.length === 0) {
    return null;
  }
  const width =
    Math.max(...props.commands.map((command) => command.name.length)) + 2;
  return (
    <Box flexDirection="column" paddingX={1}>
      {props.commands.map((command, index) => (
        <Text
          color={
            focused && index === clamped
              ? (props.highlightColor ?? 'cyan')
              : undefined
          }
          dimColor={props.dim === true && !(focused && index === clamped)}
          key={command.name}
        >
          {focused ? marker(index, clamped) : ''}
          {command.name.padEnd(width)} {command.description}
        </Text>
      ))}
    </Box>
  );
}

/**
 * Applies one keystroke while the list is focused.
 *
 * @param key - The special-key flags.
 * @param highlight - The highlighted index.
 * @param setHighlight - Replaces the highlighted index.
 * @param props - The component props.
 * @returns Nothing.
 */
function handleKey(
  key: Key,
  highlight: number,
  setHighlight: (update: (current: number) => number) => void,
  props: CommandListProps,
): void {
  const count = props.commands.length;
  if (key.upArrow || key.downArrow) {
    const delta = key.upArrow ? -1 : 1;
    setHighlight(
      (current) => (Math.min(current, count - 1) + delta + count) % count,
    );
    return;
  }
  if (key.return) {
    const picked = props.commands[highlight];
    if (picked !== undefined) {
      props.onPick?.(picked);
    }
  }
  props.onBlur?.();
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
