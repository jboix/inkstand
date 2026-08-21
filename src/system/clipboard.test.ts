import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type ClipboardIo, copyToClipboard } from './clipboard.js';

/** A fake io that records tool runs and terminal writes. */
interface FakeIo {
  /** The io under test. */
  io: ClipboardIo;
  /** The commands run, with their arguments. */
  ran: string[][];
  /** The escape sequences written. */
  wrote: string[];
}

/**
 * Builds a fake io whose listed commands succeed.
 *
 * @param platform - The reported platform.
 * @param working - The commands that report success.
 * @returns The fake io and its recorders.
 */
function fakeIo(platform: NodeJS.Platform, working: string[]): FakeIo {
  const ran: string[][] = [];
  const wrote: string[] = [];
  return {
    io: {
      run: (command, args): boolean => {
        ran.push([command, ...args]);
        return working.includes(command);
      },
      write: (data): void => {
        wrote.push(data);
      },
      platform,
    },
    ran,
    wrote,
  };
}

test('uses pbcopy on macOS', () => {
  const fake = fakeIo('darwin', ['pbcopy']);
  assert.equal(copyToClipboard('hello', fake.io), 'tool');
  assert.deepEqual(fake.ran, [['pbcopy']]);
  assert.deepEqual(fake.wrote, []);
});

test('tries the linux tools in order until one works', () => {
  const fake = fakeIo('linux', ['clip.exe']);
  assert.equal(copyToClipboard('hello', fake.io), 'tool');
  assert.deepEqual(
    fake.ran.map((call) => call[0]),
    ['wl-copy', 'xclip', 'clip.exe'],
  );
  assert.deepEqual(fake.wrote, []);
});

test('passes the clipboard selection to xclip', () => {
  const fake = fakeIo('linux', ['xclip']);
  copyToClipboard('hello', fake.io);
  assert.ok(
    fake.ran.some((call) => call[0] === 'xclip' && call[2] === 'clipboard'),
  );
});

test('falls back to OSC 52 when no tool works', () => {
  const fake = fakeIo('linux', []);
  assert.equal(copyToClipboard('hello', fake.io), 'osc52');
  assert.deepEqual(fake.wrote, [
    `\u001B]52;c;${Buffer.from('hello').toString('base64')}\u0007`,
  ]);
});

test('goes straight to OSC 52 on a platform without tools', () => {
  const fake = fakeIo('freebsd', ['pbcopy']);
  assert.equal(copyToClipboard('hello', fake.io), 'osc52');
  assert.deepEqual(fake.ran, []);
  assert.equal(fake.wrote.length, 1);
});
