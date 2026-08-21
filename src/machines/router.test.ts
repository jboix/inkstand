import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type Command, createRouter } from './router.js';

/**
 * Builds a command with the given name.
 *
 * @param name - The command name.
 * @returns The command.
 */
function commandOf(name: string): Command<unknown> {
  return { name, description: name, run: () => undefined };
}

test('match resolves the longest name first', () => {
  const router = createRouter([commandOf('/index'), commandOf('/index ls')]);
  assert.equal(router.match('/index ls logs')?.command.name, '/index ls');
  assert.equal(router.match('/index')?.command.name, '/index');
});

test('match accepts a line without the leading slash', () => {
  const router = createRouter([commandOf('/help')]);
  assert.equal(router.match('help')?.command.name, '/help');
});

test('match splits the arguments on whitespace', () => {
  const router = createRouter([commandOf('/index ls')]);
  assert.deepEqual(router.match('/index ls  a   b')?.args, ['a', 'b']);
  assert.deepEqual(router.match('/index ls')?.args, []);
});

test('match returns undefined for unknown lines and name prefixes', () => {
  const router = createRouter([commandOf('/index ls')]);
  assert.equal(router.match('/nope'), undefined);
  assert.equal(router.match('/index lsx'), undefined);
});

test('suggest filters by prefix, with or without the slash', () => {
  const router = createRouter([commandOf('/index ls'), commandOf('/help')]);
  assert.deepEqual(
    router.suggest('/ind').map((command) => command.name),
    ['/index ls'],
  );
  assert.deepEqual(
    router.suggest('he').map((command) => command.name),
    ['/help'],
  );
  assert.equal(router.suggest('').length, 2);
});
