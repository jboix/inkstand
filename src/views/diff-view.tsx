// Diff lines colored by their sign.

import { Box, Text } from 'ink';
import type { ReactElement } from 'react';
import type { DiffLine } from '../text/line-diff.js';

/** The line colors per sign. */
const COLORS: Record<DiffLine['sign'], string | undefined> = {
  '+': 'green',
  '-': 'red',
  '@': 'cyan',
  ' ': undefined,
};

/**
 * Renders diff lines: added green, removed red, hunk headers cyan, unchanged
 * in the default color.
 *
 * @param props - The component props.
 * @param props.lines - The lines, from `diffLines` or an application summary.
 * @returns The lines element.
 */
export function DiffView(props: { lines: DiffLine[] }): ReactElement {
  return (
    <Box flexDirection="column">
      {withIds(props.lines).map((row) => (
        <Text color={COLORS[row.line.sign]} key={row.id}>
          {row.line.sign} {row.line.text}
        </Text>
      ))}
    </Box>
  );
}

/**
 * Gives each line a stable identity within the render. Diff lines are
 * positional and may repeat, so the position is part of the identity.
 *
 * @param lines - The lines to identify.
 * @returns The lines with their identities.
 */
function withIds(lines: DiffLine[]): { id: string; line: DiffLine }[] {
  return lines.map((line, position) => ({
    id: `${position}:${line.sign}${line.text}`,
    line,
  }));
}
