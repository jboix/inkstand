// The visible slice of a list.

/** The visible slice of a list. */
export interface ListWindow {
  /** The index of the first visible row. */
  start: number;
  /** The index after the last visible row. */
  end: number;
  /** The number of rows above the window. */
  above: number;
  /** The number of rows below the window. */
  below: number;
}

/**
 * Computes the visible slice of a list. The window holds `maxRows` rows and
 * moves to keep the given row inside, centered where the ends allow it.
 *
 * @param count - The number of rows.
 * @param row - The row index the window keeps visible.
 * @param maxRows - The rows shown at once, floored to one; every row when
 * omitted.
 * @returns The window.
 */
export function listWindow(
  count: number,
  row: number,
  maxRows?: number,
): ListWindow {
  const rows = maxRows === undefined ? count : Math.max(1, Math.floor(maxRows));
  if (rows >= count) {
    return { start: 0, end: count, above: 0, below: 0 };
  }
  const kept = Math.min(Math.max(row, 0), count - 1);
  const start = Math.min(
    Math.max(kept - Math.floor((rows - 1) / 2), 0),
    count - rows,
  );
  return {
    start,
    end: start + rows,
    above: start,
    below: count - start - rows,
  };
}
