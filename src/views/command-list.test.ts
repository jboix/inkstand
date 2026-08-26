import assert from 'node:assert/strict';
import { test } from 'node:test';
import { commandListText } from './command-list.js';

test('pads the names to the longest one plus the marker width', () => {
  assert.equal(
    commandListText([
      { name: '/help', description: 'Show the commands' },
      { name: '/index ls', description: 'List the indices' },
    ]),
    ['/help       Show the commands', '/index ls   List the indices'].join(
      '\n',
    ),
  );
});

test('keeps the commands in the given order', () => {
  assert.equal(
    commandListText([
      { name: '/b', description: 'Second' },
      { name: '/a', description: 'First' },
    ]),
    '/b   Second\n/a   First',
  );
});

test('returns an empty string for an empty list', () => {
  assert.equal(commandListText([]), '');
});
