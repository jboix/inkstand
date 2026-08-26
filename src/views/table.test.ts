import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tableText } from './table.js';

test('pads the columns to their widest cell and trims the line end', () => {
  assert.equal(
    tableText({
      columns: [{ label: 'name' }, { label: 'size' }],
      rows: [
        ['logs-000001', '1gb'],
        ['a', '12mb'],
      ],
    }),
    ['name         size', 'logs-000001  1gb', 'a            12mb'].join('\n'),
  );
});

test('pads a right aligned column from the left', () => {
  assert.equal(
    tableText({
      columns: [{ label: 'name' }, { label: 'size', alignRight: true }],
      rows: [
        ['logs-000001', '1gb'],
        ['a', '12mb'],
      ],
    }),
    ['name         size', 'logs-000001   1gb', 'a            12mb'].join('\n'),
  );
});

test('uses the header width when the header is the widest', () => {
  assert.equal(
    tableText({ columns: [{ label: 'template' }], rows: [['t1']] }),
    'template\nt1',
  );
});

test('returns the header alone for a table without rows', () => {
  assert.equal(tableText({ columns: [{ label: 'name' }], rows: [] }), 'name');
});

test('pads a row that is missing trailing cells', () => {
  assert.equal(
    tableText({
      columns: [{ label: 'name' }, { label: 'state' }],
      rows: [['logs'], ['metrics', 'open']],
    }),
    ['name     state', 'logs', 'metrics  open'].join('\n'),
  );
});
