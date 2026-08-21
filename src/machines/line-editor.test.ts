import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Key } from 'ink';
import { LineEditor } from './line-editor.js';

// The flags the editor reads, all off. Ink's `Key` carries more, and the
// editor ignores them.
const BASE = {
  backspace: false,
  ctrl: false,
  delete: false,
  downArrow: false,
  end: false,
  escape: false,
  home: false,
  leftArrow: false,
  meta: false,
  return: false,
  rightArrow: false,
  upArrow: false,
} as Key;

/**
 * Builds key flags on top of the all-false base.
 *
 * @param flags - The flags to set.
 * @returns The key flags.
 */
function keyOf(flags: Partial<Key> = {}): Key {
  return { ...BASE, ...flags };
}

/**
 * Types printable text one character at a time.
 *
 * @param editor - The editor to type into.
 * @param text - The text to type.
 * @returns The editor after typing.
 */
function type(editor: LineEditor, text: string): LineEditor {
  let current = editor;
  for (const char of text) {
    current = current.key(char, keyOf());
  }
  return current;
}

test('typing inserts at the caret', () => {
  const editor = type(LineEditor.create(), 'ab')
    .key('', keyOf({ leftArrow: true }))
    .key('c', keyOf());
  assert.equal(editor.value, 'acb');
  assert.equal(editor.cursor, 2);
});

test('backspace deletes before the caret, delete removes at the caret', () => {
  const backspaced = type(LineEditor.create(), 'abc').key(
    '',
    keyOf({ backspace: true }),
  );
  assert.equal(backspaced.value, 'ab');
  const forward = type(LineEditor.create(), 'abc')
    .key('', keyOf({ leftArrow: true }))
    .key('', keyOf({ leftArrow: true }))
    .key('', keyOf({ delete: true }));
  assert.equal(forward.value, 'ac');
  assert.equal(forward.cursor, 1);
});

test('ctrl+a and ctrl+e jump to the line start and end', () => {
  const editor = type(LineEditor.create(), 'abc').key(
    'a',
    keyOf({ ctrl: true }),
  );
  assert.equal(editor.cursor, 0);
  assert.equal(editor.key('e', keyOf({ ctrl: true })).cursor, 3);
});

test('home and end jump to the line start and end', () => {
  const editor = type(LineEditor.create(), 'abc').key(
    '',
    keyOf({ home: true }),
  );
  assert.equal(editor.cursor, 0);
  assert.equal(editor.key('', keyOf({ end: true })).cursor, 3);
});

test('the caret stays inside the line', () => {
  const editor = type(LineEditor.create(), 'a')
    .key('', keyOf({ rightArrow: true }))
    .key('', keyOf({ rightArrow: true }));
  assert.equal(editor.cursor, 1);
  assert.equal(editor.key('', keyOf({ leftArrow: true })).cursor, 0);
});

test('ctrl+w kills the word before the caret, spaces included', () => {
  const once = type(LineEditor.create(), 'index ls  foo').key(
    'w',
    keyOf({ ctrl: true }),
  );
  assert.equal(once.value, 'index ls  ');
  assert.equal(once.key('w', keyOf({ ctrl: true })).value, 'index ');
});

test('ctrl+u kills to the start, ctrl+k kills to the end', () => {
  const editor = type(LineEditor.create(), 'abcd')
    .key('', keyOf({ leftArrow: true }))
    .key('', keyOf({ leftArrow: true }));
  assert.equal(editor.key('u', keyOf({ ctrl: true })).value, 'cd');
  assert.equal(editor.key('k', keyOf({ ctrl: true })).value, 'ab');
});

test('meta with the arrows moves word by word', () => {
  const editor = type(LineEditor.create(), 'index ls foo').key(
    '',
    keyOf({ leftArrow: true, meta: true }),
  );
  assert.equal(editor.cursor, 9);
  const back = editor.key('', keyOf({ leftArrow: true, meta: true }));
  assert.equal(back.cursor, 6);
  assert.equal(back.key('', keyOf({ rightArrow: true, meta: true })).cursor, 8);
});

test('enter submits the line and clears the editor', () => {
  const editor = type(LineEditor.create(), '/help').key(
    '',
    keyOf({ return: true }),
  );
  assert.equal(editor.submitted, '/help');
  assert.equal(editor.value, '');
  assert.equal(editor.cursor, 0);
});

test('a pasted chunk ending in a newline submits its text', () => {
  const editor = LineEditor.create().key('sekret\n', keyOf());
  assert.equal(editor.submitted, 'sekret');
  assert.equal(editor.value, '');
});

test('the submitted flag lasts one keystroke', () => {
  const editor = type(LineEditor.create(), 'x')
    .key('', keyOf({ return: true }))
    .key('a', keyOf());
  assert.equal(editor.submitted, undefined);
  assert.equal(editor.value, 'a');
});

test('remember stores executed lines once per run', () => {
  const editor = LineEditor.create().remember('/help').remember('/help');
  assert.deepEqual(editor.history, ['/help']);
  assert.deepEqual(editor.remember('/version').history, ['/help', '/version']);
});

test('up and down browse the history and restore the draft', () => {
  const editor = type(LineEditor.create(['/version', '/help']), 'dra');
  const back = editor.key('', keyOf({ upArrow: true }));
  assert.equal(back.value, '/help');
  const further = back.key('', keyOf({ upArrow: true }));
  assert.equal(further.value, '/version');
  assert.equal(further.key('', keyOf({ upArrow: true })).value, '/version');
  const down = further.key('', keyOf({ downArrow: true }));
  assert.equal(down.value, '/help');
  assert.equal(down.key('', keyOf({ downArrow: true })).value, 'dra');
});

test('ctrl+c clears the line, and interrupts when it is already empty', () => {
  const cleared = type(LineEditor.create(), 'abc').key(
    'c',
    keyOf({ ctrl: true }),
  );
  assert.equal(cleared.value, '');
  assert.equal(cleared.interrupted, false);
  assert.equal(cleared.key('c', keyOf({ ctrl: true })).interrupted, true);
});

test('escape clears the line', () => {
  const editor = type(LineEditor.create(), 'abc').key(
    '',
    keyOf({ escape: true }),
  );
  assert.equal(editor.value, '');
});

test('withValue replaces the line and puts the caret at the end', () => {
  const editor = LineEditor.create().withValue('/profile ');
  assert.equal(editor.value, '/profile ');
  assert.equal(editor.cursor, 9);
});
