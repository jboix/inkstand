// Command names and descriptions, padded to one width.

import { Box, type Key, Text, useInput } from 'ink';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { listWindow } from '../machines/list-window.js';
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
  /**
   * The rows shown at once; every row when omitted. The window follows the
   * highlight, and one line above and below counts the hidden rows.
   */
  maxRows?: number;
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
  return (
    <Rows
      color={props.highlightColor ?? 'cyan'}
      commands={props.commands}
      dim={props.dim === true}
      focused={focused}
      highlight={clamped}
      maxRows={props.maxRows}
    />
  );
}

/**
 * Renders the visible window of the command rows.
 *
 * @param props - The component props.
 * @param props.commands - The commands to list.
 * @param props.focused - Whether the list has the focus.
 * @param props.highlight - The highlighted index.
 * @param props.dim - Whether the unhighlighted rows dim.
 * @param props.color - The Ink color of the highlighted row.
 * @param props.maxRows - The rows shown at once; every row when omitted.
 * @returns The rows element.
 */
function Rows(props: {
  commands: CommandInfo[];
  focused: boolean;
  highlight: number;
  dim: boolean;
  color: string;
  maxRows?: number;
}): ReactElement {
  const width = nameWidth(props.commands);
  const kept = props.focused ? props.highlight : 0;
  const window = listWindow(props.commands.length, kept, props.maxRows);
  return (
    <Box flexDirection="column" paddingX={1}>
      {window.above > 0 && <Text dimColor>… {window.above} more above</Text>}
      {props.commands.slice(window.start, window.end).map((command, offset) => (
        <CommandRow
          color={props.color}
          command={command}
          dim={props.dim}
          focused={props.focused}
          key={command.name}
          marked={props.focused && window.start + offset === props.highlight}
          width={width}
        />
      ))}
      {window.below > 0 && <Text dimColor>… {window.below} more below</Text>}
    </Box>
  );
}

/**
 * Formats the commands as plain text, one line per command, the names padded
 * to one width.
 *
 * @param commands - The commands to list, in display order.
 * @returns The lines, joined by newlines.
 */
export function commandListText(commands: CommandInfo[]): string {
  const width = nameWidth(commands);
  return commands
    .map((command) => `${command.name.padEnd(width)} ${command.description}`)
    .join('\n');
}

/**
 * Measures the name column: the longest name plus the marker width.
 *
 * @param commands - The commands to list.
 * @returns The width the names are padded to.
 */
function nameWidth(commands: CommandInfo[]): number {
  return Math.max(0, ...commands.map((command) => command.name.length)) + 2;
}

/**
 * Renders one command row.
 *
 * @param props - The component props.
 * @param props.command - The command of the row.
 * @param props.marked - Whether the row is the highlighted one.
 * @param props.focused - Whether the list has the focus.
 * @param props.dim - Whether the unhighlighted rows dim.
 * @param props.color - The Ink color of the highlighted row.
 * @param props.width - The width the command names are padded to.
 * @returns The row element.
 */
function CommandRow(props: {
  command: CommandInfo;
  marked: boolean;
  focused: boolean;
  dim: boolean;
  color: string;
  width: number;
}): ReactElement {
  return (
    <Text
      color={props.marked ? props.color : undefined}
      dimColor={props.dim && !props.marked}
    >
      {props.focused ? marker(props.marked) : ''}
      {props.command.name.padEnd(props.width)} {props.command.description}
    </Text>
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
 * @param marked - Whether the row is the highlighted one.
 * @returns The marker, or two spaces.
 */
function marker(marked: boolean): string {
  return marked ? '❯ ' : '  ';
}
