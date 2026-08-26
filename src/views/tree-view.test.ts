import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Tree } from '../machines/tree.js';
import { treeViewText } from './tree-view.js';

const NODES = [
  { id: 'logs', label: 'logs' },
  { id: 'logs-1', parentId: 'logs', label: 'logs-000001' },
  { id: 'logs-2', parentId: 'logs', label: 'logs-000002' },
  { id: 'metrics', label: 'metrics' },
];

test('indents each label by its depth', () => {
  const tree = Tree.create(NODES, ['logs']);
  assert.equal(
    treeViewText(tree.rows),
    ['▾ logs', '    logs-000001', '    logs-000002', '  metrics'].join('\n'),
  );
});

test('marks a collapsed parent and hides its children', () => {
  assert.equal(
    treeViewText(Tree.create(NODES).rows),
    ['▸ logs', '  metrics'].join('\n'),
  );
});

test('takes the glyphs the caller gives it', () => {
  assert.equal(
    treeViewText(Tree.create(NODES).rows, {
      collapsed: '+ ',
      expanded: '- ',
      leaf: '. ',
    }),
    ['+ logs', '. metrics'].join('\n'),
  );
});

test('returns an empty string for an empty tree', () => {
  assert.equal(treeViewText([]), '');
});
