// The scrollback: every pushed block, printed once through Ink's Static.

import { Box, Static } from 'ink';
import type { ReactElement, ReactNode } from 'react';

/** One scrollback block. */
export interface OutputItem {
  /** Stable identity for Ink's Static list. */
  id: number;
  /** The rendered block. */
  node: ReactNode;
}

/**
 * Renders the scrollback blocks, oldest first. Controlled: the items come in
 * as a prop.
 *
 * @param props - The component props.
 * @param props.items - The blocks to render.
 * @param props.generation - Remounts the list when it changes, repainting the
 * scrollback after a terminal clear. See `useRedraw`.
 * @returns The scrollback element.
 */
export function Scrollback(props: {
  items: OutputItem[];
  generation?: number;
}): ReactElement {
  return (
    <Static items={props.items} key={props.generation ?? 0}>
      {(item: OutputItem) => (
        <Box key={item.id} paddingX={1}>
          {item.node}
        </Box>
      )}
    </Static>
  );
}
