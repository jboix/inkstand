// The pane: a bordered region with a title, bright when focused.

import { Box, Text } from 'ink';
import type { ReactElement, ReactNode } from 'react';

/** One pane. */
export interface PaneProps {
  /** The title, shown on the first row. */
  title: string;
  /** Whether the pane reads the keyboard. The border and title follow it. */
  focused?: boolean;
  /** The content. */
  children?: ReactNode;
  /** A short text at the right end of the title row, such as a count. */
  detail?: string;
  /** The Ink color of the focused border and title. Cyan when omitted. */
  focusColor?: string;
  /** The width in cells or percent; the content width when omitted. */
  width?: number | string;
  /** The height in cells or percent; the content height when omitted. */
  height?: number | string;
  /** Whether the pane takes the free space of its row or column. */
  grow?: boolean;
}

/**
 * Renders the content inside a rounded border with the title on the first
 * row. A focused pane draws both in the focus color; the others are dim.
 *
 * @param props - The component props.
 * @returns The pane element.
 */
export function Pane(props: PaneProps): ReactElement {
  const focused = props.focused === true;
  const color = focused ? (props.focusColor ?? 'cyan') : undefined;
  return (
    <Box
      borderColor={color}
      borderDimColor={!focused}
      borderStyle="round"
      flexDirection="column"
      flexGrow={props.grow === true ? 1 : 0}
      height={props.height}
      overflow="hidden"
      paddingX={1}
      width={props.width}
    >
      <Box justifyContent="space-between">
        <Text bold={focused} color={color} dimColor={!focused}>
          {props.title}
        </Text>
        {props.detail !== undefined && <Text dimColor>{props.detail}</Text>}
      </Box>
      {props.children}
    </Box>
  );
}
