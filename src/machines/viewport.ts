// The viewport: which slice of a transcript is on screen.

/** The scroll position of a transcript. */
export interface Viewport {
  /** The content line at the top of the screen. */
  offset: number;
  /** Whether the viewport stays at the end as content arrives. */
  following: boolean;
}

/** The viewport at the end. */
export const FOLLOWING: Viewport = { offset: 0, following: true };

/**
 * Computes the offset that puts the last content line at the bottom.
 *
 * @param content - The content height in lines.
 * @param height - The screen height in lines.
 * @returns The offset of the end position.
 */
function endOffset(content: number, height: number): number {
  return Math.max(0, content - height);
}

/**
 * Fits the viewport to the content: a following viewport moves to the end, a
 * browsing one stays in range and starts following when it reaches the end.
 *
 * @param view - The viewport.
 * @param content - The content height in lines.
 * @param height - The screen height in lines.
 * @returns The fitted viewport.
 */
export function settleViewport(
  view: Viewport,
  content: number,
  height: number,
): Viewport {
  const end = endOffset(content, height);
  if (view.following || view.offset >= end) {
    return { offset: end, following: true };
  }
  return { offset: Math.max(0, view.offset), following: false };
}

/**
 * Moves the viewport by a number of lines. Reaching the end resumes following.
 *
 * @param view - The viewport.
 * @param delta - The lines to move, negative for up.
 * @param content - The content height in lines.
 * @param height - The screen height in lines.
 * @returns The moved viewport.
 */
export function scrollViewport(
  view: Viewport,
  delta: number,
  content: number,
  height: number,
): Viewport {
  const from = view.following ? endOffset(content, height) : view.offset;
  return settleViewport(
    { offset: from + delta, following: false },
    content,
    height,
  );
}

/**
 * Counts the content lines below the screen.
 *
 * @param view - The viewport.
 * @param content - The content height in lines.
 * @param height - The screen height in lines.
 * @returns The hidden lines below.
 */
export function linesBelow(
  view: Viewport,
  content: number,
  height: number,
): number {
  return (
    endOffset(content, height) - settleViewport(view, content, height).offset
  );
}
