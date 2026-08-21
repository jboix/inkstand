// The facade smoke test. Importing the barrel loads every module, so the
// coverage report measures the whole package instead of only the parts a
// unit test happens to reach.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as inkstand from './index.js';

test('the facade exports a defined value under every name', () => {
  const entries = Object.entries(inkstand);
  assert.notEqual(entries.length, 0);
  for (const [name, value] of entries) {
    assert.notEqual(value, undefined, `${name} is undefined`);
  }
});
