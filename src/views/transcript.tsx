// The transcript: past output blocks in a viewport that shows the slice at an offset.

import { Box, type DOMElement, Text, useBoxMetrics } from 'ink';
import type { ReactElement } from 'react';
import { useEffect, useRef } from 'react';
import type { OutputItem } from './scrollback.js';

/** The transcript props. */
export interface TranscriptProps {
  /** The blocks, oldest first. */
  items: OutputItem[];
  /** The content line at the top of the viewport. */
  offset: number;
  /** Whether the viewport is at the end. A line under it appears otherwise. */
  following: boolean;
  /** The content lines below the viewport, shown in that line. */
  below: number;
  /** How to return to the end, such as `ctrl+end returns to the end`. */
  hint?: string;
  /** Called with the viewport height and the content height in lines. */
  onSize: (height: number, content: number) => void;
}

/**
 * Renders the blocks in a viewport that takes the space its parent gives it,
 * and reports the viewport and content heights.
 *
 * @param props - The component props.
 * @returns The transcript element.
 */
export function Transcript(props: TranscriptProps): ReactElement {
  const frame = useRef<DOMElement>(null);
  const content = useRef<DOMElement>(null);
  const height = useBoxMetrics(frame).height;
  const lines = useBoxMetrics(content).height;
  const { onSize } = props;
  useEffect(() => {
    onSize(height, lines);
  }, [onSize, height, lines]);
  return (
    <>
      <Box
        flexBasis={0}
        flexDirection="column"
        flexGrow={1}
        minHeight={0}
        overflowY="hidden"
        ref={frame}
      >
        <Box
          flexDirection="column"
          flexShrink={0}
          marginTop={-props.offset}
          ref={content}
        >
          {props.items.map((item) => (
            <Box flexShrink={0} key={item.id}>
              {item.node}
            </Box>
          ))}
        </Box>
      </Box>
      {!props.following && <Below count={props.below} hint={props.hint} />}
    </>
  );
}

/**
 * Renders the line under the viewport that counts the hidden lines.
 *
 * @param props - The component props.
 * @param props.count - The content lines below the viewport.
 * @param props.hint - How to return to the end.
 * @returns The line element.
 */
function Below(props: { count: number; hint?: string }): ReactElement {
  return (
    <Box flexShrink={0}>
      <Text dimColor wrap="truncate">
        ↓ {props.count} more {props.count === 1 ? 'line' : 'lines'} below
        {props.hint === undefined ? '' : `. ${props.hint}`}
      </Text>
    </Box>
  );
}
