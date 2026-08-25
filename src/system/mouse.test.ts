import assert from 'node:assert/strict';
import { test } from 'node:test';
import { splitMouse } from './mouse.js';

const ESC = '\u001B';

test('passes plain input through', () => {
  assert.deepEqual(splitMouse('abc'), { text: 'abc', events: [], rest: '' });
});

test('takes the reports out and keeps the keys', () => {
  const split = splitMouse(`a${ESC}[<65;10;5Mb${ESC}[<0;3;4m`);
  assert.equal(split.text, 'ab');
  assert.deepEqual(split.events, [
    { button: 65, x: 10, y: 5, pressed: true },
    { button: 0, x: 3, y: 4, pressed: false },
  ]);
  assert.equal(split.rest, '');
});

test('holds an unfinished report back', () => {
  const split = splitMouse(`x${ESC}[<64;1`);
  assert.equal(split.text, 'x');
  assert.deepEqual(split.events, []);
  assert.equal(split.rest, `${ESC}[<64;1`);
});

test('does not hold a lone escape or an arrow key', () => {
  assert.deepEqual(splitMouse(ESC), { text: ESC, events: [], rest: '' });
  assert.equal(splitMouse(`${ESC}[A`).text, `${ESC}[A`);
});
