import assert from 'node:assert/strict';
import { test } from 'node:test';
import { noticeText } from './notice.js';

test('marks the message by tone', () => {
  assert.equal(noticeText({ tone: 'error', message: 'Failed.' }), '✖ Failed.');
  assert.equal(noticeText({ tone: 'success', message: 'Done.' }), '✔ Done.');
  assert.equal(noticeText({ tone: 'warn', message: 'Careful.' }), '! Careful.');
  assert.equal(noticeText({ tone: 'info', message: 'Ready.' }), '› Ready.');
});

test('puts the details on their own line', () => {
  assert.equal(
    noticeText({ tone: 'error', message: 'Failed.', details: '{ "a": 1 }' }),
    '✖ Failed.\n{ "a": 1 }',
  );
});
