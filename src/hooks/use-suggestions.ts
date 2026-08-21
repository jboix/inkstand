// Optional glue: the highlight of a suggestion list.

import { useCallback, useState } from 'react';
import type { CommandInfo } from '../machines/router.js';

/** A suggestion list and the actions that move through it. */
export interface Suggestions {
  /** The commands to show, in display order. */
  items: CommandInfo[];
  /** The index to mark, while the list has the focus. */
  highlight?: number;
  /** The highlighted command, while the list has the focus. */
  picked?: CommandInfo;
  /** Moves the highlight by the given delta, wrapping around. */
  move: (delta: number) => void;
  /** Puts the highlight back on the first item. */
  reset: () => void;
}

/**
 * Holds the highlight over a list the application supplies, usually
 * `router.suggest(value)`. The application owns the focus flag, because it
 * also decides whether the line editor reads the keys. The state lives in the
 * calling component.
 *
 * @param items - The commands to show.
 * @param focused - Whether the list has the focus.
 * @returns The list and its actions.
 */
export function useSuggestions(
  items: CommandInfo[],
  focused: boolean,
): Suggestions {
  const [highlight, setHighlight] = useState(0);
  const clamped = Math.min(highlight, Math.max(items.length - 1, 0));
  const move = useCallback(
    (delta: number) =>
      setHighlight((current) => {
        const count = items.length;
        if (count === 0) {
          return 0;
        }
        const from = Math.min(current, count - 1);
        return (from + delta + count) % count;
      }),
    [items.length],
  );
  const reset = useCallback(() => setHighlight(0), []);
  const active = focused && items.length > 0;
  return {
    items,
    highlight: active ? clamped : undefined,
    picked: active ? items[clamped] : undefined,
    move,
    reset,
  };
}
