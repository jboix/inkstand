// The status bar: short segments in one row.

import { Box, Text } from 'ink';
import type { ReactElement, ReactNode } from 'react';

/** One status bar segment. */
export interface StatusSegment {
  /** The displayed text. */
  text: string;
  /** The Ink color name; the default color when omitted. */
  color?: string;
  /** Dim the segment when set. */
  dim?: boolean;
}

/** One status bar. */
export interface StatusBarProps {
  /** The segments, in display order, along the left. */
  segments: StatusSegment[];
  /** A node pushed to the right edge, such as a hint. */
  right?: ReactNode;
}

/**
 * Renders the segments along the left, separated by one space, and the right
 * node at the far edge. Controlled: the application computes both.
 *
 * @param props - The component props.
 * @returns The bar element, or null when there is nothing to show.
 */
export function StatusBar(props: StatusBarProps): ReactElement | null {
  if (props.segments.length === 0 && props.right === undefined) {
    return null;
  }
  return (
    <Box gap={2} justifyContent="space-between" paddingX={1}>
      <Box columnGap={1}>
        {props.segments.map((segment) => (
          <Text
            color={segment.color}
            dimColor={segment.dim === true}
            key={`${segment.color ?? ''}:${segment.text}`}
          >
            {segment.text}
          </Text>
        ))}
      </Box>
      {props.right !== undefined && <Box flexShrink={0}>{props.right}</Box>}
    </Box>
  );
}
