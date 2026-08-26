import assert from 'node:assert/strict';
import { test } from 'node:test';
import { diffViewText } from './diff-view.js';

test('puts the marker before every line', () => {
  assert.equal(
    diffViewText([
      { sign: '@', text: '@@ -1,2 +1,2 @@' },
      { sign: ' ', text: 'kept' },
      { sign: '-', text: 'old' },
      { sign: '+', text: 'new' },
    ]),
    ['@ @@ -1,2 +1,2 @@', '  kept', '- old', '+ new'].join('\n'),
  );
});

test('returns an empty string for an empty diff', () => {
  assert.equal(diffViewText([]), '');
});
