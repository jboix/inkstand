import assert from 'node:assert/strict';
import { test } from 'node:test';
import { listWindow } from './list-window.js';

test('shows every row when maxRows is omitted', () => {
  assert.deepEqual(listWindow(5, 2), { start: 0, end: 5, above: 0, below: 0 });
});

test('shows every row when maxRows covers the list', () => {
  assert.deepEqual(listWindow(5, 2, 5), {
    start: 0,
    end: 5,
    above: 0,
    below: 0,
  });
  assert.deepEqual(listWindow(5, 2, 9), {
    start: 0,
    end: 5,
    above: 0,
    below: 0,
  });
});

test('anchors at the top while the kept row fits the first half', () => {
  assert.deepEqual(listWindow(10, 0, 3), {
    start: 0,
    end: 3,
    above: 0,
    below: 7,
  });
  assert.deepEqual(listWindow(10, 1, 3), {
    start: 0,
    end: 3,
    above: 0,
    below: 7,
  });
});

test('centers the kept row between the ends', () => {
  assert.deepEqual(listWindow(10, 5, 3), {
    start: 4,
    end: 7,
    above: 4,
    below: 3,
  });
});

test('anchors at the bottom for the last rows', () => {
  assert.deepEqual(listWindow(10, 9, 3), {
    start: 7,
    end: 10,
    above: 7,
    below: 0,
  });
});

test('clamps a kept row outside the list', () => {
  assert.deepEqual(listWindow(10, -3, 3), {
    start: 0,
    end: 3,
    above: 0,
    below: 7,
  });
  assert.deepEqual(listWindow(10, 42, 3), {
    start: 7,
    end: 10,
    above: 7,
    below: 0,
  });
});

test('floors maxRows to one row', () => {
  assert.deepEqual(listWindow(4, 2, 0), {
    start: 2,
    end: 3,
    above: 2,
    below: 1,
  });
});

test('returns the empty window for an empty list', () => {
  assert.deepEqual(listWindow(0, 0, 3), {
    start: 0,
    end: 0,
    above: 0,
    below: 0,
  });
});
