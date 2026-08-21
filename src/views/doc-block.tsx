// A shown document: a summary line over a folded or expanded body.

import { Box, Text } from 'ink';
import type { ReactElement } from 'react';

/** The lines a folded document shows, when the caller names no other count. */
const PREVIEW_LINES = 10;

/** One document block. */
export interface DocBlockProps {
  /** The block title, such as `template "logs"`. */
  title: string;
  /** The document body. */
  text: string;
  /** Show the whole body. Folded when omitted. */
  expanded?: boolean;
  /** The lines a folded body shows. Ten when omitted. */
  previewLines?: number;
  /** How to change the fold, such as `ctrl+o expands`. */
  hint?: string;
}

/**
 * Renders a document block. A body longer than the preview shows its first
 * lines and a fold marker. The application owns the `expanded` flag and the
 * key that changes it.
 *
 * @param props - The component props.
 * @returns The document block element.
 */
export function DocBlock(props: DocBlockProps): ReactElement {
  const preview = props.previewLines ?? PREVIEW_LINES;
  const lines = props.text.split('\n');
  const foldable = lines.length > preview;
  const folded = props.expanded !== true && foldable;
  const hidden = lines.length - preview;
  return (
    <Box flexDirection="column">
      <Text dimColor>
        {summary(
          props.title,
          lines.length,
          folded,
          foldable ? props.hint : undefined,
        )}
      </Text>
      <Text>{(folded ? lines.slice(0, preview) : lines).join('\n')}</Text>
      {folded && (
        <Text dimColor>
          … {hidden} more {hidden === 1 ? 'line' : 'lines'}
        </Text>
      )}
    </Box>
  );
}

/**
 * Builds the summary line of a document block.
 *
 * @param title - The block title.
 * @param count - The body line count.
 * @param folded - Whether the body is cut at the preview.
 * @param hint - How to change the fold, when the body is foldable.
 * @returns The summary line.
 */
function summary(
  title: string,
  count: number,
  folded: boolean,
  hint?: string,
): string {
  const arrow = folded ? '▸' : '▾';
  const unit = count === 1 ? 'line' : 'lines';
  const tail = hint === undefined ? '' : `, ${hint}`;
  return `${arrow} ${title} (${count} ${unit}${tail})`;
}
