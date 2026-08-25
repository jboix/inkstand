import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Key } from 'ink';
import { Tree, type TreeNode, treeAction } from './tree.js';

const NODES: TreeNode[] = [
  { id: 'shows', label: 'Shows' },
  { id: 's1', parentId: 'shows', label: 'Season 1' },
  { id: 's2', parentId: 'shows', label: 'Season 2' },
  { id: 'ep1', parentId: 's1', label: 'Episode 1' },
  { id: 'trailers', label: 'Trailers' },
];

// The flags the tree reads, all off. Ink's `Key` carries more, and the
// tree ignores them.
const NO_KEY = {
  upArrow: false,
  downArrow: false,
  leftArrow: false,
  rightArrow: false,
  pageDown: false,
  pageUp: false,
  return: false,
  escape: false,
  ctrl: false,
  shift: false,
  tab: false,
  backspace: false,
  delete: false,
  meta: false,
} as Key;

/**
 * Builds a key with one flag set.
 *
 * @param name - The flag name.
 * @returns The key.
 */
function key(name: keyof Key): Key {
  return { ...NO_KEY, [name]: true };
}

test('rows lists the root nodes when nothing is expanded', () => {
  assert.deepEqual(
    Tree.create(NODES).rows.map((row) => [row.id, row.depth, row.hasChildren]),
    [
      ['shows', 0, true],
      ['trailers', 0, false],
    ],
  );
});

test('rows lists the children of expanded nodes depth first', () => {
  const tree = Tree.create(NODES, ['shows', 's1']);
  assert.deepEqual(
    tree.rows.map((row) => `${'  '.repeat(row.depth)}${row.label}`),
    ['Shows', '  Season 1', '    Episode 1', '  Season 2', 'Trailers'],
  );
  assert.equal(tree.rows[0]?.expanded, true);
  assert.equal(tree.rows[3]?.expanded, false);
});

test('expand and collapse return new trees and keep the old one', () => {
  const closed = Tree.create(NODES);
  const open = closed.expand('shows');
  assert.equal(closed.isExpanded('shows'), false);
  assert.equal(open.isExpanded('shows'), true);
  assert.equal(open.collapse('shows').isExpanded('shows'), false);
});

test('withNodes keeps the expanded ids', () => {
  const tree = Tree.create(NODES, ['shows']).withNodes([
    { id: 'shows', label: 'Shows' },
    { id: 's3', parentId: 'shows', label: 'Season 3' },
  ]);
  assert.deepEqual(
    tree.rows.map((row) => row.id),
    ['shows', 's3'],
  );
});

test('parentOf reports the parent, undefined for roots and unknown ids', () => {
  const tree = Tree.create(NODES);
  assert.equal(tree.parentOf('s1'), 'shows');
  assert.equal(tree.parentOf('shows'), undefined);
  assert.equal(tree.parentOf('nope'), undefined);
});

test('treeAction moves the highlight around the ends', () => {
  const rows = Tree.create(NODES).rows;
  assert.deepEqual(treeAction(rows, 0, key('downArrow')), {
    kind: 'highlight',
    index: 1,
  });
  assert.deepEqual(treeAction(rows, 1, key('downArrow')), {
    kind: 'highlight',
    index: 0,
  });
  assert.deepEqual(treeAction(rows, 0, key('upArrow')), {
    kind: 'highlight',
    index: 1,
  });
});

test('treeAction expands a collapsed parent on right, and ignores a leaf', () => {
  const rows = Tree.create(NODES).rows;
  assert.deepEqual(treeAction(rows, 0, key('rightArrow')), {
    kind: 'expand',
    id: 'shows',
  });
  assert.deepEqual(treeAction(rows, 1, key('rightArrow')), { kind: 'none' });
});

test('treeAction opens on enter, whatever the fold state', () => {
  const closed = Tree.create(NODES).rows;
  assert.deepEqual(treeAction(closed, 0, key('return')), {
    kind: 'open',
    id: 'shows',
  });
  const open = Tree.create(NODES, ['shows']).rows;
  assert.deepEqual(treeAction(open, 0, key('return')), {
    kind: 'open',
    id: 'shows',
  });
  assert.deepEqual(treeAction(open, 3, key('return')), {
    kind: 'open',
    id: 'trailers',
  });
});

test('treeAction folds and unfolds a parent on space', () => {
  const closed = Tree.create(NODES).rows;
  assert.deepEqual(treeAction(closed, 0, NO_KEY, ' '), {
    kind: 'expand',
    id: 'shows',
  });
  const open = Tree.create(NODES, ['shows']).rows;
  assert.deepEqual(treeAction(open, 0, NO_KEY, ' '), {
    kind: 'collapse',
    id: 'shows',
  });
  assert.deepEqual(treeAction(open, 3, NO_KEY, ' '), { kind: 'none' });
});

test('treeAction collapses on left, else moves to the parent', () => {
  const rows = Tree.create(NODES, ['shows', 's1']).rows;
  assert.deepEqual(treeAction(rows, 0, key('leftArrow')), {
    kind: 'collapse',
    id: 'shows',
  });
  assert.deepEqual(treeAction(rows, 2, key('leftArrow')), {
    kind: 'highlight',
    index: 1,
  });
  assert.deepEqual(treeAction(rows, 4, key('leftArrow')), { kind: 'none' });
});

test('treeAction does nothing without rows or for other keys', () => {
  assert.deepEqual(treeAction([], 0, key('downArrow')), { kind: 'none' });
  assert.deepEqual(treeAction(Tree.create(NODES).rows, 0, key('escape')), {
    kind: 'none',
  });
});
