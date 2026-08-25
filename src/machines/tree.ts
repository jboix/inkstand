// The tree: nodes with parents, an expanded set, and the visible rows.

import type { Key } from 'ink';

/** One tree node. */
export interface TreeNode {
  /** The node id. Unique within the tree. */
  id: string;
  /** The parent id; a root node when omitted. */
  parentId?: string;
  /** The displayed label. */
  label: string;
}

/** One visible row of the tree. */
export interface TreeRow {
  /** The node id. */
  id: string;
  /** The displayed label. */
  label: string;
  /** The nesting depth, zero for a root node. */
  depth: number;
  /** Whether the node has children. */
  hasChildren: boolean;
  /** Whether the children are shown. */
  expanded: boolean;
}

/** What one keystroke on the tree asks for. */
export type TreeAction =
  | { kind: 'highlight'; index: number }
  | { kind: 'expand'; id: string }
  | { kind: 'collapse'; id: string }
  | { kind: 'open'; id: string }
  | { kind: 'none' };

/** The tree state: the nodes and which ones are expanded. Immutable. */
export class Tree {
  /** The nodes, in sibling order. */
  readonly nodes: readonly TreeNode[];
  /** The ids of the expanded nodes. */
  private readonly expanded: ReadonlySet<string>;

  /**
   * Creates a tree state.
   *
   * @param nodes - The nodes, in sibling order.
   * @param expanded - The ids of the expanded nodes.
   */
  private constructor(
    nodes: readonly TreeNode[],
    expanded: ReadonlySet<string>,
  ) {
    this.nodes = nodes;
    this.expanded = expanded;
  }

  /**
   * Creates a tree with the given nodes.
   *
   * @param nodes - The nodes, in sibling order.
   * @param expanded - The ids to start expanded; none when omitted.
   * @returns The tree.
   */
  static create(
    nodes: readonly TreeNode[],
    expanded: Iterable<string> = [],
  ): Tree {
    return new Tree(nodes, new Set(expanded));
  }

  /**
   * Replaces the nodes and keeps the expanded ids.
   *
   * @param nodes - The nodes, in sibling order.
   * @returns The tree.
   */
  withNodes(nodes: readonly TreeNode[]): Tree {
    return new Tree(nodes, this.expanded);
  }

  /**
   * Reports whether the node shows its children.
   *
   * @param id - The node id.
   * @returns Whether the node is expanded.
   */
  isExpanded(id: string): boolean {
    return this.expanded.has(id);
  }

  /**
   * Shows the children of a node.
   *
   * @param id - The node id.
   * @returns The tree.
   */
  expand(id: string): Tree {
    return new Tree(this.nodes, new Set([...this.expanded, id]));
  }

  /**
   * Hides the children of a node.
   *
   * @param id - The node id.
   * @returns The tree.
   */
  collapse(id: string): Tree {
    const expanded = new Set(this.expanded);
    expanded.delete(id);
    return new Tree(this.nodes, expanded);
  }

  /**
   * Returns the parent id of a node.
   *
   * @param id - The node id.
   * @returns The parent id, or undefined for a root node or an unknown id.
   */
  parentOf(id: string): string | undefined {
    return this.nodes.find((node) => node.id === id)?.parentId;
  }

  /**
   * Returns the visible rows: the root nodes and the children of every
   * expanded node, depth first, in sibling order.
   *
   * @returns The rows.
   */
  get rows(): TreeRow[] {
    const rows: TreeRow[] = [];
    const visit = (parentId: string | undefined, depth: number): void => {
      for (const node of this.nodes) {
        if (node.parentId !== parentId) {
          continue;
        }
        const hasChildren = this.nodes.some(
          (child) => child.parentId === node.id,
        );
        const expanded = hasChildren && this.expanded.has(node.id);
        rows.push({
          id: node.id,
          label: node.label,
          depth,
          hasChildren,
          expanded,
        });
        if (expanded) {
          visit(node.id, depth + 1);
        }
      }
    };
    visit(undefined, 0);
    return rows;
  }
}

/**
 * Maps one keystroke on the rows to an action. Up and down move the
 * highlight, around the ends. Right expands a collapsed parent, left
 * collapses an expanded node and moves to the parent of any other, space
 * folds or unfolds a parent, and enter opens the row.
 *
 * @param rows - The visible rows.
 * @param highlight - The highlighted row index.
 * @param key - The special-key flags.
 * @param input - The typed character; a space folds or unfolds.
 * @returns The action.
 */
export function treeAction(
  rows: readonly TreeRow[],
  highlight: number,
  key: Key,
  input = '',
): TreeAction {
  const count = rows.length;
  const row = rows[highlight];
  if (count === 0 || row === undefined) {
    return { kind: 'none' };
  }
  if (key.upArrow) {
    return { kind: 'highlight', index: (highlight + count - 1) % count };
  }
  if (key.downArrow) {
    return { kind: 'highlight', index: (highlight + 1) % count };
  }
  if (key.return) {
    return { kind: 'open', id: row.id };
  }
  if (key.rightArrow || input === ' ') {
    return foldAction(row, input === ' ');
  }
  if (key.leftArrow) {
    return leftAction(rows, highlight, row);
  }
  return { kind: 'none' };
}

/**
 * Maps right or space on a row: right expands a collapsed parent, space
 * expands or collapses it.
 *
 * @param row - The highlighted row.
 * @param toggle - Whether the key was space.
 * @returns The action.
 */
function foldAction(row: TreeRow, toggle: boolean): TreeAction {
  if (!row.hasChildren) {
    return { kind: 'none' };
  }
  if (!row.expanded) {
    return { kind: 'expand', id: row.id };
  }
  return toggle ? { kind: 'collapse', id: row.id } : { kind: 'none' };
}

/**
 * Maps left on a row.
 *
 * @param rows - The visible rows.
 * @param highlight - The highlighted row index.
 * @param row - The highlighted row.
 * @returns The action.
 */
function leftAction(
  rows: readonly TreeRow[],
  highlight: number,
  row: TreeRow,
): TreeAction {
  if (row.expanded) {
    return { kind: 'collapse', id: row.id };
  }
  for (let index = highlight - 1; index >= 0; index -= 1) {
    if ((rows[index]?.depth ?? 0) < row.depth) {
      return { kind: 'highlight', index };
    }
  }
  return { kind: 'none' };
}
