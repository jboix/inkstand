// The tree view: rows with indentation and fold glyphs, arrows move and fold.

import { Box, Text, useInput } from 'ink';
import type { ReactElement } from 'react';
import { listWindow } from '../machines/list-window.js';
import { type TreeAction, type TreeRow, treeAction } from '../machines/tree.js';

/** One tree view. */
export interface TreeViewProps {
  /** The visible rows, from `Tree.rows`. */
  rows: TreeRow[];
  /** The highlighted row index. */
  highlight: number;
  /** Called with the new row index when the highlight moves. */
  onHighlight: (index: number) => void;
  /** Called with the node id to expand. */
  onExpand: (id: string) => void;
  /** Called with the node id to collapse. */
  onCollapse: (id: string) => void;
  /** Called with the node id when enter opens a row. */
  onOpen?: (id: string) => void;
  /** Whether the view reads the keyboard. True when omitted. */
  isActive?: boolean;
  /** The Ink color of the highlighted row. Cyan when omitted. */
  highlightColor?: string;
  /** The rows shown at once; every row when omitted. */
  maxRows?: number;
  /** The glyphs before a label. `▸ `, `▾ `, and two spaces when omitted. */
  glyphs?: TreeGlyphs;
}

/** The glyphs before a row label, one per fold state. */
export interface TreeGlyphs {
  /** Before a parent whose children are hidden. */
  collapsed: string;
  /** Before a parent whose children are shown. */
  expanded: string;
  /** Before a node without children. */
  leaf: string;
}

/** The glyphs used when the view gets none. */
const CHEVRONS: TreeGlyphs = { collapsed: '▸ ', expanded: '▾ ', leaf: '  ' };

/**
 * Renders the rows indented by depth with a glyph per fold state, each row
 * cut at the width. Controlled: the application holds the tree and the
 * highlight, and applies the callbacks.
 *
 * @param props - The component props.
 * @returns The tree element.
 */
export function TreeView(props: TreeViewProps): ReactElement {
  useInput(
    (input, key) =>
      apply(treeAction(props.rows, props.highlight, key, input), props),
    { isActive: props.isActive !== false },
  );
  const window = listWindow(props.rows.length, props.highlight, props.maxRows);
  return (
    <Box flexDirection="column">
      {window.above > 0 && <Text dimColor>{`  ↑ ${window.above} more`}</Text>}
      {props.rows.slice(window.start, window.end).map((row, offset) => (
        <Row
          glyphs={props.glyphs ?? CHEVRONS}
          highlightColor={props.highlightColor}
          highlighted={window.start + offset === props.highlight}
          key={row.id}
          row={row}
        />
      ))}
      {window.below > 0 && <Text dimColor>{`  ↓ ${window.below} more`}</Text>}
    </Box>
  );
}

/**
 * Renders one row.
 *
 * @param props - The component props.
 * @param props.row - The row.
 * @param props.highlighted - Whether the row is highlighted.
 * @param props.highlightColor - The Ink color of the highlighted row.
 * @param props.glyphs - The glyphs per fold state.
 * @returns The row element.
 */
function Row(props: {
  row: TreeRow;
  highlighted: boolean;
  highlightColor?: string;
  glyphs: TreeGlyphs;
}): ReactElement {
  const { row, glyphs } = props;
  return (
    <Text
      bold={props.highlighted}
      color={props.highlighted ? (props.highlightColor ?? 'cyan') : undefined}
      dimColor={!props.highlighted}
      wrap="truncate"
    >
      {props.highlighted ? '❯ ' : '  '}
      {'  '.repeat(row.depth)}
      {glyphFor(row, glyphs)}
      {row.label}
    </Text>
  );
}

/**
 * Formats the rows as plain text: each label indented by its depth, behind
 * the glyph of its fold state.
 *
 * @param rows - The visible rows, from `Tree.rows`.
 * @param glyphs - The glyphs before a label. Chevrons when omitted.
 * @returns The lines, joined by newlines.
 */
export function treeViewText(
  rows: readonly TreeRow[],
  glyphs: TreeGlyphs = CHEVRONS,
): string {
  return rows
    .map(
      (row) => `${'  '.repeat(row.depth)}${glyphFor(row, glyphs)}${row.label}`,
    )
    .join('\n');
}

/**
 * Picks the glyph of a row from its fold state.
 *
 * @param row - The row.
 * @param glyphs - The glyphs per fold state.
 * @returns The glyph before the label.
 */
function glyphFor(row: TreeRow, glyphs: TreeGlyphs): string {
  if (!row.hasChildren) {
    return glyphs.leaf;
  }
  return row.expanded ? glyphs.expanded : glyphs.collapsed;
}

/**
 * Applies an action through the callbacks.
 *
 * @param action - The action.
 * @param props - The callbacks.
 * @returns Nothing.
 */
function apply(action: TreeAction, props: TreeViewProps): void {
  switch (action.kind) {
    case 'highlight':
      props.onHighlight(action.index);
      return;
    case 'expand':
      props.onExpand(action.id);
      return;
    case 'collapse':
      props.onCollapse(action.id);
      return;
    case 'open':
      props.onOpen?.(action.id);
      return;
    default:
      return;
  }
}
