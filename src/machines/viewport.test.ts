import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  FOLLOWING,
  linesBelow,
  scrollViewport,
  settleViewport,
} from './viewport.js';

test('a following viewport sits at the end', () => {
  assert.deepEqual(settleViewport(FOLLOWING, 30, 10), {
    offset: 20,
    following: true,
  });
  assert.deepEqual(settleViewport(FOLLOWING, 5, 10), {
    offset: 0,
    following: true,
  });
});

test('scrolling up stops following', () => {
  const view = scrollViewport(FOLLOWING, -3, 30, 10);
  assert.deepEqual(view, { offset: 17, following: false });
  assert.equal(linesBelow(view, 30, 10), 3);
});

test('a browsing viewport keeps its place as content grows', () => {
  const view = { offset: 4, following: false };
  assert.deepEqual(settleViewport(view, 100, 10), view);
  assert.equal(linesBelow(view, 100, 10), 86);
});

test('scrolling past the edges clamps', () => {
  assert.equal(
    scrollViewport({ offset: 2, following: false }, -9, 30, 10).offset,
    0,
  );
  assert.deepEqual(
    scrollViewport({ offset: 2, following: false }, 99, 30, 10),
    {
      offset: 20,
      following: true,
    },
  );
});

test('reaching the end resumes following', () => {
  assert.equal(
    scrollViewport({ offset: 17, following: false }, 3, 30, 10).following,
    true,
  );
  assert.equal(
    settleViewport({ offset: 25, following: false }, 30, 10).following,
    true,
  );
});
