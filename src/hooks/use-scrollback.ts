// Optional glue: useState around the scrollback array.

import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import type { OutputItem } from '../views/scrollback.js';

/**
 * Holds the scrollback array for the application. The state lives in the
 * calling component.
 *
 * @param first - The first block, for example a header.
 * @returns The blocks and the push function.
 */
export function useScrollback(first?: ReactNode): {
  /** The blocks, oldest first. */
  items: OutputItem[];
  /** Appends a block. */
  push: (node: ReactNode) => void;
} {
  const [items, setItems] = useState<OutputItem[]>(() =>
    first === undefined ? [] : [{ id: 0, node: first }],
  );
  const push = useCallback((node: ReactNode) => {
    setItems((previous) => [...previous, { id: previous.length, node }]);
  }, []);
  return { items, push };
}
