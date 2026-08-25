// The viewport state, and the keys and the wheel that move it.

import { type Key, useInput } from 'ink';
import { useCallback, useState } from 'react';
import {
  FOLLOWING,
  linesBelow,
  scrollViewport,
  settleViewport,
  type Viewport,
} from '../machines/viewport.js';
import {
  type MouseEvent,
  type MouseInput,
  WHEEL_DOWN,
  WHEEL_UP,
} from '../system/mouse.js';
import type { TranscriptProps } from '../views/transcript.js';
import { useMouse } from './use-mouse.js';

/** The hook options. */
export interface TranscriptOptions {
  /** The mouse input from `createMouseInput`. The wheel moves the viewport
   * three lines while it is set. */
  mouse?: MouseInput;
  /** Whether keystrokes are consumed. True when omitted. */
  isActive?: boolean;
}

/** The measured sizes. */
interface Sizes {
  /** The viewport height in lines. */
  height: number;
  /** The content height in lines. */
  content: number;
}

/** The lines one wheel notch moves. */
const WHEEL_LINES = 3;

/** What `useTranscript` returns: the props for `Transcript` and the moves. */
export type TranscriptState = Pick<
  TranscriptProps,
  'offset' | 'following' | 'below' | 'onSize'
> & {
  /** Moves the viewport by a number of lines, negative for up. */
  scrollBy: (delta: number) => void;
  /** Returns the viewport to the end. */
  toEnd: () => void;
};

/**
 * Holds the viewport for a `Transcript` and feeds it the inputs: page up and
 * page down move a screen, the wheel moves three lines, and ctrl+end returns
 * to the end. The state lives in the calling component.
 *
 * @param options - The hook options.
 * @returns The props for `Transcript` except `items` and `hint`, and the moves.
 */
export function useTranscript(
  options: TranscriptOptions = {},
): TranscriptState {
  const [view, setView] = useState<Viewport>(FOLLOWING);
  const [sizes, setSizes] = useState<Sizes>({ height: 0, content: 0 });
  const onSize = useCallback(
    (height: number, content: number) => setSizes({ height, content }),
    [],
  );
  const { scrollBy, toEnd } = useMoves(setView, sizes);
  const onMouse = useCallback(
    (event: MouseEvent) => wheel(event, scrollBy),
    [scrollBy],
  );
  useMouse(options.mouse, onMouse);
  useInput((input, key) => move(input, key, sizes.height, scrollBy, toEnd), {
    isActive: options.isActive !== false,
  });
  const fitted = settleViewport(view, sizes.content, sizes.height);
  const below = linesBelow(fitted, sizes.content, sizes.height);
  return { ...fitted, below, onSize, scrollBy, toEnd };
}

/**
 * Builds the moves over the viewport state.
 *
 * @param setView - Replaces the viewport.
 * @param sizes - The measured sizes.
 * @returns The moves.
 */
function useMoves(
  setView: (update: (current: Viewport) => Viewport) => void,
  sizes: Sizes,
): Pick<TranscriptState, 'scrollBy' | 'toEnd'> {
  const scrollBy = useCallback(
    (delta: number) =>
      setView((current) =>
        scrollViewport(current, delta, sizes.content, sizes.height),
      ),
    [setView, sizes],
  );
  const toEnd = useCallback(() => setView(() => FOLLOWING), [setView]);
  return { scrollBy, toEnd };
}

/**
 * Applies a scrolling key.
 *
 * @param input - The printable characters of the keystroke.
 * @param key - The special-key flags.
 * @param height - The viewport height in lines.
 * @param scrollBy - Moves the viewport by a number of lines.
 * @param toEnd - Returns the viewport to the end.
 * @returns Nothing.
 */
function move(
  input: string,
  key: Key,
  height: number,
  scrollBy: (delta: number) => void,
  toEnd: () => void,
): void {
  const page = Math.max(1, height - 1);
  if (key.pageUp) {
    scrollBy(-page);
  } else if (key.pageDown) {
    scrollBy(page);
  } else if (key.end && key.ctrl && input === '') {
    toEnd();
  }
}

/**
 * Applies a wheel report.
 *
 * @param event - The mouse report.
 * @param scrollBy - Moves the viewport by a number of lines.
 * @returns Nothing.
 */
function wheel(event: MouseEvent, scrollBy: (delta: number) => void): void {
  if (event.button === WHEEL_UP) {
    scrollBy(-WHEEL_LINES);
  } else if (event.button === WHEEL_DOWN) {
    scrollBy(WHEEL_LINES);
  }
}
