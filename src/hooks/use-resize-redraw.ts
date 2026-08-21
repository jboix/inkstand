// Optional glue: repaint when the terminal is resized.

import { useStdout } from 'ink';
import { useEffect } from 'react';

/**
 * Calls `redraw` on every terminal resize. A stale frame rewraps at the new
 * width and breaks the layout, so the viewport is cleared and the scrollback
 * is rendered again.
 *
 * @param redraw - Clears the terminal and repaints. Comes from `useRedraw`.
 * @returns Nothing.
 */
export function useResizeRedraw(redraw: () => void): void {
  const { stdout } = useStdout();
  useEffect(() => {
    stdout.on('resize', redraw);
    return () => {
      stdout.off('resize', redraw);
    };
  }, [stdout, redraw]);
}
