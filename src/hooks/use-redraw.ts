// Optional glue: clear the terminal and repaint the scrollback.

import { useStdout } from 'ink';
import { useCallback, useState } from 'react';

/**
 * Holds the scrollback generation. `redraw` clears the terminal, re-hides the
 * cursor, and bumps the generation; pass the generation to `<Scrollback>` so
 * the blocks repaint at the current width. Needed after an external editor
 * and on terminal resize.
 *
 * @returns The generation and the redraw function.
 */
export function useRedraw(): {
  /** The scrollback generation, passed to `<Scrollback>`. */
  generation: number;
  /** Clears the terminal and repaints everything. */
  redraw: () => void;
} {
  const { write } = useStdout();
  const [generation, setGeneration] = useState(0);
  const redraw = useCallback(() => {
    write('\u001B[2J\u001B[H\u001B[?25l');
    setGeneration((current) => current + 1);
  }, [write]);
  return { generation, redraw };
}
